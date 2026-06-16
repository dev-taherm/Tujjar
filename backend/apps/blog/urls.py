from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"categories", views.BlogCategoryViewSet, basename="blog-category")
router.register(r"tags", views.BlogTagViewSet, basename="blog-tag")
router.register(r"authors", views.BlogAuthorViewSet, basename="blog-author")
router.register(r"posts", views.BlogPostViewSet, basename="blog-post")
router.register(r"comments", views.BlogCommentViewSet, basename="blog-comment")
router.register(r"subscribers", views.BlogSubscriberViewSet, basename="blog-subscriber")

app_name = "blog"

urlpatterns = [
    path("", include(router.urls)),
    path(
        "posts/<uuid:post_id>/public-comment/",
        views.BlogPublicCommentView.as_view(),
        name="blog-public-comment",
    ),
    path(
        "posts/<uuid:post_id>/subscribe/",
        views.BlogPublicSubscribeView.as_view(),
        name="blog-public-subscribe",
    ),
]
