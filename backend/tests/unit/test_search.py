from django.test import TestCase

from apps.search.models import SearchIndex, SearchQuery


class TestSearchIndexModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store

        self.user = User.objects.create_user(email="search@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test Search", slug="test-search-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="Search Store",
            slug="search-store",
        )

    def test_create_search_index(self):
        idx = SearchIndex.objects.create(
            organization=self.org,
            store=self.store,
            entity_type="product",
            entity_id="00000000-0000-0000-0000-000000000001",
            title="Wireless Headphones",
            description="Premium noise-cancelling headphones",
        )
        self.assertEqual(str(idx), "product: Wireless Headphones")


class TestSearchQueryModel(TestCase):
    def setUp(self):
        from apps.authentication.models import User
        from apps.organizations.models import Organization
        from apps.stores.models import Store

        self.user = User.objects.create_user(email="sq@test.com", password="pass123")
        self.org = Organization.objects.create(name="Test SQ", slug="test-sq-org")
        self.store = Store.objects.create(
            organization=self.org,
            name="SQ Store",
            slug="sq-store",
        )

    def test_create_search_query(self):
        sq = SearchQuery.objects.create(
            organization=self.org,
            store=self.store,
            query="headphones",
            results_count=5,
        )
        self.assertEqual(str(sq), "Search: headphones (5 results)")
