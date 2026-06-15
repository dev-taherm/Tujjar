from django.urls import path

from apps.storefront.views import (
    storefront_home,
    StorefrontProductListView,
    StorefrontProductDetailView,
    StorefrontCategoryListView,
    StorefrontCollectionListView,
    StorefrontPageView,
    robots_txt,
    sitemap_xml,
)

app_name = "storefront"

urlpatterns = [
    path("<str:subdomain>/robots.txt", robots_txt, name="storefront-robots"),
    path("<str:subdomain>/sitemap.xml", sitemap_xml, name="storefront-sitemap"),
    path("<str:subdomain>/", storefront_home, name="storefront-home"),
    path("<str:subdomain>/products/", StorefrontProductListView.as_view(), name="storefront-products"),
    path("<str:subdomain>/products/<slug:slug>/", StorefrontProductDetailView.as_view(), name="storefront-product-detail"),
    path("<str:subdomain>/categories/", StorefrontCategoryListView.as_view(), name="storefront-categories"),
    path("<str:subdomain>/collections/", StorefrontCollectionListView.as_view(), name="storefront-collections"),
    path("<str:subdomain>/pages/<slug:slug>/", StorefrontPageView.as_view(), name="storefront-page"),
]
