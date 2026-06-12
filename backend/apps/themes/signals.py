from __future__ import annotations

from django.db.models.signals import post_migrate
from django.dispatch import receiver


# ---------------------------------------------------------------------------
# Homepage section templates per niche
# ---------------------------------------------------------------------------

_MODERN_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Welcome to Our Store",
                "subtitle": "Discover amazing products at unbeatable prices",
                "buttonText": "Shop Now",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.4,
                "alignment": "center",
                "textColor": "#ffffff",
                "minHeight": 500,
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Featured Products",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "What Our Customers Say",
                "testimonials": [
                    {"name": "Sarah M.", "quote": "Absolutely love the quality! Will definitely shop here again.", "rating": 5},
                    {"name": "James L.", "quote": "Fast shipping and great customer service.", "rating": 5},
                    {"name": "Emily R.", "quote": "Best online shopping experience I've had.", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Stay in the Loop",
                "subtitle": "Subscribe for exclusive deals and new arrivals",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "We respect your privacy. Unsubscribe at any time.",
            },
        },
    ]
}

_MINIMAL_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Simply Better",
                "subtitle": "Curated essentials for modern living",
                "buttonText": "Explore",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.3,
                "alignment": "center",
                "textColor": "#000000",
                "minHeight": 450,
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Our Collection",
                "columns": 3,
                "productsPerPage": 6,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": False,
                "collectionSlug": "",
            },
        },
        {
            "id": "faq-1",
            "type": "faq",
            "settings": {
                "title": "Common Questions",
                "items": [
                    {"question": "What is your return policy?", "answer": "We offer a 30-day return policy on all items."},
                    {"question": "How long does shipping take?", "answer": "Standard shipping takes 3-5 business days."},
                    {"question": "Do you ship internationally?", "answer": "Yes, we ship to over 50 countries worldwide."},
                ],
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Newsletter",
                "subtitle": "Get updates on new arrivals and exclusive offers",
                "placeholder": "Your email address",
                "buttonText": "Subscribe",
                "privacyText": "",
            },
        },
    ]
}

_LUXURY_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Timeless Elegance",
                "subtitle": "Exquisite craftsmanship for the discerning few",
                "buttonText": "Discover the Collection",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.35,
                "alignment": "center",
                "textColor": "#fefcf3",
                "minHeight": 550,
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Curated Selection",
                "columns": 3,
                "productsPerPage": 6,
                "sortBy": "price",
                "showPrices": True,
                "showBadges": False,
                "collectionSlug": "",
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Client Stories",
                "testimonials": [
                    {"name": "Victoria C.", "quote": "Exceptional quality and attention to detail. Worth every penny.", "rating": 5},
                    {"name": "Alexander P.", "quote": "A truly luxurious experience from start to finish.", "rating": 5},
                    {"name": "Isabella M.", "quote": "The craftsmanship is unparalleled. Simply stunning.", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Private Access",
                "subtitle": "Be the first to discover new collections and exclusive events",
                "placeholder": "Your email address",
                "buttonText": "Join",
                "privacyText": "Your information is kept strictly confidential.",
            },
        },
    ]
}

_FRESHMARKET_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Farm Fresh to Your Door",
                "subtitle": "Organic, sustainable, and naturally delicious",
                "buttonText": "Shop Organic",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.35,
                "alignment": "center",
                "textColor": "#1b4332",
                "minHeight": 500,
            },
        },
        {
            "id": "banner-1",
            "type": "banner",
            "settings": {
                "title": "Free Delivery on Orders Over $50",
                "subtitle": "Fresh produce delivered weekly to your doorstep",
                "backgroundImage": "",
                "buttonText": "Start Shopping",
                "buttonLink": "/products",
                "textColor": "#ffffff",
                "backgroundColor": "#2d6a4f",
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Popular This Week",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Happy Customers",
                "testimonials": [
                    {"name": "Maria G.", "quote": "The freshest produce I've ever received. You can taste the difference!", "rating": 5},
                    {"name": "David K.", "quote": "My family loves the weekly organic box. Amazing quality.", "rating": 5},
                    {"name": "Sophie L.", "quote": "Finally, a grocery service that truly cares about sustainability.", "rating": 5},
                ],
                "layout": "grid",
            },
        },
        {
            "id": "faq-1",
            "type": "faq",
            "settings": {
                "title": "Questions About Our Products",
                "items": [
                    {"question": "Are your products certified organic?", "answer": "Yes, all our products are certified organic by recognized agricultural bodies."},
                    {"question": "How do you ensure freshness?", "answer": "We harvest and ship within 24 hours to ensure maximum freshness."},
                    {"question": "Can I customize my weekly box?", "answer": "Absolutely! You can choose exactly what goes into your delivery."},
                ],
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Get Weekly Recipes & Deals",
                "subtitle": "Fresh recipes and seasonal offers delivered to your inbox",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "We respect your privacy. Unsubscribe at any time.",
            },
        },
    ]
}

_TECHVOLT_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Future Tech, Today",
                "subtitle": "Cutting-edge electronics and gadgets",
                "buttonText": "Shop Tech",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.5,
                "alignment": "center",
                "textColor": "#e0e0e0",
                "minHeight": 520,
            },
        },
        {
            "id": "banner-1",
            "type": "banner",
            "settings": {
                "title": "Free Express Shipping on All Orders",
                "subtitle": "Get your tech delivered in 1-2 business days",
                "backgroundImage": "",
                "buttonText": "Shop Now",
                "buttonLink": "/products",
                "textColor": "#0a0a0f",
                "backgroundColor": "#00ff88",
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Trending Now",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Tech Enthusiasts Love Us",
                "testimonials": [
                    {"name": "Alex T.", "quote": "Blown away by the specs for the price. Incredible value.", "rating": 5},
                    {"name": "Jordan P.", "quote": "Fast delivery and the product exceeded expectations.", "rating": 5},
                    {"name": "Sam W.", "quote": "Best tech store online. Period.", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Stay Ahead of the Curve",
                "subtitle": "Get notified about new releases and exclusive tech deals",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "No spam. Unsubscribe anytime.",
            },
        },
    ]
}

_STYLEHAUS_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Define Your Style",
                "subtitle": "Curated fashion for the modern wardrobe",
                "buttonText": "Shop the Collection",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.35,
                "alignment": "center",
                "textColor": "#ffffff",
                "minHeight": 530,
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "New Arrivals",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "gallery-1",
            "type": "gallery",
            "settings": {
                "title": "Lookbook",
                "images": [],
                "columns": 3,
                "aspectRatio": "3/4",
                "lightbox": True,
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Style Inspo from Our Community",
                "testimonials": [
                    {"name": "Olivia N.", "quote": "Absolutely obsessed with every piece. Quality is unmatched.", "rating": 5},
                    {"name": "Mia R.", "quote": "Finally found my go-to fashion store. Love the aesthetic!", "rating": 5},
                    {"name": "Charlotte B.", "quote": "Received so many compliments. Will be ordering again!", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Join the Inner Circle",
                "subtitle": "Early access to new collections and exclusive discounts",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "We respect your privacy. Unsubscribe at any time.",
            },
        },
    ]
}

_FITFORGE_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Push Your Limits",
                "subtitle": "Premium fitness gear, supplements, and apparel",
                "buttonText": "Shop Gear",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.5,
                "alignment": "center",
                "textColor": "#f5f5f5",
                "minHeight": 520,
            },
        },
        {
            "id": "banner-1",
            "type": "banner",
            "settings": {
                "title": "Build Your Perfect Stack",
                "subtitle": "Bundle & save 20% on supplements and accessories",
                "backgroundImage": "",
                "buttonText": "Shop Bundles",
                "buttonLink": "/products",
                "textColor": "#ffffff",
                "backgroundColor": "#dc2626",
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Best Sellers",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Athletes Trust Us",
                "testimonials": [
                    {"name": "Mike D.", "quote": "The supplements are top-notch. Noticed real results in 2 weeks.", "rating": 5},
                    {"name": "Jessica H.", "quote": "Best gym gear I've owned. Built to last.", "rating": 5},
                    {"name": "Chris B.", "quote": "Fast shipping and amazing product range. My go-to store.", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "faq-1",
            "type": "faq",
            "settings": {
                "title": "Frequently Asked Questions",
                "items": [
                    {"question": "Are your supplements third-party tested?", "answer": "Yes, all our supplements are independently tested for purity and potency."},
                    {"question": "What is your return policy?", "answer": "We offer a 60-day satisfaction guarantee on all products."},
                    {"question": "Do you offer subscription discounts?", "answer": "Yes, save 15% with auto-delivery on any supplement."},
                ],
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Train Smarter",
                "subtitle": "Workout tips, nutrition guides, and exclusive deals",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "No spam. Unsubscribe anytime.",
            },
        },
    ]
}

_BLOOMCO_HOMEPAGE = {
    "sections": [
        {
            "id": "hero-1",
            "type": "hero",
            "settings": {
                "title": "Glow Naturally",
                "subtitle": "Clean beauty for radiant skin and hair",
                "buttonText": "Shop Beauty",
                "buttonLink": "/products",
                "backgroundImage": "",
                "overlayOpacity": 0.3,
                "alignment": "center",
                "textColor": "#3b0764",
                "minHeight": 500,
            },
        },
        {
            "id": "products-1",
            "type": "product-grid",
            "settings": {
                "title": "Our Bestsellers",
                "columns": 4,
                "productsPerPage": 8,
                "sortBy": "created_at",
                "showPrices": True,
                "showBadges": True,
                "collectionSlug": "",
            },
        },
        {
            "id": "gallery-1",
            "type": "gallery",
            "settings": {
                "title": "Before & After",
                "images": [],
                "columns": 3,
                "aspectRatio": "1/1",
                "lightbox": True,
            },
        },
        {
            "id": "testimonials-1",
            "type": "testimonials",
            "settings": {
                "title": "Real Results",
                "testimonials": [
                    {"name": "Aisha K.", "quote": "My skin has never looked better. These products are magical.", "rating": 5},
                    {"name": "Lauren T.", "quote": "Clean ingredients that actually work. I'm hooked!", "rating": 5},
                    {"name": "Priya S.", "quote": "The best beauty investment I've made. Absolutely love it.", "rating": 5},
                ],
                "layout": "carousel",
            },
        },
        {
            "id": "newsletter-1",
            "type": "newsletter",
            "settings": {
                "title": "Beauty Secrets & Offers",
                "subtitle": "Skincare tips, new launches, and member-only discounts",
                "placeholder": "Enter your email",
                "buttonText": "Subscribe",
                "privacyText": "We respect your privacy. Unsubscribe at any time.",
            },
        },
    ]
}

# Map of homepage templates by theme slug
HOMEPAGE_TEMPLATES = {
    "modern": _MODERN_HOMEPAGE,
    "minimal": _MINIMAL_HOMEPAGE,
    "luxury": _LUXURY_HOMEPAGE,
    "freshmarket": _FRESHMARKET_HOMEPAGE,
    "techvolt": _TECHVOLT_HOMEPAGE,
    "stylehaus": _STYLEHAUS_HOMEPAGE,
    "fitforge": _FITFORGE_HOMEPAGE,
    "bloom-co": _BLOOMCO_HOMEPAGE,
}


# ---------------------------------------------------------------------------
# All 8 themes with configs and presets
# ---------------------------------------------------------------------------

THEMES_DATA = [
    # =======================================================================
    # 1. MODERN — General / broad e-commerce
    # =======================================================================
    {
        "name": "Modern",
        "slug": "modern",
        "config": {
            "colors": {
                "primary": "#2563eb",
                "secondary": "#64748b",
                "accent": "#10b981",
                "background": "#ffffff",
                "surface": "#f8fafc",
                "text": "#0f172a",
                "textSecondary": "#64748b",
                "border": "#e2e8f0",
                "error": "#ef4444",
                "success": "#10b981",
                "warning": "#f59e0b",
            },
            "typography": {
                "headingFont": "Inter",
                "bodyFont": "Inter",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 80,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1200,
                "gridGap": 24,
            },
            "borderRadius": {"small": 4, "medium": 8, "large": 16, "full": 9999},
            "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0f172a",
                        "surface": "#1e293b",
                        "text": "#f8fafc",
                        "textSecondary": "#94a3b8",
                        "border": "#334155",
                    }
                },
            },
            {
                "name": "Ocean Blue",
                "config": {
                    "colors": {
                        "primary": "#0284c7",
                        "accent": "#06b6d4",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 2. MINIMAL — Premium / artisan / high-end small brands
    # =======================================================================
    {
        "name": "Minimal",
        "slug": "minimal",
        "config": {
            "colors": {
                "primary": "#000000",
                "secondary": "#525252",
                "accent": "#000000",
                "background": "#ffffff",
                "surface": "#fafafa",
                "text": "#000000",
                "textSecondary": "#737373",
                "border": "#e5e5e5",
                "error": "#dc2626",
                "success": "#16a34a",
                "warning": "#ca8a04",
            },
            "typography": {
                "headingFont": "system-ui",
                "bodyFont": "system-ui",
                "baseFontSize": 16,
                "scale": 1.2,
                "lineHeight": 1.5,
            },
            "spacing": {
                "sectionPaddingY": 96,
                "sectionPaddingX": 32,
                "containerMaxWidth": 1100,
                "gridGap": 32,
            },
            "borderRadius": {"small": 0, "medium": 0, "large": 0, "full": 9999},
            "animations": {"enabled": False, "duration": "fast", "easing": "ease"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0a0a0a",
                        "surface": "#171717",
                        "text": "#fafafa",
                        "textSecondary": "#a3a3a3",
                        "border": "#262626",
                    }
                },
            },
            {
                "name": "Warm Gray",
                "config": {
                    "colors": {
                        "background": "#faf9f7",
                        "surface": "#f0eeeb",
                        "border": "#d6d3ce",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 3. LUXURY — Fashion / jewelry / watches
    # =======================================================================
    {
        "name": "Luxury",
        "slug": "luxury",
        "config": {
            "colors": {
                "primary": "#b8860b",
                "secondary": "#1a1a2e",
                "accent": "#c9a94e",
                "background": "#fefcf3",
                "surface": "#f5f0e8",
                "text": "#1a1a2e",
                "textSecondary": "#6b6b80",
                "border": "#d4c5a9",
                "error": "#c0392b",
                "success": "#27ae60",
                "warning": "#d4a017",
            },
            "typography": {
                "headingFont": "Playfair Display",
                "bodyFont": "Lato",
                "baseFontSize": 17,
                "scale": 1.3,
                "lineHeight": 1.7,
            },
            "spacing": {
                "sectionPaddingY": 100,
                "sectionPaddingX": 40,
                "containerMaxWidth": 1140,
                "gridGap": 28,
            },
            "borderRadius": {"small": 2, "medium": 4, "large": 8, "full": 9999},
            "animations": {"enabled": True, "duration": "slow", "easing": "cubic-bezier(0.4, 0, 0.2, 1)"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0d0d1a",
                        "surface": "#1a1a2e",
                        "text": "#f5f0e8",
                        "textSecondary": "#a0a0b0",
                        "border": "#2a2a3e",
                        "primary": "#c9a94e",
                    }
                },
            },
            {
                "name": "Rose Gold",
                "config": {
                    "colors": {
                        "primary": "#b76e79",
                        "accent": "#e8b4b8",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 4. FRESH MARKET — Organic food & grocery
    # =======================================================================
    {
        "name": "FreshMarket",
        "slug": "freshmarket",
        "config": {
            "colors": {
                "primary": "#2d6a4f",
                "secondary": "#40916c",
                "accent": "#95d5b2",
                "background": "#fefae0",
                "surface": "#f0f7f0",
                "text": "#1b4332",
                "textSecondary": "#52796f",
                "border": "#b7e4c7",
                "error": "#e63946",
                "success": "#2d6a4f",
                "warning": "#e9c46a",
            },
            "typography": {
                "headingFont": "Montserrat",
                "bodyFont": "Lato",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 80,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1200,
                "gridGap": 24,
            },
            "borderRadius": {"small": 8, "medium": 12, "large": 20, "full": 9999},
            "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0d1f12",
                        "surface": "#1a2e1f",
                        "text": "#d8f3dc",
                        "textSecondary": "#95d5b2",
                        "border": "#2d6a4f",
                    }
                },
            },
            {
                "name": "Harvest",
                "config": {
                    "colors": {
                        "primary": "#bc6c25",
                        "accent": "#dda15e",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 5. TECH VOLT — Electronics & gadgets
    # =======================================================================
    {
        "name": "TechVolt",
        "slug": "techvolt",
        "config": {
            "colors": {
                "primary": "#0066ff",
                "secondary": "#1a1a2e",
                "accent": "#00ff88",
                "background": "#0a0a0f",
                "surface": "#12121a",
                "text": "#e0e0e0",
                "textSecondary": "#8888aa",
                "border": "#2a2a3e",
                "error": "#ff4444",
                "success": "#00ff88",
                "warning": "#ffaa00",
            },
            "typography": {
                "headingFont": "Roboto",
                "bodyFont": "Inter",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 72,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1280,
                "gridGap": 24,
            },
            "borderRadius": {"small": 4, "medium": 8, "large": 12, "full": 9999},
            "animations": {"enabled": True, "duration": "fast", "easing": "ease-out"},
            "darkMode": {"enabled": True, "default": True, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Neon",
                "config": {
                    "colors": {
                        "primary": "#00ccff",
                        "accent": "#ff00ff",
                    }
                },
            },
            {
                "name": "Midnight",
                "config": {
                    "colors": {
                        "background": "#000000",
                        "surface": "#0a0a0a",
                        "border": "#1a1a1a",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 6. STYLE HAUS — Fashion & apparel
    # =======================================================================
    {
        "name": "StyleHaus",
        "slug": "stylehaus",
        "config": {
            "colors": {
                "primary": "#be185d",
                "secondary": "#6b7280",
                "accent": "#f9a8d4",
                "background": "#ffffff",
                "surface": "#fdf2f8",
                "text": "#1f2937",
                "textSecondary": "#6b7280",
                "border": "#f3e8ff",
                "error": "#e11d48",
                "success": "#16a34a",
                "warning": "#f59e0b",
            },
            "typography": {
                "headingFont": "Poppins",
                "bodyFont": "Open Sans",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 96,
                "sectionPaddingX": 32,
                "containerMaxWidth": 1140,
                "gridGap": 28,
            },
            "borderRadius": {"small": 2, "medium": 6, "large": 12, "full": 9999},
            "animations": {"enabled": True, "duration": "slow", "easing": "cubic-bezier(0.4, 0, 0.2, 1)"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#1a1017",
                        "surface": "#2a1a24",
                        "text": "#fdf2f8",
                        "textSecondary": "#d4a0b9",
                        "border": "#4a2a3a",
                    }
                },
            },
            {
                "name": "Blush",
                "config": {
                    "colors": {
                        "primary": "#e879a0",
                        "accent": "#fbb6ce",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 7. FIT FORGE — Sports & fitness
    # =======================================================================
    {
        "name": "FitForge",
        "slug": "fitforge",
        "config": {
            "colors": {
                "primary": "#dc2626",
                "secondary": "#000000",
                "accent": "#f97316",
                "background": "#111111",
                "surface": "#1a1a1a",
                "text": "#f5f5f5",
                "textSecondary": "#a3a3a3",
                "border": "#333333",
                "error": "#ef4444",
                "success": "#22c55e",
                "warning": "#f59e0b",
            },
            "typography": {
                "headingFont": "Montserrat",
                "bodyFont": "Roboto",
                "baseFontSize": 16,
                "scale": 1.3,
                "lineHeight": 1.5,
            },
            "spacing": {
                "sectionPaddingY": 72,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1280,
                "gridGap": 24,
            },
            "borderRadius": {"small": 0, "medium": 4, "large": 8, "full": 9999},
            "animations": {"enabled": True, "duration": "fast", "easing": "cubic-bezier(0.4, 0, 0.2, 1)"},
            "darkMode": {"enabled": True, "default": True, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Light",
                "config": {
                    "colors": {
                        "background": "#ffffff",
                        "surface": "#f5f5f5",
                        "text": "#111111",
                        "textSecondary": "#555555",
                        "border": "#e0e0e0",
                    }
                },
            },
            {
                "name": "Red Alert",
                "config": {
                    "colors": {
                        "primary": "#ff0000",
                        "accent": "#ff4444",
                    }
                },
            },
        ],
    },
    # =======================================================================
    # 8. BLOOM & CO — Beauty & wellness
    # =======================================================================
    {
        "name": "Bloom & Co",
        "slug": "bloom-co",
        "config": {
            "colors": {
                "primary": "#7c3aed",
                "secondary": "#a78bfa",
                "accent": "#f5d0fe",
                "background": "#fffbeb",
                "surface": "#fef3c7",
                "text": "#3b0764",
                "textSecondary": "#6b21a8",
                "border": "#e9d5ff",
                "error": "#dc2626",
                "success": "#16a34a",
                "warning": "#f59e0b",
            },
            "typography": {
                "headingFont": "Lora",
                "bodyFont": "Source Sans 3",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.65,
            },
            "spacing": {
                "sectionPaddingY": 88,
                "sectionPaddingX": 32,
                "containerMaxWidth": 1100,
                "gridGap": 28,
            },
            "borderRadius": {"small": 8, "medium": 16, "large": 24, "full": 9999},
            "animations": {"enabled": True, "duration": "slow", "easing": "cubic-bezier(0.4, 0, 0.2, 1)"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#1a0a2e",
                        "surface": "#2a1a3e",
                        "text": "#f5d0fe",
                        "textSecondary": "#c084fc",
                        "border": "#4a2a6e",
                    }
                },
            },
            {
                "name": "Rose Gold",
                "config": {
                    "colors": {
                        "primary": "#b76e79",
                        "secondary": "#d4a0a7",
                        "accent": "#f5d0d6",
                    }
                },
            },
        ],
    },
]


@receiver(post_migrate, sender="themes")
def create_default_themes(sender, **kwargs):
    """Create system themes and homepage templates on migration."""
    from .models import Theme, ThemePreset

    for theme_data in THEMES_DATA:
        data = dict(theme_data)
        presets_data = data.pop("presets")
        slug = data["slug"]
        theme, created = Theme.objects.get_or_create(
            slug=slug,
            defaults={
                **data,
                "is_system": True,
                "organization": None,
            },
        )
        if created:
            for preset_data in presets_data:
                ThemePreset.objects.get_or_create(
                    theme=theme,
                    name=preset_data["name"],
                    defaults={"config": preset_data["config"]},
                )
            # Attach homepage template if available
            homepage = HOMEPAGE_TEMPLATES.get(slug)
            if homepage:
                theme.sections_schema = homepage
                theme.save(update_fields=["sections_schema"])
