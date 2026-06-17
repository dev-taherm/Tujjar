from decimal import Decimal

from django.test import TestCase

from apps.marketplace.models import MarketplaceListing, MarketplaceReview


class TestMarketplaceListingModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        from apps.themes.models import Theme

        self.developer = User.objects.create_user(email="dev@test.com", password="pass123")
        self.org = Organization.objects.create(name="Dev Org", slug="dev-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="Dev Store",
            slug="dev-store",
        )
        self.theme = Theme.objects.create(
            organization=self.org,
            name="Market Theme",
            slug="market-theme",
            config={},
        )

    def test_create_listing(self):
        listing = MarketplaceListing.objects.create(
            developer=self.developer,
            theme=self.theme,
            slug="market-theme",
            name="Market Theme",
            description="A great theme",
            pricing_type="paid",
            price=Decimal("49.99"),
            status="approved",
        )
        self.assertIn("Market Theme", str(listing))


class TestMarketplaceReviewModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store
        from apps.themes.models import Theme

        self.developer = User.objects.create_user(email="dev2@test.com", password="pass123")
        self.reviewer = User.objects.create_user(email="reviewer@test.com", password="pass123")
        self.org = Organization.objects.create(name="Dev Org 2", slug="dev-org-2")
        self.store = Store.objects.create(
            organization=self.org,
            name="Dev Store 2",
            slug="dev-store-2",
        )
        self.theme = Theme.objects.create(
            organization=self.org,
            name="Review Theme",
            slug="review-theme",
            config={},
        )
        self.listing = MarketplaceListing.objects.create(
            developer=self.developer,
            theme=self.theme,
            slug="review-theme",
            name="Review Theme",
            description="Theme",
            status="approved",
        )

    def test_create_review(self):
        review = MarketplaceReview.objects.create(
            listing=self.listing,
            user=self.reviewer,
            rating=5,
            title="Great!",
        )
        self.assertEqual(review.rating, 5)
        self.assertIn("Great", review.title)
