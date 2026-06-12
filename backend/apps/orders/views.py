from __future__ import annotations

from decimal import Decimal

from django.db import models, transaction
from django.db.models import F, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import log_action
from apps.products.models import Product, ProductVariant

from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory, OrderTransitionError
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    OrderDetailSerializer,
    OrderItemSerializer,
    OrderListSerializer,
    OrderStatusHistorySerializer,
)


class CartViewSet(viewsets.ModelViewSet):
    """Cart management."""

    serializer_class = CartSerializer

    def get_queryset(self):
        qs = Cart.objects.filter(organization_id=self.request.org_id)
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    @action(detail=True, methods=["post"], url_path="items/add")
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get("product")
        variant_id = request.data.get("variant")
        quantity = int(request.data.get("quantity", 1))

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
            cart=cart, product=product, variant=variant,
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

        with transaction.atomic():
            # Validate inventory before creating order
            for cart_item in cart.items.select_related("product", "variant").all():
                product = cart_item.product
                if product.track_inventory:
                    locked_product = Product.objects.select_for_update().get(id=product.id)
                    if locked_product.inventory_quantity < cart_item.quantity and not locked_product.allow_backorder:
                        return Response(
                            {"detail": f"Insufficient stock for '{product.title}'. Available: {locked_product.inventory_quantity}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

            order = Order.objects.create(
                organization=cart.organization,
                store=cart.store,
                customer=cart.customer,
                customer_email=customer_email,
                customer_first_name=request.data.get("customer_first_name", cart.customer.first_name if cart.customer else ""),
                customer_last_name=request.data.get("customer_last_name", cart.customer.last_name if cart.customer else ""),
                customer_phone=request.data.get("customer_phone", cart.customer.phone if cart.customer else ""),
                subtotal=cart.subtotal,
                tax_amount=Decimal("0"),
                shipping_amount=Decimal("0"),
                discount_amount=Decimal("0"),
                total=Decimal("0"),
                shipping_address_line1=request.data.get("shipping_address_line1", ""),
                shipping_address_line2=request.data.get("shipping_address_line2", ""),
                shipping_city=request.data.get("shipping_city", ""),
                shipping_state=request.data.get("shipping_state", ""),
                shipping_postal_code=request.data.get("shipping_postal_code", ""),
                shipping_country=request.data.get("shipping_country", ""),
            )

            # Calculate totals server-side
            order.total = order.subtotal + order.tax_amount + order.shipping_amount - order.discount_amount
            order.save(update_fields=["total"])

            for cart_item in cart.items.select_related("product", "variant").all():
                product = cart_item.product
                if product.track_inventory:
                    Product.objects.filter(id=product.id).update(
                        inventory_quantity=F("inventory_quantity") - cart_item.quantity,
                        total_sold=F("total_sold") + cart_item.quantity,
                        total_revenue=F("total_revenue") + cart_item.line_total,
                    )

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=cart_item.variant,
                    title=product.title,
                    sku=product.sku,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.unit_price,
                    total_price=Decimal(str(cart_item.line_total)),
                    image_url=product.primary_image.url if product.primary_image else "",
                )

            cart.status = "converted"
            cart.save(update_fields=["status"])

        log_action(
            action="order.create",
            resource_type="order",
            resource_id=order.id,
            organization_id=self.request.org_id,
            user=self.request.user,
            new_value=OrderDetailSerializer(order).data,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
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


class OrderViewSet(viewsets.ModelViewSet):
    """Order management with filtering."""

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return OrderDetailSerializer
        return OrderListSerializer

    def get_queryset(self):
        qs = Order.objects.select_related("store", "customer").prefetch_related("items").filter(
            organization_id=self.request.org_id
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
        new_status = request.data.get("status")
        notes = request.data.get("notes", "")
        try:
            order.transition_status(new_status, changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def update_payment_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("payment_status")
        valid = [c[0] for c in Order.PAYMENT_STATUS_CHOICES]
        if new_status not in valid:
            return Response({"detail": f"Invalid payment status. Must be one of: {valid}"}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_status = new_status
        order.save(update_fields=["payment_status", "updated_at"])
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
        try:
            order.transition_status("shipped", changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        order = self.get_object()
        notes = request.data.get("notes", "")
        try:
            order.transition_status("delivered", changed_by=request.user, notes=notes)
        except OrderTransitionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        notes = request.data.get("notes", "")
        try:
            order.cancel(changed_by=request.user, notes=notes)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
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
