from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet
from apps.products.models import Product, ProductVariant

from .models import Cart, CartItem, Order, OrderTransitionError
from .serializers import (
    CartSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderStatusHistorySerializer,
)


class CartViewSet(TenantViewSet):
    """Cart management."""

    serializer_class = CartSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Cart.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        org_id = self.request.org_id
        if not org_id:
            raise DRFValidationError({"detail": "You must belong to an organization."})
        store = serializer.validated_data.get("store")
        if store is None:
            raise DRFValidationError({"store": "This field is required."})
        if str(store.organization_id) != str(org_id):
            raise DRFValidationError({"store": "Store does not belong to your organization."})
        serializer.save(organization_id=org_id)

    @action(detail=True, methods=["post"], url_path="items/add")
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get("product")
        variant_id = request.data.get("variant")
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id, store=cart.store)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        unit_price = product.price
        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
                unit_price = variant.price
            except ProductVariant.DoesNotExist:
                return Response({"detail": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={"quantity": quantity, "unit_price": unit_price},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity", "updated_at"])

        cart.recalculate()
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=["post"], url_path="items/update")
    def update_item(self, request, pk=None):
        cart = self.get_object()
        item_id = request.data.get("item_id")
        quantity = int(request.data.get("quantity", 1))

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save(update_fields=["quantity", "updated_at"])

        cart.recalculate()
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=["post"], url_path="items/remove")
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        item_id = request.data.get("item_id")
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        cart.recalculate()
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=["post"])
    def checkout(self, request, pk=None):
        cart = self.get_object()
        if cart.items.count() == 0:
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        customer_email = request.data.get("customer_email", "")
        if not customer_email and cart.customer:
            customer_email = cart.customer.email
        if not customer_email:
            return Response(
                {"detail": "customer_email is required for guest checkout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.commerce.services import (
            OrderLine,
            QuoteInput,
            build_quote,
            create_order_from_quote,
        )

        shipping_country = (request.data.get("shipping_country") or "").strip()
        shipping_state = (request.data.get("shipping_state") or "").strip()
        shipping_postal_code = (request.data.get("shipping_postal_code") or "").strip()
        discount_code = (request.data.get("discount_code") or "").strip()
        shipping_rate_id = request.data.get("shipping_rate_id") or None
        payment_method = request.data.get("payment_method") or "cod"

        cart_items = list(cart.items.select_related("product", "variant").all())
        quote_items = [
            (str(item.product_id), item.quantity, Decimal(str(item.line_total)))
            for item in cart_items
        ]

        with transaction.atomic():
            quote = build_quote(
                cart.organization_id,
                QuoteInput(
                    subtotal=cart.subtotal,
                    country=shipping_country,
                    state=shipping_state,
                    postal_code=shipping_postal_code,
                    discount_code=discount_code,
                    shipping_rate_id=shipping_rate_id,
                    customer_id=str(cart.customer_id) if cart.customer_id else None,
                    items=quote_items,
                ),
            )

            lines = [
                OrderLine(
                    product_id=str(item.product_id),
                    variant_id=str(item.variant_id) if item.variant_id else None,
                    title=item.product.title,
                    sku=item.product.sku,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    line_total=Decimal(str(item.line_total)),
                    image_url=item.product.primary_image.url if item.product.primary_image else "",
                    track_inventory=item.product.track_inventory,
                    allow_backorder=item.product.allow_backorder,
                    inventory_quantity=item.product.inventory_quantity,
                )
                for item in cart_items
            ]

            try:
                order = create_order_from_quote(
                    cart.store,
                    quote=quote,
                    lines=lines,
                    customer=cart.customer,
                    customer_email=customer_email,
                    customer_first_name=request.data.get(
                        "customer_first_name", cart.customer.first_name if cart.customer else ""
                    ),
                    customer_last_name=request.data.get(
                        "customer_last_name", cart.customer.last_name if cart.customer else ""
                    ),
                    customer_phone=request.data.get(
                        "customer_phone", cart.customer.phone if cart.customer else ""
                    ),
                    shipping_address={
                        "line1": request.data.get("shipping_address_line1", ""),
                        "line2": request.data.get("shipping_address_line2", ""),
                        "city": request.data.get("shipping_city", ""),
                        "state": shipping_state,
                        "postal_code": shipping_postal_code,
                        "country": shipping_country,
                    },
                    payment_method=payment_method,
                )
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            cart.status = "converted"
            cart.save(update_fields=["status"])

        self._log_audit(
            action="order.create",
            resource_type="order",
            resource_id=order.id,
            new_value=OrderDetailSerializer(order).data,
        )

        # Send notification to store owner
        from apps.notifications.models import Notification
        from apps.stores.models import Store

        try:
            store = Store.objects.get(id=cart.store_id)
            owner = store.organization.owner
            if owner:
                Notification.create_for_user(
                    user=owner,
                    notification_type="order",
                    title=f"New Order: {order.order_number}",
                    message=f"New order from {order.customer_email} — ${order.total}",
                    organization=store.organization,
                    entity_type="order",
                    entity_id=order.id,
                )
        except Exception:
            pass

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(TenantViewSet):
    """Order management with filtering."""

    required_permission = "orders.manage"

    @action(detail=False, methods=["post"], url_path="bulk-action")
    def bulk_action(self, request):
        """Apply a status action to many orders at once.

        Body: { "ids": [...], "action": "confirm|ship|deliver|cancel" }
        Skips orders whose transition is invalid; returns per-order results.
        """
        org_id = request.org_id
        if not org_id:
            return Response(
                {"detail": "Organization context required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ids = request.data.get("ids") or []
        action_name = request.data.get("action")
        valid_actions = {
            "confirm": "confirmed",
            "ship": "shipped",
            "deliver": "delivered",
            "cancel": "cancelled",
        }
        if action_name not in valid_actions:
            return Response(
                {"detail": f"action must be one of: {list(valid_actions)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = valid_actions[action_name]
        results = []
        orders = Order.unscoped.filter(organization_id=org_id, id__in=ids).select_related("store")

        for order in orders:
            try:
                order.transition_status(target, changed_by=request.user)
                results.append(
                    {
                        "id": str(order.id),
                        "order_number": order.order_number,
                        "status": order.status,
                        "ok": True,
                    }
                )
            except OrderTransitionError as exc:
                results.append(
                    {
                        "id": str(order.id),
                        "order_number": order.order_number,
                        "ok": False,
                        "error": str(exc),
                    }
                )

        missing = len(ids) - len(orders)
        return Response(
            {
                "applied": sum(1 for r in results if r["ok"]),
                "skipped": sum(1 for r in results if not r["ok"]) + missing,
                "results": results,
            }
        )

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """Stream the organization's orders as a CSV attachment."""
        import csv
        import io

        from django.http import HttpResponse

        org_id = request.org_id
        orders = (
            Order.objects.select_related("store", "customer")
            .prefetch_related("items")
            .filter(organization_id=org_id)
            .order_by("-created_at")
        )

        columns = [
            "order_number",
            "created_at",
            "status",
            "payment_status",
            "payment_method",
            "customer_email",
            "customer_name",
            "items_count",
            "subtotal",
            "shipping_amount",
            "tax_amount",
            "discount_amount",
            "discount_code",
            "total",
            "currency",
        ]

        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=columns)
        writer.writeheader()
        for order in orders:
            writer.writerow(
                {
                    "order_number": order.order_number,
                    "created_at": order.created_at.isoformat(),
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "payment_method": order.payment_method,
                    "customer_email": order.customer_email,
                    "customer_name": order.customer.full_name if order.customer else "",
                    "items_count": order.item_count,
                    "subtotal": order.subtotal,
                    "shipping_amount": order.shipping_amount,
                    "tax_amount": order.tax_amount,
                    "discount_amount": order.discount_amount,
                    "discount_code": order.discount_code,
                    "total": order.total,
                    "currency": order.currency,
                }
            )

        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'
        return response

    required_permission = "orders.manage"

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return OrderDetailSerializer
        return OrderListSerializer

    def get_queryset(self):
        qs = (
            Order.objects.select_related("store", "customer")
            .prefetch_related("items")
            .filter(organization_id=self.request.org_id)
        )
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        payment_status = self.request.query_params.get("payment_status")
        if payment_status:
            qs = qs.filter(payment_status=payment_status)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(customer_first_name__icontains=search)
                | Q(customer_last_name__icontains=search)
            )
        return qs

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        order = self.get_object()
        old_status = order.status
        new_status = request.data.get("status")
        notes = request.data.get("notes", "")
        try:
            order.transition_status(new_status, changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        self._log_audit(
            action="order.status.update",
            resource_type="order",
            resource_id=order.id,
            old_value={"status": old_status},
            new_value={"status": new_status, "notes": notes},
        )
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def update_payment_status(self, request, pk=None):
        order = self.get_object()
        old_payment_status = order.payment_status
        new_status = request.data.get("payment_status")
        valid = [c[0] for c in Order.PAYMENT_STATUS_CHOICES]
        if new_status not in valid:
            return Response(
                {"detail": f"Invalid payment status. Must be one of: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.payment_status = new_status
        order.save(update_fields=["payment_status", "updated_at"])
        self._log_audit(
            action="order.payment_status.update",
            resource_type="order",
            resource_id=order.id,
            old_value={"payment_status": old_payment_status},
            new_value={"payment_status": new_status},
        )
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def ship(self, request, pk=None):
        order = self.get_object()
        tracking_number = request.data.get("tracking_number", "")
        tracking_url = request.data.get("tracking_url", "")
        notes = request.data.get("notes", "")
        if tracking_number:
            order.tracking_number = tracking_number
        if tracking_url:
            order.tracking_url = tracking_url
        order.save(update_fields=["tracking_number", "tracking_url", "updated_at"])
        old_status = order.status
        try:
            order.transition_status("shipped", changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        self._log_audit(
            action="order.ship",
            resource_type="order",
            resource_id=order.id,
            old_value={"status": old_status},
            new_value={"status": "shipped", "tracking_number": tracking_number},
        )
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        order = self.get_object()
        notes = request.data.get("notes", "")
        old_status = order.status
        try:
            order.transition_status("delivered", changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        self._log_audit(
            action="order.deliver",
            resource_type="order",
            resource_id=order.id,
            old_value={"status": old_status},
            new_value={"status": "delivered"},
        )
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        notes = request.data.get("notes", "")
        old_status = order.status
        try:
            order.cancel(changed_by=request.user, notes=notes)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        self._log_audit(
            action="order.cancel",
            resource_type="order",
            resource_id=order.id,
            old_value={"status": old_status},
            new_value={"status": "cancelled", "notes": notes},
        )
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        order = self.get_object()
        history = order.status_history.all()
        return Response(OrderStatusHistorySerializer(history, many=True).data)

    @action(detail=True, methods=["post"])
    def add_note(self, request, pk=None):
        order = self.get_object()
        note_type = request.data.get("note_type", "internal")
        note = request.data.get("note", "")
        if note_type == "customer":
            order.customer_notes = note
        else:
            order.internal_notes = note
        order.save(update_fields=["customer_notes", "internal_notes", "updated_at"])
        return Response(OrderDetailSerializer(order).data)
