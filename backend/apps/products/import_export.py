"""CSV import/export for products.

Export: GET /api/v1/products/import-export/export/  → text/csv attachment
Import: POST /api/v1/products/import-export/import/ (multipart file=...)

CSV columns (header required):
title,sku,price,compare_at_price,description,status,collection,tags,inventory_quantity

- `title` is required; `sku` optional (generated from title + row when missing).
- Rows with an existing (organization, sku) are updated, others created.
- `collection` matches a Collection by name (created if missing).
- `tags` is a semicolon-separated list.
Returns a summary: created / updated / failed counts with row errors.
"""

from __future__ import annotations

import csv
import io
import logging

from django.db import transaction
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)

CSV_COLUMNS = [
    "title",
    "sku",
    "price",
    "compare_at_price",
    "description",
    "status",
    "collection",
    "tags",
    "inventory_quantity",
]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """Stream the organization's products as a CSV attachment."""
    from apps.products.models import Product

    org_id = request.org_id
    products = (
        Product.objects.filter(organization_id=org_id)
        .prefetch_related("collection_set")
        .order_by("title")
    )

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    for product in products:
        writer.writerow(
            {
                "title": product.title,
                "sku": product.sku,
                "price": product.price,
                "compare_at_price": product.compare_at_price or "",
                "description": product.description,
                "status": product.status,
                "collection": ";".join(product.collection_set.values_list("name", flat=True)),
                "tags": ";".join(product.tags or []),
                "inventory_quantity": product.inventory_quantity,
            }
        )

    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="products.csv"'
    return response


def _default_store_for(org_id, request):
    from apps.stores.models import Store

    store_id = request.query_params.get("store")
    if store_id:
        store = Store.unscoped.filter(id=store_id, organization_id=org_id).first()
        if store:
            return store
    store = Store.unscoped.filter(organization_id=org_id, is_active=True).first()
    if not store:
        raise ValueError("No active store found for this organization.")
    return store


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_csv(request):
    """Bulk-create/update products from an uploaded CSV file."""
    from django.utils.text import slugify

    from apps.products.models import Collection, Product

    org_id = request.org_id
    if not org_id:
        return Response(
            {"detail": "Organization context required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    upload = request.FILES.get("file")
    if not upload:
        return Response(
            {"detail": "Attach a CSV file as 'file'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        text = upload.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        return Response(
            {"detail": "File must be UTF-8 encoded CSV."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        default_store = _default_store_for(org_id, request)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "title" not in reader.fieldnames:
        return Response(
            {"detail": f"CSV must include a 'title' column. Found: {reader.fieldnames}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    created = 0
    updated = 0
    errors: list[dict] = []

    for row_number, row in enumerate(reader, start=2):
        title = (row.get("title") or "").strip()
        if not title:
            errors.append({"row": row_number, "error": "Missing title"})
            continue

        try:
            with transaction.atomic():
                defaults = {
                    "title": title,
                    "description": (row.get("description") or "").strip(),
                    "status": row.get("status") or "active",
                }
                if row.get("price"):
                    defaults["price"] = row["price"]
                if row.get("compare_at_price"):
                    defaults["compare_at_price"] = row["compare_at_price"]
                if row.get("inventory_quantity"):
                    defaults["inventory_quantity"] = int(row["inventory_quantity"])
                if row.get("tags"):
                    defaults["tags"] = [t.strip() for t in row["tags"].split(";") if t.strip()]

                sku = (row.get("sku") or "").strip()
                product = None
                if sku:
                    product = Product.unscoped.filter(organization_id=org_id, sku=sku).first()
                if product:
                    for field, value in defaults.items():
                        setattr(product, field, value)
                    product.save()
                    updated += 1
                else:
                    create_kwargs = dict(defaults)
                    create_kwargs["sku"] = sku or f"IMP-{slugify(title)}-{row_number}"
                    product = Product.unscoped.create(
                        organization_id=org_id,
                        store=default_store,
                        slug=f"{slugify(title) or 'product'}-{row_number}",
                        product_type="physical",
                        **create_kwargs,
                    )
                    created += 1

                if row.get("collection"):
                    for name in [c.strip() for c in row["collection"].split(";") if c.strip()]:
                        collection, _ = Collection.unscoped.get_or_create(
                            organization_id=org_id,
                            name=name,
                            store=default_store,
                            defaults={"slug": slugify(name)},
                        )
                        product.collection_set.add(collection)
        except Exception as exc:  # noqa: BLE001 — row-level isolation
            logger.warning("CSV import row %s failed: %s", row_number, exc)
            errors.append({"row": row_number, "error": str(exc)})

    return Response(
        {
            "created": created,
            "updated": updated,
            "failed": len(errors),
            "errors": errors[:20],
        }
    )
