from __future__ import annotations

import contextlib
import logging
from decimal import Decimal

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.utils import (
    DEFAULT_LOCALE,
    resolve_footer_locale,
    resolve_navigation_locale,
)
from apps.pages.models import Page
from apps.products.models import Category, Collection, Product
from apps.products.serializers import (
    CategorySerializer,
    CollectionSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from apps.stores.models import Store

logger = logging.getLogger(__name__)

STORE_CACHE_TTL = 300  # 5 minutes


def storefront_base_url(store: Store) -> str:
    """Absolute base URL for a store's public storefront.

    Uses the store's custom domain (or slug subdomain) with the correct
    scheme/port for the current environment so sitemap and robots URLs are
    valid in both development and production.
    """
    domain = store.domain
    if settings.DEBUG:
        frontend_port = getattr(settings, "STOREFRONT_PORT", "3000")
        return f"http://{domain}:{frontend_port}"
    return f"https://{domain}"


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_stores_list(request):
    """List all active stores (public — used for sitemap generation)."""
    stores = (
        Store.objects.filter(is_active=True)
        .select_related("organization")
        .order_by("slug")
    )
    data = [
        {
            "slug": store.slug,
            "name": store.name,
            "domain": store.domain,
            "base_url": storefront_base_url(store),
            "updated_at": store.updated_at.isoformat() if store.updated_at else None,
        }
        for store in stores
    ]
    return Response(data)


def get_store_by_slug(slug: str):
    """Get store by slug with caching and organization select_related."""
    cache_key = f"storefront:store:{slug}"
    store = cache.get(cache_key)
    if store is None:
        store = (
            Store.objects.select_related("organization", "theme", "logo", "favicon", "og_image")
            .filter(slug=slug)
            .first()
        )
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
            "theme_override": page.theme_override or None,
        }
    return {
        "id": str(page.id),
        "title": page.title,
        "slug": page.slug,
        "content_schema": page.content_schema,
        "seo_title": page.seo_title or "",
        "seo_description": page.seo_description or "",
        "theme_override": page.theme_override or None,
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
            logger.warning("Failed to resolve logo for store %s", store.slug, exc_info=True)

    favicon_url = None
    if store.favicon_id:
        try:
            favicon_url = store.favicon.file_url
        except Exception:
            logger.warning("Failed to resolve favicon for store %s", store.slug, exc_info=True)

    theme_config = None
    if store.theme_id:
        try:
            theme_config = store.theme.get_effective_config()
        except Exception:
            logger.warning("Failed to resolve theme_config for store %s", store.slug, exc_info=True)

    og_image_url = None
    if store.og_image_id:
        try:
            og_image_url = store.og_image.file_url
        except Exception:
            logger.warning("Failed to resolve og_image for store %s", store.slug, exc_info=True)

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

    is_preview = request.query_params.get("preview") == "true"
    homepage_qs = Page.objects.filter(
        organization=store.organization,
        store=store,
        page_type="homepage",
    )
    if not is_preview:
        homepage_qs = homepage_qs.filter(is_published=True)
    homepage = homepage_qs.first()

    serialized_products = ProductListSerializer(featured_products, many=True).data
    if locale != DEFAULT_LOCALE:
        for product_obj, serialized in zip(featured_products, serialized_products, strict=False):
            locale_data = (getattr(product_obj, "translations", None) or {}).get(locale, {})
            if locale_data.get("title"):
                serialized["title"] = locale_data["title"]

    return Response(
        {
            "store": _resolve_store(store, locale),
            "featured_products": serialized_products,
            "homepage": _resolve_page(homepage, locale) if homepage else None,
        }
    )


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
            qs = qs.filter(collection_set__slug=collection)
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
        return Category.objects.filter(organization=store.organization, store=store, is_active=True)

    def list(self, request, *args, **kwargs):
        subdomain = self.kwargs.get("subdomain")
        cache_key = f"storefront:categories:{subdomain}"
        cached = cache.get(cache_key)
        if cached is not None:
            from rest_framework.response import Response as DRFResponse

            return DRFResponse(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60)
        return response


class StorefrontCollectionListView(generics.ListAPIView):
    serializer_class = CollectionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        subdomain = self.kwargs.get("subdomain")
        store = get_store_by_slug(subdomain)
        if not store:
            return Collection.objects.none()
        return Collection.objects.filter(
            organization=store.organization, store=store, is_active=True
        )

    def list(self, request, *args, **kwargs):
        subdomain = self.kwargs.get("subdomain")
        cache_key = f"storefront:collections:{subdomain}"
        cached = cache.get(cache_key)
        if cached is not None:
            from rest_framework.response import Response as DRFResponse

            return DRFResponse(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60)
        return response


class StorefrontPageView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]

    def get_object(self):
        subdomain = self.kwargs.get("subdomain")
        slug = self.kwargs.get("slug")
        store = get_store_by_slug(subdomain)
        if not store:
            from rest_framework.exceptions import NotFound

            raise NotFound("Store not found")
        is_preview = self.request.query_params.get("preview") == "true"
        qs = Page.objects.filter(
            organization=store.organization,
            store=store,
            slug=slug,
        )
        if not is_preview:
            qs = qs.filter(is_published=True)
        page = qs.first()
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
    cache_key = f"storefront:robots:{subdomain}"
    cached = cache.get(cache_key)
    if cached:
        return HttpResponse(cached, content_type="text/plain")

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
        if slug != "home":
            lines.append(f"Allow: /{slug}/")
    lines.append("")
    lines.append(f"Sitemap: {storefront_base_url(store)}/sitemap.xml")
    content = "\n".join(lines)
    cache.set(cache_key, content, 300)
    return HttpResponse(content, content_type="text/plain")


@api_view(["GET"])
@permission_classes([AllowAny])
def sitemap_xml(request, subdomain=None):
    """Generate sitemap.xml for a store."""
    cache_key = f"storefront:sitemap:{subdomain}"
    cached = cache.get(cache_key)
    if cached:
        return HttpResponse(cached, content_type="application/xml")

    store = get_store_by_slug(subdomain)
    if not store:
        return HttpResponse(
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            content_type="application/xml",
            status=404,
        )

    now = timezone.now().strftime("%Y-%m-%d")
    base_url = storefront_base_url(store)

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
        lastmod = (
            (updated_at or now).strftime("%Y-%m-%d") if hasattr(updated_at, "strftime") else now
        )
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
        lastmod = (
            (updated_at or now).strftime("%Y-%m-%d") if hasattr(updated_at, "strftime") else now
        )
        urls.append(f"""  <url>
    <loc>{base_url}/{slug}/</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>""")

    # Blog posts
    from apps.blog.models import BlogPost

    blog_posts = BlogPost.objects.filter(
        organization=store.organization,
        store=store,
        status="published",
    ).values_list("slug", "published_at")
    for slug, published_at in blog_posts:
        lastmod = published_at.strftime("%Y-%m-%d") if hasattr(published_at, "strftime") else now
        urls.append(f"""  <url>
    <loc>{base_url}/blog/{slug}/</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

    cache.set(cache_key, xml, 300)
    return HttpResponse(xml, content_type="application/xml")


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_blog_rss(request, subdomain=None):
    """RSS feed for blog posts."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    locale = _get_locale(request)

    from apps.blog.models import BlogPost

    posts = (
        BlogPost.objects.filter(
            organization=store.organization,
            store=store,
            status="published",
        )
        .select_related("author", "featured_image")
        .order_by("-published_at")[:20]
    )

    base_url = storefront_base_url(store)
    store_name = store.name

    items = []
    for post in posts:
        translations = getattr(post, "translations", None) or {}
        locale_data = translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        title = locale_data.get("title") or post.title
        excerpt = locale_data.get("excerpt") or post.excerpt
        pub_date = (
            post.published_at.strftime("%a, %d %b %Y %H:%M:%S +0000") if post.published_at else ""
        )

        featured_image_url = ""
        if post.featured_image_id:
            with contextlib.suppress(Exception):
                featured_image_url = post.featured_image.file_url

        enclosure = ""
        if featured_image_url:
            enclosure = '<enclosure url="' + featured_image_url + '" type="image/jpeg" />'

        items.append(f"""  <item>
    <title>{title}</title>
    <link>{base_url}/blog/{post.slug}/</link>
    <description>{excerpt}</description>
    <pubDate>{pub_date}</pubDate>
    <guid>{base_url}/blog/{post.slug}/</guid>
    {enclosure}
  </item>""")

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{store_name} Blog</title>
    <link>{base_url}/blog/</link>
    <description>Latest blog posts from {store_name}</description>
    <language>{locale}</language>
    <lastBuildDate>{timezone.now().strftime("%a, %d %b %Y %H:%M:%S +0000")}</lastBuildDate>
    <atom:link href="{base_url}/blog/rss/" rel="self" type="application/rss+xml" />
{chr(10).join(items)}
  </channel>
</rss>"""

    return HttpResponse(rss, content_type="application/rss+xml")


def _resolve_blog_post(post, locale: str) -> dict:
    """Resolve a BlogPost's content for the given locale."""
    translations = getattr(post, "translations", None) or {}
    locale_data = translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}

    author_data = None
    if post.author:
        author_translations = getattr(post.author, "translations", None) or {}
        author_locale = author_translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        author_avatar_url = None
        if post.author.avatar_id:
            with contextlib.suppress(Exception):
                author_avatar_url = post.author.avatar.file_url
        author_data = {
            "name": author_locale.get("name") or post.author.name,
            "slug": post.author.slug,
            "bio": author_locale.get("bio") or post.author.bio,
            "avatar_url": author_avatar_url,
        }

    featured_image_url = None
    if post.featured_image_id:
        with contextlib.suppress(Exception):
            featured_image_url = post.featured_image.file_url

    categories = []
    for pc in post.post_categories.select_related("category").all():
        cat = pc.category
        cat_translations = getattr(cat, "translations", None) or {}
        cat_locale = cat_translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        categories.append(
            {
                "name": cat_locale.get("name") or cat.name,
                "slug": cat.slug,
            }
        )

    tags = []
    for pt in post.post_tags.select_related("tag").all():
        tag = pt.tag
        tag_translations = getattr(tag, "translations", None) or {}
        tag_locale = tag_translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        tags.append(
            {
                "name": tag_locale.get("name") or tag.name,
                "slug": tag.slug,
            }
        )

    return {
        "id": str(post.id),
        "title": locale_data.get("title") or post.title,
        "slug": post.slug,
        "excerpt": locale_data.get("excerpt") or post.excerpt,
        "content": locale_data.get("content") or post.content,
        "featured_image_url": featured_image_url,
        "featured_image_alt": post.featured_image_alt,
        "author": author_data,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "reading_time": post.reading_time,
        "view_count": post.view_count,
        "seo_title": locale_data.get("seo_title") or post.seo_title or "",
        "seo_description": locale_data.get("seo_description") or post.seo_description or "",
        "og_image_url": None,
        "twitter_card": post.twitter_card,
        "categories": categories,
        "tags": tags,
        "allow_comments": post.allow_comments,
        "is_featured": post.is_featured,
    }


def _resolve_blog_list_post(post, locale: str) -> dict:
    """Resolve a BlogPost for list view (lighter payload)."""
    translations = getattr(post, "translations", None) or {}
    locale_data = translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}

    featured_image_url = None
    if post.featured_image_id:
        with contextlib.suppress(Exception):
            featured_image_url = post.featured_image.file_url

    author_name = ""
    if post.author:
        author_translations = getattr(post.author, "translations", None) or {}
        author_locale = author_translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        author_name = author_locale.get("name") or post.author.name

    return {
        "id": str(post.id),
        "title": locale_data.get("title") or post.title,
        "slug": post.slug,
        "excerpt": locale_data.get("excerpt") or post.excerpt,
        "featured_image_url": featured_image_url,
        "author_name": author_name,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "reading_time": post.reading_time,
        "view_count": post.view_count,
        "is_featured": post.is_featured,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_blog_list(request, subdomain=None):
    """Public blog post listing for a store."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    locale = _get_locale(request)
    category_slug = request.query_params.get("category")
    tag_slug = request.query_params.get("tag")
    page_num = int(request.query_params.get("page", 1))
    per_page = int(request.query_params.get("per_page", 12))

    cache_key = (
        f"storefront:blog:{subdomain}:{locale}:{category_slug}:{tag_slug}:{page_num}:{per_page}"
    )
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    from django.core.paginator import Paginator

    from apps.blog.models import BlogPost

    qs = BlogPost.objects.filter(
        organization=store.organization,
        store=store,
        status="published",
    ).select_related("author", "featured_image")

    if category_slug:
        qs = qs.filter(post_categories__category__slug=category_slug)
    if tag_slug:
        qs = qs.filter(post_tags__tag__slug=tag_slug)

    qs = qs.order_by("-published_at")

    paginator = Paginator(qs, per_page)
    page_obj = paginator.get_page(page_num)

    posts = [_resolve_blog_list_post(p, locale) for p in page_obj]

    result = {
        "posts": posts,
        "pagination": {
            "page": page_obj.number,
            "per_page": per_page,
            "total": paginator.count,
            "total_pages": paginator.num_pages,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        },
    }
    cache.set(cache_key, result, 120)
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_blog_post(request, subdomain=None, slug=None):
    """Public blog post detail for a store."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    locale = _get_locale(request)

    cache_key = f"storefront:blog:post:{subdomain}:{slug}:{locale}"
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    from apps.blog.models import BlogPost

    post = (
        BlogPost.objects.filter(
            organization=store.organization,
            store=store,
            slug=slug,
            status="published",
        )
        .select_related(
            "author",
            "author__avatar",
            "featured_image",
            "og_image",
        )
        .prefetch_related(
            "post_categories__category",
            "post_tags__tag",
        )
        .first()
    )

    if not post:
        return Response({"error": "Post not found"}, status=404)

    post.increment_view_count()

    result = _resolve_blog_post(post, locale)
    cache.set(cache_key, result, 120)
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def storefront_blog_categories(request, subdomain=None):
    """Public blog category listing for a store."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    locale = _get_locale(request)

    from apps.blog.models import BlogCategory

    categories = BlogCategory.objects.filter(
        organization=store.organization,
        store=store,
        is_active=True,
    ).order_by("order", "name")

    result = []
    for cat in categories:
        translations = getattr(cat, "translations", None) or {}
        locale_data = translations.get(locale, {}) if locale != DEFAULT_LOCALE else {}
        result.append(
            {
                "name": locale_data.get("name") or cat.name,
                "slug": cat.slug,
                "description": locale_data.get("description") or cat.description,
                "post_count": cat.category_posts.filter(post__status="published").count(),
            }
        )

    return Response(result)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def storefront_blog_subscribe(request, subdomain=None):
    """Public blog newsletter subscription."""
    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    email = request.data.get("email") or request.query_params.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=400)

    from apps.blog.models import BlogSubscriber

    subscriber, created = BlogSubscriber.objects.get_or_create(
        organization=store.organization,
        store=store,
        email=email,
        defaults={"is_active": True},
    )
    if not created and not subscriber.is_active:
        subscriber.is_active = True
        subscriber.unsubscribed_at = None
        subscriber.save(update_fields=["is_active", "unsubscribed_at", "updated_at"])

    return Response({"message": "Subscribed successfully!"})


@api_view(["POST"])
@permission_classes([AllowAny])
def checkout_quote(request, subdomain=None):
    """Public checkout quote: discount + tax + shipping breakdown.

    Works for guest checkouts (explicit `items`) and customer checkouts
    (`cart_id`). Prices are always resolved server-side from product data —
    client prices are never trusted.

    Body:
        items: [{ product_id, variant_id?, quantity }] (guests)
        cart_id: uuid (logged-in customers)
        discount_code?: str
        shipping_country?, shipping_state?, shipping_postal_code?
        shipping_rate_id?: uuid
    """
    from apps.commerce.services import (
        QuoteInput,
        available_shipping_rates,
        build_quote,
    )
    from apps.orders.models import Cart

    store = get_store_by_slug(subdomain)
    if not store:
        return Response({"error": "Store not found"}, status=404)

    body = request.data or {}
    cart = None
    if body.get("cart_id"):
        cart = Cart.unscoped.filter(id=body["cart_id"], store=store, status="active").first()
        if not cart:
            return Response({"error": "Cart not found."}, status=404)

    # Resolve line items and compute subtotal from server-side prices
    quote_items = []
    if cart:
        for item in cart.items.select_related("product", "variant"):
            quote_items.append((str(item.product_id), item.quantity, item.line_total))
        subtotal = cart.subtotal
        customer_id = str(cart.customer_id) if cart.customer_id else None
    else:
        raw_items = body.get("items") or []
        if not raw_items:
            return Response({"error": "items or cart_id is required."}, status=400)
        subtotal = Decimal("0")
        for raw in raw_items:
            product = Product.unscoped.filter(id=raw.get("product_id")).first()
            if not product or product.organization_id != store.organization_id:
                return Response(
                    {"error": f"Unknown product: {raw.get('product_id')}"}, status=400
                )
            quantity = max(1, int(raw.get("quantity", 1)))
            unit_price = product.price
            variant = None
            if raw.get("variant_id"):
                variant = product.variants.filter(id=raw["variant_id"]).first()
                if not variant:
                    return Response(
                        {"error": f"Unknown variant: {raw.get('variant_id')}"}, status=400
                    )
                unit_price = variant.price
            line_total = (Decimal(str(unit_price)) * quantity).quantize(Decimal("0.01"))
            subtotal += line_total
            quote_items.append((str(product.id), quantity, line_total))
        customer_id = None

    quote = build_quote(
        store.organization_id,
        QuoteInput(
            subtotal=subtotal,
            country=(body.get("shipping_country") or "").strip(),
            state=(body.get("shipping_state") or "").strip(),
            postal_code=(body.get("shipping_postal_code") or "").strip(),
            discount_code=(body.get("discount_code") or "").strip(),
            shipping_rate_id=body.get("shipping_rate_id"),
            customer_id=customer_id,
            items=quote_items,
        ),
    )

    # Available shipping options for the chosen address, for the storefront UI
    discounted_subtotal = max(subtotal - quote.discount, Decimal("0"))
    rates = available_shipping_rates(
        store.organization_id,
        country=(body.get("shipping_country") or "").strip(),
        subtotal=discounted_subtotal,
    )

    return Response(
        {
            **quote.as_dict(),
            "shipping_rates": [
                {
                    "id": str(r.id),
                    "name": r.name,
                    "description": r.description,
                    "price": str(r.compute_cost(discounted_subtotal)),
                    "transit_time": r.transit_time,
                }
                for r in rates
            ],
        }
    )
