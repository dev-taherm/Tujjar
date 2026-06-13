"""Complete template definitions for the 5 pre-built store templates."""
from __future__ import annotations

# ─── Helper ───────────────────────────────────────────────────────────────────

def _hero(title, subtitle="", button_text="", button_link="/", bg="", overlay=0.4, alignment="center", text_color="#ffffff", min_height=500):
    return {
        "type": "hero",
        "settings": {
            "title": title,
            "subtitle": subtitle,
            "buttonText": button_text,
            "buttonLink": button_link,
            "backgroundImage": bg,
            "overlayOpacity": overlay,
            "alignment": alignment,
            "textColor": text_color,
            "minHeight": min_height,
        },
    }


def _product_grid(title="Featured Products", columns=4, per_page=8, sort="created_at", collection=""):
    return {
        "type": "product-grid",
        "settings": {
            "title": title,
            "columns": columns,
            "productsPerPage": per_page,
            "sortBy": sort,
            "showPrices": True,
            "showBadges": True,
            "collectionSlug": collection,
        },
    }


def _banner(title, subtitle="", button_text="", button_link="/", bg_color="#1a1a2e", text_color="#ffffff"):
    return {
        "type": "banner",
        "settings": {
            "title": title,
            "subtitle": subtitle,
            "backgroundImage": "",
            "buttonText": button_text,
            "buttonLink": button_link,
            "textColor": text_color,
            "backgroundColor": bg_color,
        },
    }


def _testimonials(title="What Our Customers Say", items=None, layout="carousel"):
    if items is None:
        items = [
            {"name": "Sarah M.", "quote": "Absolutely love the quality! Will definitely shop here again.", "rating": 5},
            {"name": "James L.", "quote": "Fast shipping and the product exceeded my expectations.", "rating": 5},
            {"name": "Emily R.", "quote": "Customer service was outstanding. Highly recommend!", "rating": 4},
        ]
    return {
        "type": "testimonials",
        "settings": {
            "title": title,
            "testimonials": items,
            "layout": layout,
        },
    }


def _newsletter(title="Stay in the Loop", subtitle="Subscribe for exclusive offers and updates.", placeholder="Enter your email", button_text="Subscribe"):
    return {
        "type": "newsletter",
        "settings": {
            "title": title,
            "subtitle": subtitle,
            "placeholder": placeholder,
            "buttonText": button_text,
            "privacyText": "We respect your privacy. Unsubscribe at any time.",
        },
    }


def _faq(title="Frequently Asked Questions", items=None):
    if items is None:
        items = [
            {"question": "What are your shipping options?", "answer": "We offer free standard shipping on orders over $50. Express shipping is available for an additional fee."},
            {"question": "How do I return an item?", "answer": "You can return any item within 30 days of purchase for a full refund."},
            {"question": "Do you ship internationally?", "answer": "Yes! We ship to over 50 countries worldwide."},
        ]
    return {
        "type": "faq",
        "settings": {
            "title": title,
            "items": items,
        },
    }


def _rich_text(html_content, alignment="left"):
    return {
        "type": "rich-text",
        "settings": {
            "htmlContent": html_content,
            "maxWidth": 800,
            "alignment": alignment,
        },
    }


def _gallery(title="Gallery", images=None, columns=3):
    return {
        "type": "gallery",
        "settings": {
            "title": title,
            "images": images or [],
            "columns": columns,
            "aspectRatio": "1:1",
            "lightbox": True,
        },
    }


def _contact(title="Get in Touch", submit_text="Send Message", success_message="Thank you! We'll get back to you within 24 hours."):
    return {
        "type": "contact",
        "settings": {
            "title": title,
            "fields": [
                {"name": "name", "label": "Full Name", "type": "text", "required": True},
                {"name": "email", "label": "Email", "type": "email", "required": True},
                {"name": "phone", "label": "Phone", "type": "tel", "required": False},
                {"name": "message", "label": "Message", "type": "textarea", "required": True},
            ],
            "submitText": submit_text,
            "successMessage": success_message,
        },
    }


def _countdown(title="Hurry! Sale Ends Soon", target_date="2026-12-31T23:59:59"):
    return {
        "type": "countdown",
        "settings": {
            "title": title,
            "targetDate": target_date,
            "showDays": True,
            "showHours": True,
            "showMinutes": True,
            "showSeconds": True,
        },
    }


def _carousel(slides=None, autoplay=True, interval=5000):
    if slides is None:
        slides = [
            {"image": "", "title": "Welcome", "subtitle": "Discover our latest collection", "buttonText": "Shop Now", "buttonLink": "/shop"},
        ]
    return {
        "type": "carousel",
        "settings": {
            "slides": slides,
            "autoplay": autoplay,
            "interval": interval,
        },
    }


def _footer(columns=None, copyright_text="All rights reserved.", social=None):
    if columns is None:
        columns = [
            {"title": "Shop", "links": [{"label": "New Arrivals", "url": "/shop?sort=new"}, {"label": "Best Sellers", "url": "/shop?sort=popular"}, {"label": "Sale", "url": "/shop?sale=true"}]},
            {"title": "Help", "links": [{"label": "FAQ", "url": "/faq"}, {"label": "Shipping", "url": "/shipping"}, {"label": "Returns", "url": "/returns"}]},
            {"title": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Contact", "url": "/contact"}, {"label": "Careers", "url": "/careers"}]},
        ]
    if social is None:
        social = {"instagram": "#", "facebook": "#", "twitter": "#"}
    return {
        "columns": columns,
        "copyright": f"© {copyright_text}",
        "social_links": social,
    }


def _nav(links=None, cta_label="", cta_url="#"):
    if links is None:
        links = [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "Shop", "url": "/shop", "order": 1},
            {"label": "About", "url": "/about", "order": 2},
            {"label": "Contact", "url": "/contact", "order": 3},
        ]
    result = {"logo_text": "", "links": links}
    if cta_label:
        result["cta_button"] = {"label": cta_label, "url": cta_url, "enabled": True}
    return result


# ─── FASHION STORE ────────────────────────────────────────────────────────────

_FASHION_PAGES = [
    {
        "title": "Home",
        "slug": "",
        "page_type": "homepage",
        "is_published": True,
        "seo_title": "Welcome to {{store_name}} | Modern Fashion",
        "seo_description": "Discover the latest fashion trends. Shop curated collections of clothing, shoes, and accessories.",
        "sections": [
            _hero(
                "New Season Collection",
                "Discover timeless elegance redefined for the modern wardrobe.",
                "Shop New Arrivals", "/shop",
            ),
            _product_grid("Featured Products", 4, 8, "created_at"),
            {
                "type": "product-grid",
                "settings": {
                    "title": "New Arrivals",
                    "columns": 4,
                    "productsPerPage": 4,
                    "sortBy": "-created_at",
                    "showPrices": True,
                    "showBadges": True,
                    "collectionSlug": "new-arrivals",
                },
            },
            _banner(
                "Summer Sale — Up to 50% Off",
                "Don't miss our biggest sale of the season. Styles that sell out fast.",
                "Shop the Sale", "/shop?sale=true",
            ),
            _product_grid("Best Sellers", 4, 4, "-total_sold"),
            _testimonials(
                "What Our Customers Say",
                [
                    {"name": "Olivia P.", "quote": "The quality of these pieces is unmatched. I get compliments every time I wear them.", "rating": 5},
                    {"name": "Emma S.", "quote": "Beautiful packaging, fast delivery, and the clothes fit perfectly. 10/10!", "rating": 5},
                    {"name": "Sophia L.", "quote": "This is my go-to store now. The curation is impeccable.", "rating": 5},
                ],
            ),
            _newsletter("Join the Inner Circle", "Be the first to know about new drops, exclusive sales, and styling tips."),
        ],
    },
    {
        "title": "About Us",
        "slug": "about",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "About {{store_name}}",
        "seo_description": "Learn about our story, mission, and commitment to sustainable fashion.",
        "sections": [
            _hero("Our Story", "Fashion that speaks to who you are.", alignment="center", min_height=400),
            _rich_text(
                "<h2>Founded on Passion</h2>"
                "<p>We started with a simple belief: everyone deserves to feel confident in what they wear. "
                "Every piece in our collection is carefully selected for quality, comfort, and timeless style.</p>"
                "<p>From everyday essentials to statement pieces, we curate fashion that empowers you to express "
                "your unique identity. We partner with ethical manufacturers who share our commitment to "
                "sustainability and fair labor practices.</p>"
            ),
            _testimonials(
                "Customer Love",
                [
                    {"name": "Hannah K.", "quote": "I love that this brand cares about sustainability. The quality shows.", "rating": 5},
                    {"name": "Grace M.", "quote": "Finally a brand that combines style with ethics. My favorite store!", "rating": 5},
                ],
            ),
            _newsletter("Stay Connected", "Follow our journey and get exclusive offers."),
        ],
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Contact {{store_name}}",
        "seo_description": "Get in touch with us. We'd love to hear from you.",
        "sections": [
            _hero("Get in Touch", "We're here to help with any questions.", min_height=350),
            _contact("Send Us a Message", "Send Message"),
            _faq("Frequently Asked Questions", [
                {"question": "What are your shipping options?", "answer": "We offer free standard shipping on orders over $50. Express and overnight options are available at checkout."},
                {"question": "How do I track my order?", "answer": "Once your order ships, you'll receive an email with a tracking number. You can also check your account dashboard."},
                {"question": "What is your return policy?", "answer": "We accept returns within 30 days of delivery. Items must be unworn with tags attached."},
                {"question": "Do you offer international shipping?", "answer": "Yes! We ship to over 40 countries. International shipping rates are calculated at checkout."},
            ]),
        ],
    },
    {
        "title": "Shop",
        "slug": "shop",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Shop All | {{store_name}}",
        "seo_description": "Browse our complete collection of fashion, clothing, shoes, and accessories.",
        "sections": [
            _product_grid("All Products", 3, 12, "-created_at"),
        ],
    },
    {
        "title": "FAQ",
        "slug": "faq",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "FAQ | {{store_name}}",
        "seo_description": "Frequently asked questions about orders, shipping, returns, and more.",
        "sections": [
            _hero("Frequently Asked Questions", "Find answers to common questions.", min_height=300),
            _faq("Common Questions", [
                {"question": "How long does shipping take?", "answer": "Standard shipping takes 3-7 business days. Express shipping delivers within 1-3 business days."},
                {"question": "Can I change or cancel my order?", "answer": "You can modify or cancel your order within 2 hours of placing it. Contact our support team for assistance."},
                {"question": "Do you offer size guides?", "answer": "Yes! Each product page includes a detailed size guide. If you're between sizes, we recommend sizing up."},
                {"question": "Are your products sustainable?", "answer": "We prioritize sustainability by partnering with ethical manufacturers and using eco-friendly materials whenever possible."},
                {"question": "How do I use a promo code?", "answer": "Enter your promo code at checkout in the discount field. Only one code can be used per order."},
            ]),
        ],
    },
]

_FASHION_TEMPLATE = {
    "name": "Fashion Store",
    "slug": "fashion-store",
    "description": "Elegant, modern template for clothing, shoes, and accessories stores. Clean lines, neutral tones, and a sophisticated shopping experience.",
    "version": "1.0.0",
    "category": "fashion",
    "author": "Tujjar",
    "thumbnail": "",
    "preview_images": [],
    "tags": ["fashion", "elegant", "modern", "minimal", "clothing", "accessories"],
    "config": {
        "colors": {
            "primary": "#1a1a1a",
            "secondary": "#6b7280",
            "accent": "#b8860b",
            "background": "#ffffff",
            "surface": "#f9fafb",
            "text": "#111827",
            "textSecondary": "#6b7280",
            "border": "#e5e7eb",
            "error": "#dc2626",
            "success": "#16a34a",
            "warning": "#f59e0b",
        },
        "typography": {
            "headingFont": "Playfair Display",
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
        {"name": "Rose Gold", "config": {"colors": {"primary": "#8b5e3c", "accent": "#d4a574"}}},
        {"name": "Dark Mode", "config": {"colors": {"primary": "#f5f5f5", "background": "#0f0f0f", "surface": "#1a1a1a", "text": "#f5f5f5", "textSecondary": "#9ca3af", "border": "#374151"}}},
    ],
    "pages": _FASHION_PAGES,
    "navigation": _nav(
        [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "New In", "url": "/shop?sort=new", "order": 1},
            {"label": "Shop", "url": "/shop", "order": 2},
            {"label": "About", "url": "/about", "order": 3},
            {"label": "Contact", "url": "/contact", "order": 4},
        ],
        cta_label="Sale", cta_url="/shop?sale=true",
    ),
    "footer": _footer(
        [
            {"title": "Shop", "links": [{"label": "New Arrivals", "url": "/shop?sort=new"}, {"label": "Best Sellers", "url": "/shop?sort=popular"}, {"label": "Sale", "url": "/shop?sale=true"}]},
            {"title": "Help", "links": [{"label": "FAQ", "url": "/faq"}, {"label": "Shipping & Returns", "url": "/faq"}, {"label": "Size Guide", "url": "/faq"}]},
            {"title": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Contact", "url": "/contact"}, {"label": "Privacy Policy", "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "Discover {{page_title}} at {{store_name}}. Quality fashion with free shipping on orders over $50.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "The latest additions to our curated collection"},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular picks this season"},
            {"name": "Sale", "slug": "sale", "description": "Incredible deals on select styles"},
        ],
        "categories": [
            {"name": "Clothing", "slug": "clothing", "description": "Tops, bottoms, dresses, and outerwear"},
            {"name": "Shoes", "slug": "shoes", "description": "Sneakers, heels, boots, and sandals"},
            {"name": "Accessories", "slug": "accessories", "description": "Bags, jewelry, scarves, and more"},
        ],
    },
    "store_settings": {
        "description": "Curated fashion for the modern individual.",
    },
}


# ─── ELECTRONICS STORE ────────────────────────────────────────────────────────

_ELECTRONICS_PAGES = [
    {
        "title": "Home",
        "slug": "",
        "page_type": "homepage",
        "is_published": True,
        "seo_title": "Welcome to {{store_name}} | Tech & Electronics",
        "seo_description": "Shop the latest in phones, laptops, gaming gear, and accessories. Competitive prices and fast delivery.",
        "sections": [
            _hero(
                "Power Your World",
                "Discover cutting-edge technology at unbeatable prices. Free shipping on orders over $100.",
                "Shop Now", "/shop",
                bg="", text_color="#ffffff",
            ),
            {
                "type": "banner",
                "settings": {
                    "title": "Flash Sale — Up to 40% Off",
                    "subtitle": "Limited time only. Don't miss these deals.",
                    "backgroundImage": "",
                    "buttonText": "Shop Deals",
                    "buttonLink": "/shop?sale=true",
                    "textColor": "#ffffff",
                    "backgroundColor": "#1e40af",
                },
            },
            _countdown("Flash Sale Ends In", "2026-12-31T23:59:59"),
            {
                "type": "banner",
                "settings": {
                    "title": "Featured Categories",
                    "subtitle": "",
                    "backgroundImage": "",
                    "buttonText": "",
                    "buttonLink": "",
                    "textColor": "#111827",
                    "backgroundColor": "#f3f4f6",
                },
            },
            _product_grid("Top Picks", 4, 8, "-total_sold"),
            _faq("Tech Support", [
                {"question": "Do you offer warranties?", "answer": "Yes! All products come with a minimum 1-year manufacturer warranty. Extended warranties are available at checkout."},
                {"question": "Can I track my order?", "answer": "Absolutely. You'll receive tracking info via email once your order ships."},
                {"question": "Do you price match?", "answer": "We strive to offer the best prices. If you find a lower price elsewhere, contact us and we'll do our best to match it."},
            ]),
            _newsletter("Stay Ahead of the Curve", "Get notified about new product launches, exclusive deals, and tech news."),
        ],
    },
    {
        "title": "Products",
        "slug": "products",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Products | {{store_name}}",
        "seo_description": "Browse our complete range of electronics, gadgets, and tech accessories.",
        "sections": [_product_grid("All Products", 3, 12, "-created_at")],
    },
    {
        "title": "Categories",
        "slug": "categories",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Categories | {{store_name}}",
        "seo_description": "Browse by category: phones, laptops, gaming, audio, and accessories.",
        "sections": [
            _hero("Shop by Category", "Find exactly what you need.", min_height=300),
            _rich_text(
                "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;margin-top:40px'>"
                "<div style='text-align:center;padding:40px 20px;background:#f3f4f6;border-radius:12px'><h3>Phones & Tablets</h3><p>Latest smartphones and tablets</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f3f4f6;border-radius:12px'><h3>Laptops & PCs</h3><p>Powerful computing for work and play</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f3f4f6;border-radius:12px'><h3>Gaming</h3><p>Consoles, accessories, and peripherals</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f3f4f6;border-radius:12px'><h3>Audio</h3><p>Headphones, speakers, and earbuds</p></div>"
                "</div>"
            ),
        ],
    },
    {
        "title": "Deals",
        "slug": "deals",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Deals & Offers | {{store_name}}",
        "seo_description": "Save big with our current deals and limited-time offers.",
        "sections": [
            _hero(
                "Today's Deals", "Save big on top tech.", bg="#1e40af", text_color="#ffffff", min_height=350,
            ),
            _countdown("Deals End In"),
            _product_grid("On Sale Now", 4, 8, "-created_at"),
        ],
    },
    {
        "title": "Support",
        "slug": "support",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Support | {{store_name}}",
        "seo_description": "Get help with your orders, returns, and technical questions.",
        "sections": [
            _hero("How Can We Help?", min_height=300),
            _faq("Common Questions", [
                {"question": "My order hasn't arrived. What should I do?", "answer": "Check your tracking link first. If it's been more than the estimated delivery date, contact our support team and we'll investigate immediately."},
                {"question": "How do I request a refund?", "answer": "Go to your account dashboard, find the order, and click 'Request Refund'. You can also email us with your order number."},
                {"question": "Can I change my delivery address?", "answer": "If your order hasn't shipped yet, contact us immediately and we can update the address."},
                {"question": "Do you offer bulk discounts?", "answer": "Yes! For orders of 5 or more identical items, contact our sales team for special pricing."},
            ]),
            _contact("Still Need Help?", "Submit a Ticket"),
        ],
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Contact {{store_name}}",
        "seo_description": "Get in touch with our team for product questions, orders, or support.",
        "sections": [
            _hero("Contact Us", "Our team is ready to help.", min_height=300),
            _contact("Send Us a Message", "Submit"),
            _faq("Quick Answers", [
                {"question": "What are your support hours?", "answer": "Our support team is available Monday through Friday, 9am-6pm EST."},
                {"question": "Do you have a phone number?", "answer": "You can reach us at 1-800-TECH-HELP during business hours."},
            ]),
        ],
    },
]

_ELECTRONICS_TEMPLATE = {
    "name": "Electronics Store",
    "slug": "electronics-store",
    "description": "Dark, technology-focused template for phones, laptops, gaming, and accessories. Premium feel with sharp contrasts.",
    "version": "1.0.0",
    "category": "electronics",
    "author": "Tujjar",
    "thumbnail": "",
    "preview_images": [],
    "tags": ["electronics", "technology", "gadgets", "dark", "premium", "gaming"],
    "config": {
        "colors": {
            "primary": "#3b82f6",
            "secondary": "#64748b",
            "accent": "#22d3ee",
            "background": "#ffffff",
            "surface": "#f1f5f9",
            "text": "#0f172a",
            "textSecondary": "#64748b",
            "border": "#e2e8f0",
            "error": "#ef4444",
            "success": "#22c55e",
            "warning": "#eab308",
        },
        "typography": {
            "headingFont": "Inter",
            "bodyFont": "Roboto",
            "baseFontSize": 16,
            "scale": 1.25,
            "lineHeight": 1.6,
        },
        "spacing": {
            "sectionPaddingY": 72,
            "sectionPaddingX": 24,
            "containerMaxWidth": 1200,
            "gridGap": 20,
        },
        "borderRadius": {"small": 6, "medium": 10, "large": 16, "full": 9999},
        "animations": {"enabled": True, "duration": "fast", "easing": "ease-out"},
        "darkMode": {"enabled": True, "default": True, "toggle": True},
    },
    "presets": [
        {"name": "Dark Mode", "config": {}},
        {"name": "Light Mode", "config": {"colors": {"primary": "#2563eb", "background": "#ffffff", "surface": "#f8fafc", "text": "#0f172a", "textSecondary": "#64748b", "border": "#e2e8f0"}}},
        {"name": "Neon Blue", "config": {"colors": {"primary": "#3b82f6", "accent": "#60a5fa"}}},
    ],
    "pages": _ELECTRONICS_PAGES,
    "navigation": _nav(
        [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "Products", "url": "/products", "order": 1},
            {"label": "Deals", "url": "/deals", "order": 2},
            {"label": "Support", "url": "/support", "order": 3},
            {"label": "Contact", "url": "/contact", "order": 4},
        ],
        cta_label="Deals", cta_url="/deals",
    ),
    "footer": _footer(
        [
            {"title": "Products", "links": [{"label": "Phones & Tablets", "url": "/categories"}, {"label": "Laptops & PCs", "url": "/categories"}, {"label": "Gaming", "url": "/categories"}, {"label": "Audio", "url": "/categories"}]},
            {"title": "Support", "links": [{"label": "Help Center", "url": "/support"}, {"label": "Warranty Info", "url": "/support"}, {"label": "Track Order", "url": "/support"}]},
            {"title": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Contact", "url": "/contact"}, {"label": "Privacy Policy", "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{page_title}} at {{store_name}}. Free shipping on orders over $100.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Latest tech just landed"},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular products"},
            {"name": "Deals", "slug": "deals", "description": "Limited-time offers"},
        ],
        "categories": [
            {"name": "Phones & Tablets", "slug": "phones-tablets"},
            {"name": "Laptops & PCs", "slug": "laptops-pcs"},
            {"name": "Gaming", "slug": "gaming"},
            {"name": "Audio", "slug": "audio"},
            {"name": "Accessories", "slug": "accessories"},
        ],
    },
    "store_settings": {"description": "Cutting-edge technology at competitive prices."},
}


# ─── RESTAURANT & CAFE ────────────────────────────────────────────────────────

_RESTAURANT_PAGES = [
    {
        "title": "Home",
        "slug": "",
        "page_type": "homepage",
        "is_published": True,
        "seo_title": "Welcome to {{store_name}}",
        "seo_description": "Fresh, locally sourced ingredients crafted into memorable dishes. Visit us today.",
        "sections": [
            _hero(
                "Crafted with Passion",
                "Farm-to-table dining that celebrates local flavors and seasonal ingredients.",
                "View Our Menu", "/menu",
                min_height=550,
            ),
            _banner(
                "Order Online for Pickup or Delivery",
                "Fresh meals delivered to your door. Same quality, added convenience.",
                "Order Now", "/shop",
                bg_color="#92400e", text_color="#ffffff",
            ),
            _rich_text(
                "<div style='text-align:center;max-width:700px;margin:0 auto'>"
                "<h2>Chef's Welcome</h2>"
                "<p>Every dish tells a story. We source our ingredients from local farms and artisan producers "
                "to bring you food that's honest, seasonal, and bursting with flavor. Whether you're joining us "
                "for a casual lunch or a special celebration, we want every visit to feel like coming home.</p>"
                "<p style='font-style:italic'>— Chef Marcus Rivera</p>"
                "</div>"
            ),
            _testimonials(
                "What Our Guests Say",
                [
                    {"name": "Rachel T.", "quote": "The best dining experience I've had in years. The tasting menu was extraordinary.", "rating": 5},
                    {"name": "David M.", "quote": "Incredible flavors and the ambiance is perfect for date night.", "rating": 5},
                    {"name": "Lisa K.", "quote": "We host all our family gatherings here. The staff treats us like family.", "rating": 5},
                ],
            ),
            {
                "type": "contact",
                "settings": {
                    "title": "Make a Reservation",
                    "fields": [
                        {"name": "name", "label": "Your Name", "type": "text", "required": True},
                        {"name": "email", "label": "Email", "type": "email", "required": True},
                        {"name": "phone", "label": "Phone", "type": "tel", "required": True},
                        {"name": "message", "label": "Special Requests (date, time, party size)", "type": "textarea", "required": False},
                    ],
                    "submitText": "Request Reservation",
                    "successMessage": "Thank you! We'll confirm your reservation within 2 hours.",
                },
            },
            _newsletter("Stay Updated", "Get notified about new menu items, events, and special offers."),
        ],
    },
    {
        "title": "Menu",
        "slug": "menu",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Menu | {{store_name}}",
        "seo_description": "Explore our seasonal menu featuring locally sourced ingredients.",
        "sections": [
            _hero("Our Menu", "Seasonal dishes crafted with care.", min_height=350),
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>Starters</h2>"
                "<p><strong>Seasonal Soup</strong> — $12<br><em>Ask your server for today's selection</em></p>"
                "<p><strong>Artisan Bread Board</strong> — $16<br><em>House-baked breads with olive oil and butter</em></p>"
                "<p><strong>Farmers Market Salad</strong> — $14<br><em>Fresh greens, seasonal vegetables, vinaigrette</em></p>"
                "<h2>Mains</h2>"
                "<p><strong>Pan-Seared Salmon</strong> — $28<br><em>With roasted vegetables and lemon butter sauce</em></p>"
                "<p><strong>Grass-Fed Steak</strong> — $34<br><em>8oz ribeye, mashed potatoes, seasonal greens</em></p>"
                "<p><strong>Mushroom Risotto</strong> — $22<br><em>Arborio rice, wild mushrooms, parmesan</em></p>"
                "<h2>Desserts</h2>"
                "<p><strong>Chocolate Fondant</strong> — $14<br><em>Warm center, vanilla ice cream</em></p>"
                "<p><strong>Seasonal Crumble</strong> — $12<br><em>Served with cream or ice cream</em></p>"
                "</div>"
            ),
            _faq("Dining Information", [
                {"question": "Do you accommodate dietary restrictions?", "answer": "Absolutely. We offer vegetarian, vegan, and gluten-free options. Please inform your server of any allergies."},
                {"question": "Do you take reservations?", "answer": "Yes! We recommend booking 2-3 days in advance for weekend dining."},
                {"question": "Is there parking available?", "answer": "We have a private parking lot behind the restaurant. Street parking is also available."},
            ]),
        ],
    },
    {
        "title": "About",
        "slug": "about",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "About {{store_name}}",
        "seo_description": "Our story of passion for food, community, and local ingredients.",
        "sections": [
            _hero("Our Story", "From a small kitchen to your table.", min_height=400),
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>Started in 2018</h2>"
                "<p>What began as a small café has grown into a beloved neighborhood restaurant. "
                "Our founder, Chef Marcus Rivera, dreamed of a place where food brings people together.</p>"
                "<p>We partner with over 15 local farms to bring you the freshest seasonal ingredients. "
                "Every dish is made from scratch, every day.</p>"
                "<h2>Our Values</h2>"
                "<ul>"
                "<li><strong>Fresh & Local</strong> — Ingredients sourced within 50 miles</li>"
                "<li><strong>Made from Scratch</strong> — Everything in-house, every day</li>"
                "<li><strong>Sustainable</strong> — Zero-waste kitchen, compostable packaging</li>"
                "<li><strong>Community</strong> — Supporting local farmers and producers</li>"
                "</ul>"
                "</div>"
            ),
            _gallery("Our Space", [], 3),
        ],
    },
    {
        "title": "Gallery",
        "slug": "gallery",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Gallery | {{store_name}}",
        "seo_description": "A look inside our kitchen and dining room.",
        "sections": [
            _hero("Gallery", "A glimpse into our world.", min_height=300),
            _gallery("Our Kitchen & Dining Room", [], 3),
        ],
    },
    {
        "title": "Reservations",
        "slug": "reservations",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Reservations | {{store_name}}",
        "seo_description": "Book a table at {{store_name}}.",
        "sections": [
            _hero("Reserve Your Table", "We look forward to hosting you.", min_height=350),
            {
                "type": "contact",
                "settings": {
                    "title": "Request a Reservation",
                    "fields": [
                        {"name": "name", "label": "Full Name", "type": "text", "required": True},
                        {"name": "email", "label": "Email", "type": "email", "required": True},
                        {"name": "phone", "label": "Phone", "type": "tel", "required": True},
                        {"name": "message", "label": "Date, Time, and Party Size", "type": "textarea", "required": True},
                    ],
                    "submitText": "Request Reservation",
                    "successMessage": "We'll confirm your reservation via email within 2 hours.",
                },
            },
        ],
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Contact {{store_name}}",
        "seo_description": "Visit us, call us, or send us a message.",
        "sections": [
            _hero("Visit Us", "We'd love to see you.", min_height=300),
            _rich_text(
                "<div style='max-width:600px;margin:0 auto'>"
                "<h2>Location</h2>"
                "<p>123 Main Street<br>Downtown District<br>New York, NY 10001</p>"
                "<h2>Hours</h2>"
                "<p><strong>Monday — Friday:</strong> 11:00 AM — 10:00 PM</p>"
                "<p><strong>Saturday:</strong> 10:00 AM — 11:00 PM</p>"
                "<p><strong>Sunday:</strong> 10:00 AM — 9:00 PM</p>"
                "<h2>Contact</h2>"
                "<p><strong>Phone:</strong> (555) 123-4567</p>"
                "<p><strong>Email:</strong> hello@restaurant.com</p>"
                "</div>"
            ),
            _contact("Send Us a Message", "Send"),
        ],
    },
]

_RESTAURANT_TEMPLATE = {
    "name": "Restaurant & Cafe",
    "slug": "restaurant-cafe",
    "description": "Warm, inviting template for restaurants, coffee shops, and bakeries. Elegant typography with earthy tones.",
    "version": "1.0.0",
    "category": "restaurant",
    "author": "Tujjar",
    "thumbnail": "",
    "preview_images": [],
    "tags": ["restaurant", "cafe", "food", "dining", "warm", "elegant"],
    "config": {
        "colors": {
            "primary": "#92400e",
            "secondary": "#78716c",
            "accent": "#dc2626",
            "background": "#fffbeb",
            "surface": "#fef3c7",
            "text": "#1c1917",
            "textSecondary": "#78716c",
            "border": "#e7e5e4",
            "error": "#dc2626",
            "success": "#16a34a",
            "warning": "#f59e0b",
        },
        "typography": {
            "headingFont": "Playfair Display",
            "bodyFont": "Lato",
            "baseFontSize": 17,
            "scale": 1.3,
            "lineHeight": 1.7,
        },
        "spacing": {
            "sectionPaddingY": 80,
            "sectionPaddingX": 24,
            "containerMaxWidth": 1100,
            "gridGap": 32,
        },
        "borderRadius": {"small": 4, "medium": 8, "large": 12, "full": 9999},
        "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
        "darkMode": {"enabled": False, "default": False, "toggle": False},
    },
    "presets": [
        {"name": "Warm", "config": {}},
        {"name": "Modern", "config": {"colors": {"primary": "#1c1917", "accent": "#ea580c", "background": "#ffffff"}}},
        {"name": "Cozy", "config": {"colors": {"primary": "#7c2d12", "background": "#fff7ed"}}},
    ],
    "pages": _RESTAURANT_PAGES,
    "navigation": _nav(
        [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "Menu", "url": "/menu", "order": 1},
            {"label": "About", "url": "/about", "order": 2},
            {"label": "Gallery", "url": "/gallery", "order": 3},
            {"label": "Contact", "url": "/contact", "order": 4},
        ],
        cta_label="Reserve", cta_url="/reservations",
    ),
    "footer": _footer(
        [
            {"title": "Quick Links", "links": [{"label": "Menu", "url": "/menu"}, {"label": "Reservations", "url": "/reservations"}, {"label": "Gallery", "url": "/gallery"}]},
            {"title": "Hours", "links": [{"label": "Mon-Fri: 11am-10pm", "url": "#"}, {"label": "Sat: 10am-11pm", "url": "#"}, {"label": "Sun: 10am-9pm", "url": "#"}]},
            {"title": "Contact", "links": [{"label": "123 Main Street", "url": "#"}, {"label": "(555) 123-4567", "url": "tel:5551234567"}, {"label": "hello@restaurant.com", "url": "mailto:hello@restaurant.com"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Farm-to-table dining.",
    },
    "demo_content": {
        "collections": [
            {"name": "Seasonal Specials", "slug": "seasonal-specials", "description": "This season's highlights"},
            {"name": "Chef's Picks", "slug": "chefs-picks", "description": "Hand-selected favorites"},
        ],
        "categories": [
            {"name": "Starters", "slug": "starters"},
            {"name": "Mains", "slug": "mains"},
            {"name": "Desserts", "slug": "desserts"},
            {"name": "Drinks", "slug": "drinks"},
        ],
    },
    "store_settings": {"description": "Farm-to-table dining celebrating local flavors."},
}


# ─── PHARMACY & MEDICAL ───────────────────────────────────────────────────────

_PHARMACY_PAGES = [
    {
        "title": "Home",
        "slug": "",
        "page_type": "homepage",
        "is_published": True,
        "seo_title": "Welcome to {{store_name}} | Your Health, Our Priority",
        "seo_description": "Trusted pharmacy with quality health products, expert advice, and fast delivery.",
        "sections": [
            _hero(
                "Your Health, Our Priority",
                "Quality health products with expert pharmacist guidance. Licensed and certified.",
                "Shop Products", "/shop",
                bg="#0e7490", text_color="#ffffff",
            ),
            _banner(
                "Free Delivery on Orders Over $50",
                "Convenient, discreet packaging. Same-day dispatch for orders before 2pm.",
                "Order Now", "/shop",
                bg_color="#f0fdfa", text_color="#0f766e",
            ),
            {
                "type": "product-grid",
                "settings": {
                    "title": "Popular Products",
                    "columns": 4,
                    "productsPerPage": 8,
                    "sortBy": "-total_sold",
                    "showPrices": True,
                    "showBadges": True,
                    "collectionSlug": "best-sellers",
                },
            },
            _faq("Health Questions", [
                {"question": "Do I need a prescription?", "answer": "Over-the-counter products can be purchased without a prescription. Prescription medications require a valid prescription from your healthcare provider."},
                {"question": "How do I transfer my prescription?", "answer": "Simply bring your current prescription or we can contact your previous pharmacy to transfer it for you."},
                {"question": "Do you offer medication reviews?", "answer": "Yes! Our pharmacists provide free medication reviews to help you understand your medications and identify any potential interactions."},
                {"question": "What are your delivery options?", "answer": "We offer same-day delivery for orders placed before 2pm, standard 2-3 day shipping, and free local pickup."},
            ]),
            _newsletter("Health Tips & Updates", "Subscribe for wellness tips, new product alerts, and exclusive health offers."),
        ],
    },
    {
        "title": "Products",
        "slug": "products",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Products | {{store_name}}",
        "seo_description": "Browse our range of health, wellness, and personal care products.",
        "sections": [_product_grid("All Products", 3, 12, "-created_at")],
    },
    {
        "title": "Categories",
        "slug": "categories",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Categories | {{store_name}}",
        "seo_description": "Shop by health category.",
        "sections": [
            _hero("Shop by Category", "Find the right products for your needs.", min_height=300),
            _rich_text(
                "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;margin-top:40px'>"
                "<div style='text-align:center;padding:40px 20px;background:#f0fdfa;border-radius:12px'><h3>Vitamins & Supplements</h3><p>Support your daily wellness</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f0fdfa;border-radius:12px'><h3>Personal Care</h3><p>Skincare, haircare, and hygiene</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f0fdfa;border-radius:12px'><h3>First Aid</h3><p>Essential first aid supplies</p></div>"
                "<div style='text-align:center;padding:40px 20px;background:#f0fdfa;border-radius:12px'><h3>Medical Devices</h3><p>Monitors, thermometers, and more</p></div>"
                "</div>"
            ),
        ],
    },
    {
        "title": "Health Tips",
        "slug": "health-tips",
        "page_type": "blog",
        "is_published": True,
        "seo_title": "Health Tips | {{store_name}}",
        "seo_description": "Expert health advice from our licensed pharmacists.",
        "sections": [
            _hero("Health Tips & Advice", "Expert guidance from our pharmacy team.", min_height=300),
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>5 Tips for Staying Healthy This Season</h2>"
                "<p>Our pharmacists share their top recommendations for maintaining good health year-round.</p>"
                "<ol>"
                "<li><strong>Stay Hydrated</strong> — Aim for 8 glasses of water daily</li>"
                "<li><strong>Get Enough Sleep</strong> — 7-9 hours for optimal recovery</li>"
                "<li><strong>Take Your Vitamins</strong> — Consult with our pharmacists for personalized recommendations</li>"
                "<li><strong>Exercise Regularly</strong> — Even 30 minutes of walking helps</li>"
                "<li><strong>Wash Your Hands</strong> — The simplest way to prevent illness</li>"
                "</ol>"
                "</div>"
            ),
            _faq("Common Health Questions", [
                {"question": "How should I store my medications?", "answer": "Most medications should be stored in a cool, dry place away from direct sunlight. Some may require refrigeration. Check the label for specific instructions."},
                {"question": "Can I take multiple vitamins together?", "answer": "Some vitamins are best absorbed together, while others compete for absorption. Our pharmacists can advise you on the best combination."},
                {"question": "How do I know if a supplement is quality?", "answer": "Look for third-party testing seals like USP or NSF. We only carry products from reputable manufacturers."},
            ]),
        ],
    },
    {
        "title": "About",
        "slug": "about",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "About {{store_name}}",
        "seo_description": "Your trusted local pharmacy since 2005.",
        "sections": [
            _hero("About Us", "Trusted by our community for over 15 years.", min_height=400),
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>Our Commitment to Health</h2>"
                "<p>Founded in 2005, we've been serving our community with dedication and care. "
                "Our licensed pharmacists are always available to answer your questions and provide personalized guidance.</p>"
                "<h2>Why Choose Us?</h2>"
                "<ul>"
                "<li><strong>Licensed Pharmacists</strong> — Always available for consultations</li>"
                "<li><strong>Quality Products</strong> — Only from trusted manufacturers</li>"
                "<li><strong>Fast Delivery</strong> — Same-day dispatch available</li>"
                "<li><strong>Insurance Accepted</strong> — We work with most major insurance providers</li>"
                "</ul>"
                "</div>"
            ),
        ],
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Contact {{store_name}}",
        "seo_description": "Contact our pharmacy for prescriptions, questions, or consultations.",
        "sections": [
            _hero("Contact Us", "We're here to help.", min_height=300),
            _rich_text(
                "<div style='max-width:600px;margin:0 auto'>"
                "<h2>Visit Us</h2>"
                "<p>456 Health Avenue<br>Medical District<br>Springfield, IL 62701</p>"
                "<h2>Hours</h2>"
                "<p><strong>Monday — Friday:</strong> 8:00 AM — 9:00 PM</p>"
                "<p><strong>Saturday:</strong> 9:00 AM — 7:00 PM</p>"
                "<p><strong>Sunday:</strong> 10:00 AM — 5:00 PM</p>"
                "<h2>Phone</h2>"
                "<p>(555) 987-6543</p>"
                "</div>"
            ),
            _contact("Send Us a Message", "Send"),
        ],
    },
]

_PHARMACY_TEMPLATE = {
    "name": "Pharmacy & Medical Store",
    "slug": "pharmacy-medical",
    "description": "Clean, trustworthy template for pharmacies, healthcare stores, and medical supplies. Professional and reassuring.",
    "version": "1.0.0",
    "category": "pharmacy",
    "author": "Tujjar",
    "thumbnail": "",
    "preview_images": [],
    "tags": ["pharmacy", "health", "medical", "clean", "professional", "trustworthy"],
    "config": {
        "colors": {
            "primary": "#0e7490",
            "secondary": "#64748b",
            "accent": "#059669",
            "background": "#ffffff",
            "surface": "#f0fdfa",
            "text": "#0f172a",
            "textSecondary": "#64748b",
            "border": "#e2e8f0",
            "error": "#dc2626",
            "success": "#059669",
            "warning": "#d97706",
        },
        "typography": {
            "headingFont": "Inter",
            "bodyFont": "Inter",
            "baseFontSize": 16,
            "scale": 1.25,
            "lineHeight": 1.6,
        },
        "spacing": {
            "sectionPaddingY": 72,
            "sectionPaddingX": 24,
            "containerMaxWidth": 1200,
            "gridGap": 24,
        },
        "borderRadius": {"small": 4, "medium": 8, "large": 12, "full": 9999},
        "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
        "darkMode": {"enabled": False, "default": False, "toggle": False},
    },
    "presets": [
        {"name": "Clean Blue", "config": {}},
        {"name": "Fresh Green", "config": {"colors": {"primary": "#059669", "accent": "#0e7490"}}},
        {"name": "Professional", "config": {"colors": {"primary": "#1e40af", "accent": "#0ea5e9"}}},
    ],
    "pages": _PHARMACY_PAGES,
    "navigation": _nav(
        [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "Products", "url": "/products", "order": 1},
            {"label": "Categories", "url": "/categories", "order": 2},
            {"label": "Health Tips", "url": "/health-tips", "order": 3},
            {"label": "About", "url": "/about", "order": 4},
            {"label": "Contact", "url": "/contact", "order": 5},
        ],
        cta_label="Order Now", cta_url="/shop",
    ),
    "footer": _footer(
        [
            {"title": "Products", "links": [{"label": "Vitamins & Supplements", "url": "/categories"}, {"label": "Personal Care", "url": "/categories"}, {"label": "First Aid", "url": "/categories"}, {"label": "Medical Devices", "url": "/categories"}]},
            {"title": "Resources", "links": [{"label": "Health Tips", "url": "/health-tips"}, {"label": "FAQ", "url": "/faq"}, {"label": "Prescription Transfer", "url": "/contact"}]},
            {"title": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Contact", "url": "/contact"}, {"label": "Privacy Policy", "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Your trusted pharmacy.",
    },
    "demo_content": {
        "collections": [
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular health products"},
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Recently added products"},
        ],
        "categories": [
            {"name": "Vitamins & Supplements", "slug": "vitamins-supplements"},
            {"name": "Personal Care", "slug": "personal-care"},
            {"name": "First Aid", "slug": "first-aid"},
            {"name": "Medical Devices", "slug": "medical-devices"},
        ],
    },
    "store_settings": {"description": "Your trusted pharmacy. Expert advice, quality products."},
}


# ─── FURNITURE & HOME DECOR ──────────────────────────────────────────────────

_FURNITURE_PAGES = [
    {
        "title": "Home",
        "slug": "",
        "page_type": "homepage",
        "is_published": True,
        "seo_title": "Welcome to {{store_name}} | Furniture & Home Decor",
        "seo_description": "Discover beautifully crafted furniture and home decor. Transform your space with our curated collections.",
        "sections": [
            _carousel(
                [
                    {"image": "", "title": "Living Room Collection", "subtitle": "Comfortable seating designed for modern living", "buttonText": "Explore", "buttonLink": "/collections"},
                    {"image": "", "title": "Bedroom Essentials", "subtitle": "Create your perfect sanctuary", "buttonText": "Shop Now", "buttonLink": "/shop"},
                    {"image": "", "title": "Summer Sale", "subtitle": "Up to 40% off select furniture", "buttonText": "Shop Sale", "buttonLink": "/shop?sale=true"},
                ],
            ),
            _banner(
                "New: Scandinavian Collection",
                "Clean lines, natural materials, timeless design.",
                "Explore Collection", "/collections",
                bg_color="#f5f0eb", text_color="#44403c",
            ),
            _product_grid("Featured Furniture", 4, 8, "created_at"),
            {
                "type": "product-grid",
                "settings": {
                    "title": "Room Inspiration",
                    "columns": 3,
                    "productsPerPage": 6,
                    "sortBy": "created_at",
                    "showPrices": True,
                    "showBadges": False,
                    "collectionSlug": "new-arrivals",
                },
            },
            _testimonials(
                "What Our Customers Say",
                [
                    {"name": "Michael B.", "quote": "The quality of the furniture is exceptional. Our living room has been completely transformed.", "rating": 5},
                    {"name": "Anna S.", "quote": "Beautiful pieces that are both stylish and comfortable. Worth every penny.", "rating": 5},
                    {"name": "Chris L.", "quote": "The delivery team was professional and the furniture looks even better in person.", "rating": 5},
                ],
            ),
            _newsletter("Design Inspiration", "Get styling tips, new arrivals, and exclusive offers delivered to your inbox."),
        ],
    },
    {
        "title": "Collections",
        "slug": "collections",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Collections | {{store_name}}",
        "seo_description": "Browse our curated furniture collections for every room.",
        "sections": [
            _hero("Our Collections", "Curated pieces for every room.", min_height=350),
            _rich_text(
                "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;margin-top:40px'>"
                "<div style='text-align:center;padding:48px 24px;background:#f5f0eb;border-radius:12px'><h3>Living Room</h3><p>Sofas, chairs, tables, and shelving</p></div>"
                "<div style='text-align:center;padding:48px 24px;background:#f5f0eb;border-radius:12px'><h3>Bedroom</h3><p>Beds, nightstands, dressers, and mirrors</p></div>"
                "<div style='text-align:center;padding:48px 24px;background:#f5f0eb;border-radius:12px'><h3>Dining</h3><p>Tables, chairs, and sideboards</p></div>"
                "<div style='text-align:center;padding:48px 24px;background:#f5f0eb;border-radius:12px'><h3>Office</h3><p>Desks, chairs, and storage</p></div>"
                "</div>"
            ),
        ],
    },
    {
        "title": "Products",
        "slug": "products",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Products | {{store_name}}",
        "seo_description": "Browse all furniture and home decor products.",
        "sections": [_product_grid("All Products", 3, 12, "-created_at")],
    },
    {
        "title": "Inspiration",
        "slug": "inspiration",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Inspiration | {{store_name}}",
        "seo_description": "Get inspired for your next home makeover.",
        "sections": [
            {"type": "hero", "settings": {"title": "Style Inspiration", "subtitle": "Ideas and tips to transform your space.", "buttonText": "", "buttonLink": "", "backgroundImage": "", "overlayOpacity": 0.3, "alignment": "center", "textColor": "#ffffff", "minHeight": 350}},
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>How to Style a Minimalist Living Room</h2>"
                "<p>Less is more. Choose a neutral palette, invest in one statement piece, and let natural light do the rest. "
                "A streamlined sofa paired with a simple coffee table creates an inviting yet uncluttered space.</p>"
                "<h2>Creating a Cozy Bedroom</h2>"
                "<p>Layer textures — a plush rug, linen bedding, and a chunky throw. "
                "Warm lighting and natural wood tones add warmth without visual noise.</p>"
                "</div>"
            ),
            _testimonials(
                "Design Tips from Our Team",
                [
                    {"name": "Interior Design Team", "quote": "Every room should have a focal point. Build your design around it and let everything else support that statement.", "rating": 5},
                ],
            ),
        ],
    },
    {
        "title": "About",
        "slug": "about",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "About {{store_name}}",
        "seo_description": "Our story of crafting beautiful, functional furniture.",
        "sections": [
            _hero("Our Story", "Crafting furniture that feels like home.", min_height=400),
            _rich_text(
                "<div style='max-width:700px;margin:0 auto'>"
                "<h2>Designed for Living</h2>"
                "<p>We believe furniture should be both beautiful and functional. Every piece in our collection "
                "is designed to enhance your daily life — from the coffee table that holds your morning cup "
                "to the sofa where you unwind at the end of the day.</p>"
                "<h2>Quality Materials</h2>"
                "<p>We use sustainably sourced hardwoods, premium fabrics, and expert craftsmanship. "
                "Each piece is built to last for years, not seasons.</p>"
                "<h2>Sustainability</h2>"
                "<p>We're committed to responsible manufacturing. Our workshops use renewable energy, "
                "and we plant a tree for every order placed.</p>"
                "</div>"
            ),
        ],
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Contact {{store_name}}",
        "seo_description": "Visit our showroom or get in touch with our design team.",
        "sections": [
            _hero("Visit Our Showroom", "See, touch, and experience our furniture.", min_height=300),
            _rich_text(
                "<div style='max-width:600px;margin:0 auto'>"
                "<h2>Showroom</h2>"
                "<p>789 Design Boulevard<br>Arts District<br>Los Angeles, CA 90013</p>"
                "<h2>Hours</h2>"
                "<p><strong>Monday — Saturday:</strong> 10:00 AM — 7:00 PM</p>"
                "<p><strong>Sunday:</strong> 11:00 AM — 5:00 PM</p>"
                "<h2>Contact</h2>"
                "<p><strong>Phone:</strong> (555) 456-7890</p>"
                "<p><strong>Email:</strong> hello@furniturestore.com</p>"
                "</div>"
            ),
            _contact("Send Us a Message", "Send Message"),
        ],
    },
]

_FURNITURE_TEMPLATE = {
    "name": "Furniture & Home Decor",
    "slug": "furniture-home-decor",
    "description": "Luxury, spacious template for furniture stores, interior design, and home accessories. Warm neutrals with elegant typography.",
    "version": "1.0.0",
    "category": "furniture",
    "author": "Tujjar",
    "thumbnail": "",
    "preview_images": [],
    "tags": ["furniture", "home", "decor", "luxury", "interior", "design"],
    "config": {
        "colors": {
            "primary": "#44403c",
            "secondary": "#a8a29e",
            "accent": "#b45309",
            "background": "#ffffff",
            "surface": "#f5f0eb",
            "text": "#1c1917",
            "textSecondary": "#78716c",
            "border": "#e7e5e4",
            "error": "#dc2626",
            "success": "#16a34a",
            "warning": "#d97706",
        },
        "typography": {
            "headingFont": "Playfair Display",
            "bodyFont": "Montserrat",
            "baseFontSize": 16,
            "scale": 1.3,
            "lineHeight": 1.7,
        },
        "spacing": {
            "sectionPaddingY": 96,
            "sectionPaddingX": 24,
            "containerMaxWidth": 1200,
            "gridGap": 32,
        },
        "borderRadius": {"small": 4, "medium": 8, "large": 12, "full": 9999},
        "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
        "darkMode": {"enabled": False, "default": False, "toggle": False},
    },
    "presets": [
        {"name": "Warm Neutral", "config": {}},
        {"name": "Modern Gray", "config": {"colors": {"primary": "#374151", "accent": "#2563eb", "surface": "#f3f4f6"}}},
        {"name": "Earthy", "config": {"colors": {"primary": "#78350f", "accent": "#b45309", "surface": "#fef3c7"}}},
    ],
    "pages": _FURNITURE_PAGES,
    "navigation": _nav(
        [
            {"label": "Home", "url": "/", "order": 0},
            {"label": "Collections", "url": "/collections", "order": 1},
            {"label": "Products", "url": "/products", "order": 2},
            {"label": "Inspiration", "url": "/inspiration", "order": 3},
            {"label": "About", "url": "/about", "order": 4},
            {"label": "Contact", "url": "/contact", "order": 5},
        ],
        cta_label="Sale", cta_url="/shop?sale=true",
    ),
    "footer": _footer(
        [
            {"title": "Collections", "links": [{"label": "Living Room", "url": "/collections"}, {"label": "Bedroom", "url": "/collections"}, {"label": "Dining", "url": "/collections"}, {"label": "Office", "url": "/collections"}]},
            {"title": "Help", "links": [{"label": "Shipping & Delivery", "url": "/contact"}, {"label": "Returns & Exchanges", "url": "/contact"}, {"label": "Care Instructions", "url": "/contact"}]},
            {"title": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Inspiration", "url": "/inspiration"}, {"label": "Contact", "url": "/contact"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Beautifully crafted furniture.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Fresh additions to our collection"},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most loved pieces"},
            {"name": "Sale", "slug": "sale", "description": "Great value on quality furniture"},
        ],
        "categories": [
            {"name": "Living Room", "slug": "living-room"},
            {"name": "Bedroom", "slug": "bedroom"},
            {"name": "Dining", "slug": "dining"},
            {"name": "Office", "slug": "office"},
            {"name": "Outdoor", "slug": "outdoor"},
        ],
    },
    "store_settings": {"description": "Beautifully crafted furniture for modern living."},
}


# ─── EXPORT ALL TEMPLATES ────────────────────────────────────────────────────

TEMPLATES_DATA = [
    _FASHION_TEMPLATE,
    _ELECTRONICS_TEMPLATE,
    _RESTAURANT_TEMPLATE,
    _PHARMACY_TEMPLATE,
    _FURNITURE_TEMPLATE,
]
