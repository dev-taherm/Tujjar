from django.urls import path

from apps.payments.views import checkout_config, create_card_payment, stripe_webhook

app_name = "payments"

urlpatterns = [
    path("config/<str:subdomain>/", checkout_config, name="checkout-config"),
    path("stripe/webhook/", stripe_webhook, name="stripe-webhook"),
    path("stripe/<str:subdomain>/create/", create_card_payment, name="stripe-create"),
]
