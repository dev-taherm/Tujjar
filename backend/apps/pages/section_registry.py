"""Section type registry. Defines all available section types for the page builder."""

SECTION_TYPES = {
    "hero": {
        "type": "hero",
        "label": "Hero Banner",
        "category": "hero",
        "icon": "LayoutTemplate",
        "defaultSettings": {
            "title": "Welcome to Our Store",
            "subtitle": "Discover amazing products",
            "buttonText": "Shop Now",
            "buttonLink": "/products",
            "backgroundImage": "",
            "overlayOpacity": 0.4,
            "alignment": "center",
            "textColor": "#ffffff",
            "minHeight": 500,
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text", "required": True},
            {"key": "subtitle", "label": "Subtitle", "type": "text"},
            {"key": "buttonText", "label": "Button Text", "type": "text"},
            {"key": "buttonLink", "label": "Button Link", "type": "text"},
            {"key": "backgroundImage", "label": "Background Image", "type": "image"},
            {"key": "overlayOpacity", "label": "Overlay Opacity", "type": "number"},
            {"key": "alignment", "label": "Alignment", "type": "select", "options": [
                {"value": "left", "label": "Left"},
                {"value": "center", "label": "Center"},
                {"value": "right", "label": "Right"},
            ]},
            {"key": "textColor", "label": "Text Color", "type": "color"},
            {"key": "minHeight", "label": "Min Height (px)", "type": "number"},
        ],
    },
    "product-grid": {
        "type": "product-grid",
        "label": "Product Grid",
        "category": "products",
        "icon": "LayoutGrid",
        "defaultSettings": {
            "title": "Featured Products",
            "columns": 4,
            "productsPerPage": 8,
            "sortBy": "created_at",
            "showPrices": True,
            "showBadges": True,
            "collectionSlug": "",
        },
        "settingsSchema": [
            {"key": "title", "label": "Section Title", "type": "text"},
            {"key": "columns", "label": "Columns", "type": "select", "options": [
                {"value": "2", "label": "2 Columns"},
                {"value": "3", "label": "3 Columns"},
                {"value": "4", "label": "4 Columns"},
            ]},
            {"key": "productsPerPage", "label": "Products Per Page", "type": "number"},
            {"key": "sortBy", "label": "Sort By", "type": "select", "options": [
                {"value": "created_at", "label": "Newest"},
                {"value": "price", "label": "Price"},
                {"value": "title", "label": "Name"},
            ]},
            {"key": "showPrices", "label": "Show Prices", "type": "toggle"},
            {"key": "showBadges", "label": "Show Badges", "type": "toggle"},
            {"key": "collectionSlug", "label": "Collection Slug", "type": "text"},
        ],
    },
    "gallery": {
        "type": "gallery",
        "label": "Image Gallery",
        "category": "content",
        "icon": "Images",
        "defaultSettings": {
            "title": "Gallery",
            "images": [],
            "columns": 3,
            "aspectRatio": "1/1",
            "lightbox": True,
        },
        "settingsSchema": [
            {"key": "title", "label": "Section Title", "type": "text"},
            {"key": "images", "label": "Images", "type": "repeater"},
            {"key": "columns", "label": "Columns", "type": "select", "options": [
                {"value": "2", "label": "2 Columns"},
                {"value": "3", "label": "3 Columns"},
                {"value": "4", "label": "4 Columns"},
            ]},
            {"key": "aspectRatio", "label": "Aspect Ratio", "type": "select", "options": [
                {"value": "1/1", "label": "Square"},
                {"value": "4/3", "label": "Landscape"},
                {"value": "3/4", "label": "Portrait"},
                {"value": "16/9", "label": "Wide"},
            ]},
            {"key": "lightbox", "label": "Enable Lightbox", "type": "toggle"},
        ],
    },
    "testimonials": {
        "type": "testimonials",
        "label": "Testimonials",
        "category": "social",
        "icon": "Quote",
        "defaultSettings": {
            "title": "What Our Customers Say",
            "testimonials": [
                {"name": "John Doe", "quote": "Great products and fast shipping!", "rating": 5},
                {"name": "Jane Smith", "quote": "Best shopping experience ever.", "rating": 5},
            ],
            "layout": "carousel",
        },
        "settingsSchema": [
            {"key": "title", "label": "Section Title", "type": "text"},
            {"key": "testimonials", "label": "Testimonials", "type": "repeater"},
            {"key": "layout", "label": "Layout", "type": "select", "options": [
                {"value": "carousel", "label": "Carousel"},
                {"value": "grid", "label": "Grid"},
            ]},
        ],
    },
    "faq": {
        "type": "faq",
        "label": "FAQ",
        "category": "content",
        "icon": "HelpCircle",
        "defaultSettings": {
            "title": "Frequently Asked Questions",
            "items": [
                {"question": "What is your return policy?", "answer": "We offer a 30-day return policy."},
                {"question": "How long does shipping take?", "answer": "Shipping typically takes 3-5 business days."},
            ],
        },
        "settingsSchema": [
            {"key": "title", "label": "Section Title", "type": "text"},
            {"key": "items", "label": "FAQ Items", "type": "repeater"},
        ],
    },
    "pricing": {
        "type": "pricing",
        "label": "Pricing",
        "category": "content",
        "icon": "CreditCard",
        "defaultSettings": {
            "title": "Pricing Plans",
            "plans": [
                {"name": "Basic", "price": "9.99", "period": "month", "features": ["Feature 1", "Feature 2"], "highlighted": False},
                {"name": "Pro", "price": "29.99", "period": "month", "features": ["Feature 1", "Feature 2", "Feature 3"], "highlighted": True},
            ],
            "columns": 2,
        },
        "settingsSchema": [
            {"key": "title", "label": "Section Title", "type": "text"},
            {"key": "plans", "label": "Plans", "type": "repeater"},
            {"key": "columns", "label": "Columns", "type": "select", "options": [
                {"value": "2", "label": "2 Columns"},
                {"value": "3", "label": "3 Columns"},
            ]},
        ],
    },
    "banner": {
        "type": "banner",
        "label": "Banner",
        "category": "content",
        "icon": "Megaphone",
        "defaultSettings": {
            "title": "Special Offer",
            "subtitle": "Limited time only",
            "backgroundImage": "",
            "buttonText": "Shop Now",
            "buttonLink": "/products",
            "textColor": "#ffffff",
            "backgroundColor": "#2563eb",
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text"},
            {"key": "subtitle", "label": "Subtitle", "type": "text"},
            {"key": "backgroundImage", "label": "Background Image", "type": "image"},
            {"key": "buttonText", "label": "Button Text", "type": "text"},
            {"key": "buttonLink", "label": "Button Link", "type": "text"},
            {"key": "textColor", "label": "Text Color", "type": "color"},
            {"key": "backgroundColor", "label": "Background Color", "type": "color"},
        ],
    },
    "newsletter": {
        "type": "newsletter",
        "label": "Newsletter",
        "category": "content",
        "icon": "Mail",
        "defaultSettings": {
            "title": "Subscribe to Our Newsletter",
            "subtitle": "Stay updated with the latest products and offers",
            "placeholder": "Enter your email",
            "buttonText": "Subscribe",
            "privacyText": "We respect your privacy. Unsubscribe at any time.",
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text"},
            {"key": "subtitle", "label": "Subtitle", "type": "text"},
            {"key": "placeholder", "label": "Input Placeholder", "type": "text"},
            {"key": "buttonText", "label": "Button Text", "type": "text"},
            {"key": "privacyText", "label": "Privacy Text", "type": "text"},
        ],
    },
    "contact": {
        "type": "contact",
        "label": "Contact Form",
        "category": "content",
        "icon": "MessageSquare",
        "defaultSettings": {
            "title": "Contact Us",
            "fields": ["name", "email", "subject", "message"],
            "submitText": "Send Message",
            "successMessage": "Thank you! We'll get back to you soon.",
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text"},
            {"key": "fields", "label": "Form Fields", "type": "repeater"},
            {"key": "submitText", "label": "Submit Button Text", "type": "text"},
            {"key": "successMessage", "label": "Success Message", "type": "text"},
        ],
    },
    "video": {
        "type": "video",
        "label": "Video",
        "category": "content",
        "icon": "Play",
        "defaultSettings": {
            "title": "",
            "videoUrl": "",
            "autoplay": False,
            "coverImage": "",
            "aspectRatio": "16/9",
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text"},
            {"key": "videoUrl", "label": "Video URL", "type": "text"},
            {"key": "autoplay", "label": "Autoplay", "type": "toggle"},
            {"key": "coverImage", "label": "Cover Image", "type": "image"},
            {"key": "aspectRatio", "label": "Aspect Ratio", "type": "select", "options": [
                {"value": "16/9", "label": "16:9"},
                {"value": "4/3", "label": "4:3"},
                {"value": "1/1", "label": "1:1"},
            ]},
        ],
    },
    "rich-text": {
        "type": "rich-text",
        "label": "Rich Text",
        "category": "content",
        "icon": "Type",
        "defaultSettings": {
            "htmlContent": "<h2>About Us</h2><p>We are a leading ecommerce platform.</p>",
            "maxWidth": 800,
            "alignment": "left",
        },
        "settingsSchema": [
            {"key": "htmlContent", "label": "HTML Content", "type": "textarea"},
            {"key": "maxWidth", "label": "Max Width (px)", "type": "number"},
            {"key": "alignment", "label": "Alignment", "type": "select", "options": [
                {"value": "left", "label": "Left"},
                {"value": "center", "label": "Center"},
                {"value": "right", "label": "Right"},
            ]},
        ],
    },
    "image": {
        "type": "image",
        "label": "Single Image",
        "category": "content",
        "icon": "ImageIcon",
        "defaultSettings": {
            "image": "",
            "altText": "",
            "caption": "",
            "maxWidth": 100,
            "alignment": "center",
        },
        "settingsSchema": [
            {"key": "image", "label": "Image", "type": "image", "required": True},
            {"key": "altText", "label": "Alt Text", "type": "text"},
            {"key": "caption", "label": "Caption", "type": "text"},
            {"key": "maxWidth", "label": "Max Width (%)", "type": "number"},
            {"key": "alignment", "label": "Alignment", "type": "select", "options": [
                {"value": "left", "label": "Left"},
                {"value": "center", "label": "Center"},
                {"value": "right", "label": "Right"},
            ]},
        ],
    },
    "countdown": {
        "type": "countdown",
        "label": "Countdown Timer",
        "category": "content",
        "icon": "Timer",
        "defaultSettings": {
            "title": "Sale Ends In",
            "targetDate": "",
            "showDays": True,
            "showHours": True,
            "showMinutes": True,
            "showSeconds": True,
        },
        "settingsSchema": [
            {"key": "title", "label": "Title", "type": "text"},
            {"key": "targetDate", "label": "Target Date", "type": "text"},
            {"key": "showDays", "label": "Show Days", "type": "toggle"},
            {"key": "showHours", "label": "Show Hours", "type": "toggle"},
            {"key": "showMinutes", "label": "Show Minutes", "type": "toggle"},
            {"key": "showSeconds", "label": "Show Seconds", "type": "toggle"},
        ],
    },
    "custom-html": {
        "type": "custom-html",
        "label": "Custom HTML",
        "category": "content",
        "icon": "Code",
        "defaultSettings": {
            "htmlContent": "<div>Custom HTML content</div>",
        },
        "settingsSchema": [
            {"key": "htmlContent", "label": "HTML Content", "type": "textarea"},
        ],
    },
    "carousel": {
        "type": "carousel",
        "label": "Carousel",
        "category": "content",
        "icon": "GalleryHorizontalEnd",
        "defaultSettings": {
            "slides": [
                {"image": "", "title": "Slide 1", "subtitle": "", "buttonText": "", "buttonLink": ""},
            ],
            "autoplay": True,
            "interval": 5000,
        },
        "settingsSchema": [
            {"key": "slides", "label": "Slides", "type": "repeater"},
            {"key": "autoplay", "label": "Autoplay", "type": "toggle"},
            {"key": "interval", "label": "Interval (ms)", "type": "number"},
        ],
    },
    "footer": {
        "type": "footer",
        "label": "Footer",
        "category": "layout",
        "icon": "PanelBottom",
        "defaultSettings": {
            "columns": [
                {"title": "Shop", "links": [{"label": "All Products", "url": "/products"}, {"label": "New Arrivals", "url": "/new"}]},
                {"title": "Help", "links": [{"label": "FAQ", "url": "/faq"}, {"label": "Contact", "url": "/contact"}]},
            ],
            "copyright": "2024 Your Store. All rights reserved.",
            "socialLinks": {"facebook": "", "twitter": "", "instagram": ""},
        },
        "settingsSchema": [
            {"key": "columns", "label": "Footer Columns", "type": "repeater"},
            {"key": "copyright", "label": "Copyright Text", "type": "text"},
            {"key": "socialLinks", "label": "Social Links", "type": "repeater"},
        ],
    },
}


def get_section_types() -> list[dict]:
    """Return all section type definitions."""
    return list(SECTION_TYPES.values())


def get_section_type(section_type: str) -> dict | None:
    """Get a specific section type definition."""
    return SECTION_TYPES.get(section_type)


def create_section(section_type: str) -> dict | None:
    """Create a new section instance from a type definition."""
    import uuid

    definition = SECTION_TYPES.get(section_type)
    if not definition:
        return None
    return {
        "id": str(uuid.uuid4()),
        "type": section_type,
        "settings": dict(definition["defaultSettings"]),
        "visibility": {"desktop": True, "tablet": True, "mobile": True},
        "className": "",
        "customCSS": "",
    }
