from __future__ import annotations

from django.db import transaction
from rest_framework import serializers, status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.stores.models import Store

from .models import Customer


class CustomerTokenAuthentication(BaseAuthentication):
    """Authenticate requests using customer JWT tokens."""

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        try:
            from rest_framework_simplejwt.tokens import AccessToken

            validated = AccessToken(token)
            customer_id = validated.get("customer_id")
            if not customer_id:
                return None
            customer = Customer.unscoped.get(pk=customer_id)
            return (customer, validated)
        except Exception:
            raise AuthenticationFailed("Invalid or expired token.")


class CustomerRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    phone = serializers.CharField(max_length=30, required=False, default="")

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        store_slug = self.context["store_slug"]
        try:
            store = Store.unscoped.get(slug=store_slug)
        except Store.DoesNotExist:
            raise serializers.ValidationError({"store": "Store not found."})
        attrs["store"] = store
        attrs["organization"] = store.organization
        if Customer.unscoped.filter(store=store, email=attrs["email"]).exists():
            raise serializers.ValidationError(
                {"email": "An account with this email already exists for this store."}
            )
        return attrs


class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        store_slug = self.context["store_slug"]
        try:
            store = Store.unscoped.get(slug=store_slug)
        except Store.DoesNotExist:
            raise serializers.ValidationError({"store": "Store not found."})
        attrs["store"] = store
        return attrs


class CustomerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "company",
            "orders_count",
            "total_spent",
            "loyalty_points",
            "created_at",
        ]
        read_only_fields = fields


def _customer_tokens(customer: Customer) -> dict:
    refresh = RefreshToken()
    refresh["customer_id"] = str(customer.id)
    refresh["store_id"] = str(customer.store_id)
    refresh["org_id"] = str(customer.organization_id)
    refresh["email"] = customer.email
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class CustomerRegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request, store_slug: str):
        serializer = CustomerRegisterSerializer(
            data=request.data, context={"store_slug": store_slug}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            customer = Customer.unscoped.create(
                organization=serializer.validated_data["organization"],
                store=serializer.validated_data["store"],
                email=serializer.validated_data["email"],
                first_name=serializer.validated_data.get("first_name", ""),
                last_name=serializer.validated_data.get("last_name", ""),
                phone=serializer.validated_data.get("phone", ""),
                is_verified=False,
            )
            customer.set_password(serializer.validated_data["password"])
            customer.save(update_fields=["password"])

        tokens = _customer_tokens(customer)
        return Response(
            {
                "customer": CustomerProfileSerializer(customer).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request, store_slug: str):
        serializer = CustomerLoginSerializer(data=request.data, context={"store_slug": store_slug})
        serializer.is_valid(raise_exception=True)

        store = serializer.validated_data["store"]
        email = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data.get("password", "")

        try:
            customer = Customer.unscoped.get(store=store, email=email)
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not customer.check_password(password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = _customer_tokens(customer)
        return Response(
            {
                "customer": CustomerProfileSerializer(customer).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )


class CustomerMeView(APIView):
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = []

    def get(self, request):
        customer = request.user
        if not isinstance(customer, Customer):
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(CustomerProfileSerializer(customer).data)


class CustomerTokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class CustomerTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request):
        serializer = CustomerTokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            customer_id = refresh.get("customer_id")
            if not customer_id:
                return Response(
                    {"detail": "Invalid token type."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            customer = Customer.unscoped.get(pk=customer_id)
            new_access = str(refresh.access_token)
            return Response(
                {
                    "access": new_access,
                    "refresh": str(refresh),
                    "customer": CustomerProfileSerializer(customer).data,
                },
                status=status.HTTP_200_OK,
            )
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class CustomerLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class CustomerCartView(APIView):
    """Return the active cart for an authenticated customer on a given store."""

    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = []

    def get(self, request):
        from django.db.models import Count
        from apps.orders.models import Cart, CartItem
        from apps.orders.serializers import CartSerializer
        from apps.stores.models import Store

        customer = request.user
        if not isinstance(customer, Customer):
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        store_slug = request.query_params.get("store")
        if not store_slug:
            return Response({"detail": "store query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            store = Store.unscoped.get(slug=store_slug)
        except Store.DoesNotExist:
            return Response({"detail": "Store not found."}, status=status.HTTP_404_NOT_FOUND)

        cart = (
            Cart.unscoped.filter(customer=customer, store=store, status="active")
            .prefetch_related("items__product")
            .first()
        )

        if not cart:
            return Response({"results": []}, status=status.HTTP_200_OK)

        return Response({"results": [CartSerializer(cart).data]}, status=status.HTTP_200_OK)


class CustomerCartActionsView(APIView):
    """Add, update, or remove items from a customer's active cart."""

    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = []

    def _get_cart(self, request, cart_id):
        from apps.orders.models import Cart
        customer = request.user
        if not isinstance(customer, Customer):
            return None
        try:
            return Cart.unscoped.get(id=cart_id, customer=customer, status="active")
        except Cart.DoesNotExist:
            return None

    def post(self, request, cart_id: str, action: str):
        from apps.orders.models import CartItem
        from apps.products.models import Product, ProductVariant

        cart = self._get_cart(request, cart_id)
        if not cart:
            return Response({"detail": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)

        if action == "items/add":
            product_id = request.data.get("product_id")
            variant_id = request.data.get("variant_id")
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

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart, product=product, variant=variant,
                defaults={"quantity": quantity, "unit_price": unit_price},
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save(update_fields=["quantity", "updated_at"])

            cart.recalculate()
            from apps.orders.serializers import CartSerializer
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

        elif action == "items/update":
            item_id = request.data.get("item_id")
            quantity = int(request.data.get("quantity", 1))
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
            except CartItem.DoesNotExist:
                return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save(update_fields=["quantity", "updated_at"])

            cart.recalculate()
            from apps.orders.serializers import CartSerializer
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

        elif action == "items/remove":
            item_id = request.data.get("item_id")
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
                cart_item.delete()
            except CartItem.DoesNotExist:
                pass

            cart.recalculate()
            from apps.orders.serializers import CartSerializer
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

        return Response({"detail": "Unknown action."}, status=status.HTTP_400_BAD_REQUEST)


class CustomerMergeCartView(APIView):
    """Merge guest cart items into the customer's authenticated cart."""

    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = []  # Auth handled manually via CustomerTokenAuthentication

    def post(self, request):
        customer = request.user
        if not isinstance(customer, Customer):
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        store_slug = request.data.get("store")
        items = request.data.get("items", [])

        if not store_slug:
            return Response({"detail": "store is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not items:
            return Response({"detail": "items list is required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.orders.models import Cart, CartItem
        from apps.products.models import Product, ProductVariant
        from apps.stores.models import Store

        try:
            store = Store.unscoped.get(slug=store_slug)
        except Store.DoesNotExist:
            return Response({"detail": "Store not found."}, status=status.HTTP_404_NOT_FOUND)

        cart, _ = Cart.objects.get_or_create(
            organization=customer.organization,
            store=store,
            customer=customer,
            status="active",
            defaults={"currency": "USD"},
        )

        added = 0
        for item in items:
            product_id = item.get("product")
            variant_id = item.get("variant")
            quantity = int(item.get("quantity", 1))

            try:
                product = Product.objects.get(id=product_id, store=store)
            except Product.DoesNotExist:
                continue

            unit_price = product.price
            variant = None
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                    unit_price = variant.price
                except ProductVariant.DoesNotExist:
                    continue

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant=variant,
                defaults={"quantity": quantity, "unit_price": unit_price},
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save(update_fields=["quantity", "updated_at"])
            added += 1

        cart.recalculate()
        return Response({"detail": f"Merged {added} items.", "cart_id": str(cart.id)}, status=status.HTTP_200_OK)
