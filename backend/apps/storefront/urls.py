from django.urls import path

from apps.customers.storefront_views import storefront_product_reviews
from apps.storefront.views import (
    StorefrontCategoryListView,
    StorefrontCollectionListView,
    StorefrontPageView,
    StorefrontProductDetailView,
    StorefrontProductListView,
    checkout_place_order,
    checkout_quote,
    robots_txt,
    sitemap_xml,
    storefront_blog_categories,
    storefront_blog_list,
    storefront_blog_post,
    storefront_blog_rss,
    storefront_blog_subscribe,
    storefront_home,
    storefront_stores_list,
)

app_name = "storefront"

urlpatterns = [
    path("", storefront_stores_list, name="storefront-stores-list"),
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
        "<str:subdomain>/products/<slug:slug>/reviews/",
        storefront_product_reviews,
        name="storefront-product-reviews",
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
    path("<str:subdomain>/checkout/quote/", checkout_quote, name="storefront-checkout-quote"),
    path("<str:subdomain>/checkout/", checkout_place_order, name="storefront-checkout"),
]
