"""Storefront endpoints for logged-in customers.

All customer views require a customer JWT (CustomerTokenAuthentication) and
scope every query to the authenticated customer, so a customer can only
ever see their own orders, wishlist, addresses and reviews.
"""

from __future__ import annotations

from rest_framework import (
    serializers,  # noqa: E402
    status,
)
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order

from .auth_views import CustomerTokenAuthentication
from .models import Address, Customer, Review, WishlistItem
from .serializers import AddressSerializer, WishlistItemSerializer


class StorefrontAddressInputSerializer(serializers.ModelSerializer):
    """Address input for storefront customers (store/customer set by the view)."""

    class Meta:
        model = Address
        fields = [
            "label",
            "first_name",
            "last_name",
            "company",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
        ]


class StorefrontReviewInputSerializer(serializers.Serializer):
    """Payload validation for customer-submitted product reviews."""

    product_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=255)
    body = serializers.CharField()


def _get_customer(request) -> Customer:
    """The authenticated customer (CustomerTokenAuthentication sets request.user)."""
    customer = request.user
    if not isinstance(customer, Customer):
        raise AuthenticationFailed("Customer authentication required.")
    return customer


def _serialize_order_summary(order: Order) -> dict:
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        "subtotal": str(order.subtotal),
        "tax_amount": str(order.tax_amount),
        "shipping_amount": str(order.shipping_amount),
        "discount_amount": str(order.discount_amount),
        "discount_code": order.discount_code,
        "total": str(order.total),
        "currency": order.currency,
        "items_count": order.item_count,
        "created_at": order.created_at.isoformat(),
    }


def _serialize_order_detail(order: Order) -> dict:
    return {
        **_serialize_order_summary(order),
        "customer_email": order.customer_email,
        "shipping_address": {
            "line1": order.shipping_address_line1,
            "line2": order.shipping_address_line2,
            "city": order.shipping_city,
            "state": order.shipping_state,
            "postal_code": order.shipping_postal_code,
            "country": order.shipping_country,
        },
        "items": [
            {
                "id": str(item.id),
                "title": item.title,
                "sku": item.sku,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "total_price": str(item.total_price),
                "image_url": item.image_url,
            }
            for item in order.items.all()
        ],
    }


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------


@api_view(["GET"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_orders(request):
    """The authenticated customer's orders (newest first)."""
    customer = _get_customer(request)
    orders = (
        Order.unscoped.filter(customer=customer)
        .prefetch_related("items")
        .order_by("-created_at")
    )
    return Response([_serialize_order_summary(o) for o in orders])


@api_view(["GET"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_order_detail(request, order_id):
    """One of the customer's own orders."""
    customer = _get_customer(request)
    order = (
        Order.unscoped.filter(id=order_id, customer=customer)
        .prefetch_related("items")
        .first()
    )
    if not order:
        return Response({"error": "Order not found."}, status=404)
    return Response(_serialize_order_detail(order))


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------


@api_view(["GET", "POST"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_wishlist(request):
    """List or add wishlist items for the authenticated customer."""
    customer = _get_customer(request)

    if request.method == "GET":
        items = WishlistItem.unscoped.filter(customer=customer).select_related("product")
        return Response(WishlistItemSerializer(items, many=True).data)

    # POST — add a product
    product_id = (request.data or {}).get("product_id")
    if not product_id:
        return Response({"error": "product_id is required."}, status=400)
    from apps.products.models import Product

    product = Product.unscoped.filter(id=product_id).first()
    if not product:
        return Response({"error": "Product not found."}, status=404)

    item, created = WishlistItem.unscoped.get_or_create(
        store_id=product.store_id,
        customer=customer,
        product=product,
        defaults={
            "organization_id": product.organization_id,
        },
    )
    return Response(
        {
            "added": created,
            "item": WishlistItemSerializer(item).data,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_wishlist_remove(request, product_id):
    """Remove a product from the customer's wishlist."""
    customer = _get_customer(request)
    deleted, _ = WishlistItem.unscoped.filter(
        customer=customer, product_id=product_id
    ).delete()
    if not deleted:
        return Response({"error": "Not in wishlist."}, status=404)
    return Response({"removed": True})


# ---------------------------------------------------------------------------
# Addresses
# ---------------------------------------------------------------------------


@api_view(["GET", "POST"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_addresses(request):
    """List or create addresses for the authenticated customer."""
    customer = _get_customer(request)

    if request.method == "GET":
        addresses = Address.unscoped.filter(customer=customer).order_by("-is_default", "label")
        return Response(AddressSerializer(addresses, many=True).data)

    data = dict(request.data or {})
    serializer = StorefrontAddressInputSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    address = serializer.save(
        organization_id=customer.organization_id,
        store_id=customer.store_id,
        customer=customer,
    )
    if data.get("is_default"):
        # Address.save already demotes others when is_default; ensure flag set
        if not address.is_default:
            address.is_default = True
            address.save(update_fields=["is_default", "updated_at"])
    return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_address_delete(request, address_id):
    """Delete one of the customer's addresses."""
    customer = _get_customer(request)
    deleted, _ = Address.unscoped.filter(customer=customer, id=address_id).delete()
    if not deleted:
        return Response({"error": "Address not found."}, status=404)
    return Response({"removed": True})


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------


@api_view(["POST"])
@authentication_classes([CustomerTokenAuthentication])
@permission_classes([IsAuthenticated])
def storefront_review_create(request):
    """Create (or replace) the customer's review for a product."""
    customer = _get_customer(request)
    serializer = StorefrontReviewInputSerializer(data=request.data or {})
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    from apps.products.models import Product

    product = Product.unscoped.filter(id=data["product_id"]).first()
    if not product:
        return Response({"error": "Product not found."}, status=404)

    review, created = Review.unscoped.update_or_create(
        store_id=product.store_id,
        customer=customer,
        product=product,
        defaults={
            "organization_id": product.organization_id,
            "rating": data["rating"],
            "title": data["title"],
            "body": data["body"],
            "is_approved": True,
        },
    )
    return Response(
        {
            "id": str(review.id),
            "product_id": str(product.id),
            "rating": review.rating,
            "title": review.title,
            "body": review.body,
            "created": created,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_product_reviews(request, subdomain=None, slug=None):
    """Public approved reviews for a product with a rating summary."""
    if subdomain is None or slug is None:
        return Response({"error": "Not found"}, status=404)

    from apps.storefront.views import get_store_by_slug

    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    from apps.products.models import Product

    product = Product.unscoped.filter(
        slug=slug, organization_id=store.organization_id, status="active"
    ).first()
    if not product:
        return Response({"error": "Product not found"}, status=404)

    reviews = Review.unscoped.filter(
        product=product, is_approved=True
    ).select_related("customer").order_by("-created_at")

    count = reviews.count()
    avg = 0
    if count:
        avg = round(sum(r.rating for r in reviews) / count, 2)

    distribution = {str(i): 0 for i in range(1, 6)}
    for r in reviews:
        distribution[str(r.rating)] += 1

    return Response(
        {
            "count": count,
            "average": avg,
            "distribution": distribution,
            "reviews": [
                {
                    "id": str(r.id),
                    "rating": r.rating,
                    "title": r.title,
                    "body": r.body,
                    "author": r.customer.full_name or (
                        r.customer.email.split("@")[0] if r.customer else "Guest"
                    ),
                    "created_at": r.created_at.isoformat(),
                }
                for r in reviews
            ],
        }
    )
