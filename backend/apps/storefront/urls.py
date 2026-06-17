from django.urls import path

from apps.storefront.views import (
    StorefrontCategoryListView,
    StorefrontCollectionListView,
    StorefrontPageView,
    StorefrontProductDetailView,
    StorefrontProductListView,
    robots_txt,
    sitemap_xml,
    storefront_blog_categories,
    storefront_blog_list,
    storefront_blog_post,
    storefront_blog_rss,
    storefront_blog_subscribe,
    storefront_home,
)

app_name = "storefront"

urlpatterns = [
    path("<str:subdomain>/robots.txt", robots_txt, name="storefront-robots"),
    path("<str:subdomain>/sitemap.xml", sitemap_xml, name="storefront-sitemap"),
    path("<str:subdomain>/", storefront_home, name="storefront-home"),
    path(
        "<str:subdomain>/products/", StorefrontProductListView.as_view(), name="storefront-products"
    ),
    path(
        "<str:subdomain>/products/<slug:slug>/",
        StorefrontProductDetailView.as_view(),
        name="storefront-product-detail",
    ),
    path(
        "<str:subdomain>/categories/",
        StorefrontCategoryListView.as_view(),
        name="storefront-categories",
    ),
    path(
        "<str:subdomain>/collections/",
        StorefrontCollectionListView.as_view(),
        name="storefront-collections",
    ),
    path(
        "<str:subdomain>/pages/<slug:slug>/", StorefrontPageView.as_view(), name="storefront-page"
    ),
    path("<str:subdomain>/blog/", storefront_blog_list, name="storefront-blog-list"),
    path(
        "<str:subdomain>/blog/categories/",
        storefront_blog_categories,
        name="storefront-blog-categories",
    ),
    path(
        "<str:subdomain>/blog/subscribe/",
        storefront_blog_subscribe,
        name="storefront-blog-subscribe",
    ),
    path("<str:subdomain>/blog/rss/", storefront_blog_rss, name="storefront-blog-rss"),
    path("<str:subdomain>/blog/<slug:slug>/", storefront_blog_post, name="storefront-blog-post"),
]
