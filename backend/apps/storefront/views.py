from __future__ import annotations

from django.db.models import Q
from django.core.cache import cache
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.utils import (
    DEFAULT_LOCALE,
    resolve_locale_field,
    resolve_navigation_locale,
    resolve_footer_locale,
)
from apps.products.models import Product, Category, Collection
from apps.products.serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer, CollectionSerializer
from apps.stores.models import Store
from apps.pages.models import Page

STORE_CACHE_TTL = 300  # 5 minutes


def get_store_by_slug(slug: str):
    """Get store by slug with caching and organization select_related."""
    cache_key = f"storefront:store:{slug}"
    store = cache.get(cache_key)
    if store is None:
        store = Store.objects.select_related("organization").filter(slug=slug).first()
        if store:
            cache.set(cache_key, store, STORE_CACHE_TTL)
    return store


def _get_locale(request) -> str:
    """Extract locale from query params, default to 'en'."""
    locale = request.query_params.get("locale", DEFAULT_LOCALE)
    if locale not in ("en", "ar"):
        locale = DEFAULT_LOCALE
    return locale


def _resolve_page(page: Page, locale: str) -> dict:
    """Resolve a Page's content for the given locale."""
    if locale != DEFAULT_LOCALE:
        translations = getattr(page, "translations", None) or {}
        locale_data = translations.get(locale, {})
        return {
            "id": str(page.id),
            "title": locale_data.get("title") or page.title,
            "slug": page.slug,
            "content_schema": locale_data.get("content_schema") or page.content_schema,
            "seo_title": locale_data.get("seo_title") or page.seo_title or "",
            "seo_description": locale_data.get("seo_description") or page.seo_description or "",
        }
    return {
        "id": str(page.id),
        "title": page.title,
        "slug": page.slug,
        "content_schema": page.content_schema,
        "seo_title": page.seo_title or "",
        "seo_description": page.seo_description or "",
    }


def _resolve_product(product: Product, locale: str) -> dict:
    """Resolve a Product's content for the given locale."""
    if locale != DEFAULT_LOCALE:
        translations = getattr(product, "translations", None) or {}
        locale_data = translations.get(locale, {})
        return {
            "title": locale_data.get("title") or product.title,
            "description": locale_data.get("description") or product.description,
            "seo_title": locale_data.get("seo_title") or product.seo_title or "",
            "seo_description": locale_data.get("seo_description") or product.seo_description or "",
            "tags": locale_data.get("tags") if "tags" in locale_data else product.tags,
        }
    return {
        "title": product.title,
        "description": product.description,
        "seo_title": product.seo_title or "",
        "seo_description": product.seo_description or "",
        "tags": product.tags,
    }


def _resolve_store(store: Store, locale: str) -> dict:
    """Resolve a Store's content for the given locale."""
    name = store.name
    description = store.description
    seo_title = store.seo_title or ""
    seo_description = store.seo_description or ""

    if locale != DEFAULT_LOCALE:
        translations = getattr(store, "translations", None) or {}
        locale_data = translations.get(locale, {})
        name = locale_data.get("name") or name
        description = locale_data.get("description") or description
        seo_title = locale_data.get("seo_title") or seo_title
        seo_description = locale_data.get("seo_description") or seo_description

    logo_url = None
    if store.logo_id:
        try:
            logo_url = store.logo.file_url
        except Exception:
            pass

    favicon_url = None
    if store.favicon_id:
        try:
            favicon_url = store.favicon.file_url
        except Exception:
            pass

    theme_config = None
    if store.theme_id:
        try:
            theme_config = store.theme.effective_config
        except Exception:
            pass

    og_image_url = None
    if store.og_image_id:
        try:
            og_image_url = store.og_image.file_url
        except Exception:
            pass

    return {
        "name": name,
        "slug": store.slug,
        "description": description,
        "logo_url": logo_url,
        "favicon_url": favicon_url,
        "settings": store.settings,
        "theme_config": theme_config,
        "navigation": resolve_navigation_locale(store.navigation, locale) or {},
        "footer_config": resolve_footer_locale(store.footer_config, locale) or {},
        "seo_title": seo_title,
        "seo_description": seo_description,
        "og_image": og_image_url,
        "twitter_card": store.twitter_card,
        "domain": store.domain,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_home(request, subdomain=None):
    """Public storefront home page data."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    locale = _get_locale(request)

    featured_products = Product.objects.filter(
        organization=store.organization,
        status="active",
    )[:8]

    homepage = Page.objects.filter(
        organization=store.organization,
        store=store,
        page_type="homepage",
        is_published=True,
    ).first()

    serialized_products = ProductListSerializer(featured_products, many=True).data
    if locale != DEFAULT_LOCALE:
        for product_obj, serialized in zip(featured_products, serialized_products):
            locale_data = (getattr(product_obj, "translations", None) or {}).get(locale, {})
            if locale_data.get("title"):
                serialized["title"] = locale_data["title"]

    return Response({
        "store": _resolve_store(store, locale),
        "featured_products": serialized_products,
        "homepage": _resolve_page(homepage, locale) if homepage else None,
    })


class StorefrontProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = get_store_by_slug(subdomain)
        if not store:
            return Product.objects.none()
        qs = Product.objects.filter(
            organization=store.organization, status="active"
        ).prefetch_related("images", "categories", "variants")
        category = self.request.query_params.get("category")
        collection = self.request.query_params.get("collection")
        search = self.request.query_params.get("search")
        sort = self.request.query_params.get("sort", "-created_at")

        if category:
            qs = qs.filter(categories__slug=category)
        if collection:
            qs = qs.filter(collections__slug=collection)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        valid_sorts = {
            "name": "name",
            "-name": "-name",
            "price": "price",
            "-price": "-price",
            "created_at": "created_at",
            "-created_at": "-created_at",
        }
        qs = qs.order_by(valid_sorts.get(sort, "-created_at"))
        return qs.distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        locale = _get_locale(request)
        if locale != DEFAULT_LOCALE:
            products = self.get_queryset()
            products_map = {str(p.id): p for p in products}
            for item in response.data.get("results", []):
                product_obj = products_map.get(item["id"])
                if product_obj:
                    locale_data = (getattr(product_obj, "translations", None) or {}).get(locale, {})
                    if locale_data.get("title"):
                        item["title"] = locale_data["title"]
        return response


class StorefrontProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        subdomain = self.kwargs.get("subdomain")
        slug = self.kwargs.get("slug")
        store = get_store_by_slug(subdomain)
        if not store:
            from rest_framework.exceptions import NotFound
            raise NotFound("Store not found")
        product = Product.objects.filter(
            organization=store.organization,
            slug=slug,
            status="active",
        ).first()
        if not product:
            from rest_framework.exceptions import NotFound
            raise NotFound("Product not found")
        return product

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        locale = _get_locale(request)
        data = ProductDetailSerializer(product).data
        if locale != DEFAULT_LOCALE:
            locale_data = (getattr(product, "translations", None) or {}).get(locale, {})
            if locale_data.get("title"):
                data["title"] = locale_data["title"]
            if locale_data.get("description"):
                data["description"] = locale_data["description"]
            if locale_data.get("seo_title"):
                data["seo_title"] = locale_data["seo_title"]
            if locale_data.get("seo_description"):
                data["seo_description"] = locale_data["seo_description"]
            if "tags" in locale_data:
                data["tags"] = locale_data["tags"]
        return Response(data)


class StorefrontCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = get_store_by_slug(subdomain)
        if not store:
            return Category.objects.none()
        return Category.objects.filter(organization=store.organization, is_active=True)


class StorefrontCollectionListView(generics.ListAPIView):
    serializer_class = CollectionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = get_store_by_slug(subdomain)
        if not store:
            return Collection.objects.none()
        return Collection.objects.filter(organization=store.organization, is_active=True)


class StorefrontPageView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    def get_object(self):
        subdomain = self.kwargs.get("subdomain")
        slug = self.kwargs.get("slug")
        store = get_store_by_slug(subdomain)
        if not store:
            from rest_framework.exceptions import NotFound
            raise NotFound("Store not found")
        page = Page.objects.filter(
            organization=store.organization,
            store=store,
            slug=slug,
            is_published=True,
        ).first()
        if not page:
            from rest_framework.exceptions import NotFound
            raise NotFound("Page not found")
        return page

    def retrieve(self, request, *args, **kwargs):
        page = self.get_object()
        locale = _get_locale(request)
        return Response(_resolve_page(page, locale))


@api_view(["GET"])
@permission_classes([AllowAny])
def robots_txt(request, subdomain=None):
    """Generate robots.txt for a store."""
    store = get_store_by_slug(subdomain)
    if not store:
        return HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain", status=404)

    lines = [
        "User-agent: *",
        "Allow: /",
        "",
    ]
    pages = Page.objects.filter(
        organization=store.organization,
        store=store,
        is_published=True,
    ).values_list("slug", flat=True)
    for slug in pages:
        lines.append(f"Disallow: /{slug}/" if slug != "home" else "")
    lines.append("")
    lines.append(f"Sitemap: https://{store.domain}/sitemap.xml")
    return HttpResponse("\n".join(lines), content_type="text/plain")


@api_view(["GET"])
@permission_classes([AllowAny])
def sitemap_xml(request, subdomain=None):
    """Generate sitemap.xml for a store."""
    store = get_store_by_slug(subdomain)
    if not store:
        return HttpResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', content_type="application/xml", status=404)

    now = timezone.now().strftime("%Y-%m-%d")
    base_url = f"https://{store.domain}"

    urls = []

    # Homepage
    urls.append(f"""  <url>
    <loc>{base_url}/</loc>
    <lastmod>{now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""")

    # Products
    products = Product.objects.filter(
        organization=store.organization,
        status="active",
    ).values_list("slug", "updated_at")
    for slug, updated_at in products:
        lastmod = (updated_at or now).strftime("%Y-%m-%d") if hasattr(updated_at, "strftime") else now
        urls.append(f"""  <url>
    <loc>{base_url}/products/{slug}/</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

    # Pages
    pages = Page.objects.filter(
        organization=store.organization,
        store=store,
        is_published=True,
    ).values_list("slug", "updated_at")
    for slug, updated_at in pages:
        lastmod = (updated_at or now).strftime("%Y-%m-%d") if hasattr(updated_at, "strftime") else now
        urls.append(f"""  <url>
    <loc>{base_url}/{slug}/</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>""")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

    return HttpResponse(xml, content_type="application/xml")
