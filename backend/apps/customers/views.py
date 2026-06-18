from __future__ import annotations

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet

from .models import (
    Address,
    Customer,
    LoyaltyTransaction,
    Review,
    SavedCart,
    SavedCartItem,
    WishlistItem,
)
from .serializers import (
    AddressSerializer,
    CustomerSerializer,
    LoyaltyAdjustSerializer,
    LoyaltyTransactionSerializer,
    ReviewSerializer,
    SavedCartItemCreateSerializer,
    SavedCartItemSerializer,
    SavedCartSerializer,
    WishlistItemSerializer,
)


class CustomerViewSet(TenantViewSet):
    """Customer CRUD with search."""

    serializer_class = CustomerSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = Customer.objects.select_related("store").filter(
            organization_id=self.request.org_id,
        )
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )
        return qs

    # -- Sub-resource actions ------------------------------------------------

    @action(detail=True, methods=["get"])
    def addresses(self, request, pk=None):
        customer = self.get_object()
        qs = Address.objects.filter(customer=customer).order_by("-is_default", "label")
        return Response(AddressSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def wishlist(self, request, pk=None):
        customer = self.get_object()
        qs = WishlistItem.objects.filter(customer=customer).select_related("product")
        return Response(WishlistItemSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def reviews(self, request, pk=None):
        customer = self.get_object()
        qs = Review.objects.filter(customer=customer).select_related("product")
        return Response(ReviewSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def loyalty_transactions(self, request, pk=None):
        customer = self.get_object()
        qs = LoyaltyTransaction.objects.filter(customer=customer)
        return Response(LoyaltyTransactionSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def saved_carts(self, request, pk=None):
        customer = self.get_object()
        qs = SavedCart.objects.filter(customer=customer).prefetch_related(
            "items__product",
        )
        return Response(SavedCartSerializer(qs, many=True).data)

    def perform_create(self, serializer):
        customer = serializer.save(organization_id=self.request.org_id)
        self._log_audit(
            action="customer.create",
            resource_type="customer",
            resource_id=customer.id,
            new_value=CustomerSerializer(customer).data,
        )

    def perform_update(self, serializer):
        old_data = CustomerSerializer(serializer.instance).data
        customer = serializer.save()
        self._log_audit(
            action="customer.update",
            resource_type="customer",
            resource_id=customer.id,
            old_value=old_data,
            new_value=CustomerSerializer(customer).data,
        )

    def perform_destroy(self, instance):
        self._log_audit(
            action="customer.delete",
            resource_type="customer",
            resource_id=instance.id,
            old_value=CustomerSerializer(instance).data,
        )
        instance.delete()


# ---------------------------------------------------------------------------
# Address
# ---------------------------------------------------------------------------


class AddressViewSet(TenantViewSet):
    serializer_class = AddressSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = Address.objects.filter(organization_id=self.request.org_id)
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    @action(detail=True, methods=["post"], url_path="set-default")
    def set_default(self, request, pk=None):
        address = self.get_object()
        address.is_default = True
        address.save()
        return Response(AddressSerializer(address).data)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------


class WishlistItemViewSet(TenantViewSet):
    serializer_class = WishlistItemSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = WishlistItem.objects.filter(
            organization_id=self.request.org_id,
        ).select_related("product")
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    def perform_destroy(self, instance):
        instance.delete()


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------


class ReviewViewSet(TenantViewSet):
    serializer_class = ReviewSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = Review.objects.filter(
            organization_id=self.request.org_id,
        ).select_related("product", "customer")
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        approved = self.request.query_params.get("is_approved")
        if approved is not None:
            qs = qs.filter(is_approved=approved.lower() in ("true", "1", "yes"))
        return qs

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        review = self.get_object()
        review.is_approved = True
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        review = self.get_object()
        review.is_approved = False
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=False, methods=["get"], url_path="product-reviews")
    def product_reviews(self, request):
        """Public endpoint: approved reviews for a product."""
        product_id = request.query_params.get("product")
        if not product_id:
            return Response(
                {"detail": "product query param required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = Review.objects.filter(
            product_id=product_id,
            is_approved=True,
        ).select_related("customer")
        return Response(ReviewSerializer(qs, many=True).data)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()


# ---------------------------------------------------------------------------
# Loyalty
# ---------------------------------------------------------------------------


class LoyaltyTransactionViewSet(TenantViewSet):
    serializer_class = LoyaltyTransactionSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = LoyaltyTransaction.objects.filter(
            organization_id=self.request.org_id,
        ).select_related("customer", "created_by")
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        tx_type = self.request.query_params.get("type")
        if tx_type:
            qs = qs.filter(type=tx_type)
        return qs

    @action(detail=False, methods=["post"])
    def adjust(self, request):
        """Manual loyalty point adjustment by admin."""
        ser = LoyaltyAdjustSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        customer = ser.validated_data["customer"]
        points = ser.validated_data["points"]
        description = ser.validated_data["description"]

        new_balance = customer.loyalty_points + points
        if new_balance < 0:
            return Response(
                {"detail": "Insufficient loyalty points."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tx = LoyaltyTransaction.objects.create(
            organization_id=request.org_id,
            store_id=customer.store_id,
            customer=customer,
            type="adjusted",
            points=points,
            balance=new_balance,
            description=description,
            created_by=request.user,
        )
        Customer.objects.filter(id=customer.id).update(loyalty_points=new_balance)
        return Response(LoyaltyTransactionSerializer(tx).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    def perform_destroy(self, instance):
        instance.delete()


# ---------------------------------------------------------------------------
# Saved Cart
# ---------------------------------------------------------------------------


class SavedCartViewSet(TenantViewSet):
    serializer_class = SavedCartSerializer
    required_permission = "customers.manage"

    def get_queryset(self):
        qs = SavedCart.objects.filter(
            organization_id=self.request.org_id,
        ).prefetch_related("items__product")
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    @action(detail=True, methods=["post"], url_path="add-item")
    def add_item(self, request, pk=None):
        cart = self.get_object()
        ser = SavedCartItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        item, _created = SavedCartItem.objects.update_or_create(
            saved_cart=cart,
            product_id=ser.validated_data["product_id"],
            variant_id=ser.validated_data.get("variant_id"),
            defaults={
                "quantity": ser.validated_data["quantity"],
                "unit_price": ser.validated_data.get("unit_price", 0),
            },
        )
        return Response(SavedCartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="remove-item")
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        item_id = request.data.get("item_id")
        if not item_id:
            return Response(
                {"detail": "item_id required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = SavedCartItem.objects.filter(
            id=item_id,
            saved_cart=cart,
        ).delete()
        if not deleted:
            return Response(
                {"detail": "Item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)

    def perform_destroy(self, instance):
        instance.delete()
