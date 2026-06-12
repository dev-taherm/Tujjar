from __future__ import annotations

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplace.models import MarketplaceListing, MarketplaceReview, MarketplaceOrder
from apps.marketplace.serializers import (
    MarketplaceListingSerializer,
    MarketplaceReviewSerializer,
    MarketplaceOrderSerializer,
)
class MarketplaceListingViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceListing.objects.filter(status=MarketplaceListing.Status.APPROVED)
    serializer_class = MarketplaceListingSerializer

    def get_queryset(self):
        qs = MarketplaceListing.objects.filter(status=MarketplaceListing.Status.APPROVED)
        category = self.request.query_params.get("category")
        pricing = self.request.query_params.get("pricing_type")
        search = self.request.query_params.get("search")
        featured = self.request.query_params.get("featured")

        if category:
            qs = qs.filter(category=category)
        if pricing:
            qs = qs.filter(pricing_type=pricing)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if featured:
            qs = qs.filter(is_featured=True)
        return qs

    @action(detail=True, methods=["post"])
    def install(self, request, pk=None):
        listing = self.get_object()
        listing.download_count += 1
        listing.save(update_fields=["download_count"])
        return Response({"status": "installed", "theme_id": str(listing.theme_id)})

    @action(detail=False, methods=["get"])
    def categories(self, request):
        cats = MarketplaceListing.objects.filter(
            status=MarketplaceListing.Status.APPROVED,
        ).values_list("category", flat=True).distinct().order_by("category")
        return Response({"categories": list(cats)})

    @action(detail=True, methods=["get", "post"])
    def reviews(self, request, pk=None):
        listing = self.get_object()
        if request.method == "GET":
            reviews = listing.reviews.all()[:20]
            serializer = MarketplaceReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        elif request.method == "POST":
            serializer = MarketplaceReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(listing=listing, user=request.user)
            return Response(serializer.data, status=201)


class MyListingsViewSet(viewsets.ModelViewSet):
    serializer_class = MarketplaceListingSerializer

    def get_queryset(self):
        return MarketplaceListing.objects.filter(developer=self.request.user)
