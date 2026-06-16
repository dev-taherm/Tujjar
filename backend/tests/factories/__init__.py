import factory
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
    first_name = "Test"
    last_name = "User"
    is_verified = True


class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "organizations.Organization"

    name = factory.Sequence(lambda n: f"Org {n}")
    slug = factory.Sequence(lambda n: f"org-{n}")


class OwnerMembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "organizations.OrganizationMembership"

    user = factory.SubFactory(UserFactory)
    organization = factory.SubFactory(OrganizationFactory)
    is_accepted = True

    @factory.lazy_attribute
    def role(self):
        from apps.organizations.models import Role
        role, _ = Role.objects.get_or_create(
            slug="owner", organization=None,
            defaults={"name": "Owner", "is_system": True},
        )
        return role


class StoreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "stores.Store"

    organization = factory.SubFactory(OrganizationFactory)
    name = factory.Sequence(lambda n: f"Store {n}")
    slug = factory.Sequence(lambda n: f"store-{n}")


class StoreDomainFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "stores.StoreDomain"

    store = factory.SubFactory(StoreFactory)
    domain = factory.Sequence(lambda n: f"domain{n}.example.com")


def get_auth_token(user):
    """Return JWT access token for a user, with org_id embedded for TenantMiddleware."""
    refresh = RefreshToken.for_user(user)
    membership = user.memberships.filter(is_accepted=True).select_related("organization").first()
    if membership:
        refresh["org_id"] = str(membership.organization.id)
    return str(refresh.access_token)


def create_org_with_owner(email="test@example.com"):
    """Create a user with organization membership and return (user, org, token)."""
    user = UserFactory(email=email)
    org = OrganizationFactory()
    OwnerMembershipFactory(user=user, organization=org)
    token = get_auth_token(user)
    return user, org, token


def create_org_with_owner_and_store(email="test@example.com"):
    """Create a user with org, membership, and store. Returns (user, org, store, token)."""
    user, org, token = create_org_with_owner(email)
    store = StoreFactory(organization=org)
    return user, org, store, token
