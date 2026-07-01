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

        tokens = _customer_tokens(customer)
        return Response(
            {
                "customer": CustomerProfileSerializer(customer).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request, store_slug: str):
        serializer = CustomerLoginSerializer(data=request.data, context={"store_slug": store_slug})
        serializer.is_valid(raise_exception=True)

        store = serializer.validated_data["store"]
        email = serializer.validated_data["email"].lower().strip()

        try:
            customer = Customer.unscoped.get(store=store, email=email)
        except Customer.DoesNotExist:
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
    permission_classes = [IsAuthenticated]

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
