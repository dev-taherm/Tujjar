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


def _product_grid(title={"en": "Featured Products", "ar": "المنتجات المميزة"}, columns=4, per_page=8, sort="created_at", collection=""):
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


def _testimonials(title={"en": "What Our Customers Say", "ar": "ماذا يقول عملاؤنا"}, items=None, layout="carousel"):
    if items is None:
        items = [
            {"name": {"en": "Sarah M.", "ar": "سارة م."}, "quote": {"en": "Absolutely love the quality! Will definitely shop here again.", "ar": "أحب الجودة بالتأكيد! سأتسوق هنا مجدداً بالتأكيد."}, "rating": 5},
            {"name": {"en": "James L.", "ar": "جيمس ل."}, "quote": {"en": "Fast shipping and the product exceeded my expectations.", "ar": "شحن سريع والمنتج تجاوز توقعاتي."}, "rating": 5},
            {"name": {"en": "Emily R.", "ar": "إيميلي ر."}, "quote": {"en": "Customer service was outstanding. Highly recommend!", "ar": "خدمة العملاء ممتازة. أنصح بشدة!"}, "rating": 4},
        ]
    return {
        "type": "testimonials",
        "settings": {
            "title": title,
            "testimonials": items,
            "layout": layout,
        },
    }


def _newsletter(title={"en": "Stay in the Loop", "ar": "تابع آخر الأخبار"}, subtitle={"en": "Subscribe for exclusive offers and updates.", "ar": "اشترك للحصول على عروض حصرية وتحديثات."}, placeholder={"en": "Enter your email", "ar": "أدخل بريدك الإلكتروني"}, button_text={"en": "Subscribe", "ar": "اشترك"}):
    return {
        "type": "newsletter",
        "settings": {
            "title": title,
            "subtitle": subtitle,
            "placeholder": placeholder,
            "buttonText": button_text,
            "privacyText": {"en": "We respect your privacy. Unsubscribe at any time.", "ar": "نحترم خصوصيتك. يمكنك إلغاء الاشتراك في أي وقت."},
        },
    }


def _faq(title={"en": "Frequently Asked Questions", "ar": "الأسئلة الشائعة"}, items=None):
    if items is None:
        items = [
            {"question": {"en": "What are your shipping options?", "ar": "ما خيارات الشحن المتاحة؟"}, "answer": {"en": "We offer free standard shipping on orders over $50. Express shipping is available for an additional fee.", "ar": "نقدم شحنًا مجانيًا قياسيًا للطلبات التي تزيد عن 50 دولار. الشحن السريع متاح مقابل رسوم إضافية."}},
            {"question": {"en": "How do I return an item?", "ar": "كيف أُرجع منتجًا؟"}, "answer": {"en": "You can return any item within 30 days of purchase for a full refund.", "ar": "يمكنك إرجاع أي منتج خلال 30 يومًا من الشراء للحصول على استرداد كامل."}},
            {"question": {"en": "Do you ship internationally?", "ar": "هل تشحنون دوليًا؟"}, "answer": {"en": "Yes! We ship to over 50 countries worldwide.", "ar": "نعم! نشحن إلى أكثر من 50 دولة حول العالم."}},
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


def _gallery(title={"en": "Gallery", "ar": "المعرض"}, images=None, columns=3):
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


def _contact(title={"en": "Get in Touch", "ar": "تواصل معنا"}, submit_text={"en": "Send Message", "ar": "إرسال الرسالة"}, success_message={"en": "Thank you! We'll get back to you within 24 hours.", "ar": "شكراً! سنرد عليك خلال 24 ساعة."}):
    return {
        "type": "contact",
        "settings": {
            "title": title,
            "fields": [
                {"name": "name", "label": {"en": "Full Name", "ar": "الاسم الكامل"}, "type": "text", "required": True},
                {"name": "email", "label": {"en": "Email", "ar": "البريد الإلكتروني"}, "type": "email", "required": True},
                {"name": "phone", "label": {"en": "Phone", "ar": "الهاتف"}, "type": "tel", "required": False},
                {"name": "message", "label": {"en": "Message", "ar": "الرسالة"}, "type": "textarea", "required": True},
            ],
            "submitText": submit_text,
            "successMessage": success_message,
        },
    }


def _countdown(title={"en": "Hurry! Sale Ends Soon", "ar": "أسرع! التخفيضات تنتهي قريباً"}, target_date="2026-12-31T23:59:59"):
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
            {"image": "", "title": {"en": "Welcome", "ar": "مرحباً"}, "subtitle": {"en": "Discover our latest collection", "ar": "اكتشف مجموعتنا الأخيرة"}, "buttonText": {"en": "Shop Now", "ar": "تسوّق الآن"}, "buttonLink": "/shop"},
        ]
    return {
        "type": "carousel",
        "settings": {
            "slides": slides,
            "autoplay": autoplay,
            "interval": interval,
        },
    }


def _footer(columns=None, copyright_text={"en": "© All rights reserved.", "ar": "© جميع الحقوق محفوظة."}, social=None):
    if columns is None:
        columns = [
            {"title": {"en": "Shop", "ar": "المتجر"}, "links": [{"label": {"en": "New Arrivals", "ar": "وصل حديثاً"}, "url": "/shop?sort=new"}, {"label": {"en": "Best Sellers", "ar": "الأكثر مبيعاً"}, "url": "/shop?sort=popular"}, {"label": {"en": "Sale", "ar": "التخفيضات"}, "url": "/shop?sale=true"}]},
            {"title": {"en": "Help", "ar": "المساعدة"}, "links": [{"label": {"en": "FAQ", "ar": "الأسئلة الشائعة"}, "url": "/faq"}, {"label": {"en": "Shipping", "ar": "الشحن"}, "url": "/shipping"}, {"label": {"en": "Returns", "ar": "الإرجاع"}, "url": "/returns"}]},
            {"title": {"en": "Company", "ar": "الشركة"}, "links": [{"label": {"en": "About Us", "ar": "من نحن"}, "url": "/about"}, {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact"}, {"label": {"en": "Careers", "ar": "الوظائف"}, "url": "/careers"}]},
        ]
    if social is None:
        social = {"instagram": "#", "facebook": "#", "twitter": "#"}
    return {
        "columns": columns,
        "copyright": copyright_text,
        "social_links": social,
    }


def _nav(links=None, cta_label="", cta_url="#"):
    if links is None:
        links = [
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "Shop", "ar": "المتجر"}, "url": "/shop", "order": 1},
            {"label": {"en": "About", "ar": "من نحن"}, "url": "/about", "order": 2},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 3},
        ]
    result = {"logo_text": {"en": "", "ar": ""}, "links": links}
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
                {"en": "New Season Collection", "ar": "مجموعة الموسم الجديد"},
                {"en": "Discover timeless elegance redefined for the modern wardrobe.", "ar": "اكتشف الأناقة الخالدة المُعاد تعريفها للخزانة العصرية."},
                {"en": "Shop New Arrivals", "ar": "تسوّق الجديد"}, "/shop",
            ),
            _product_grid({"en": "Featured Products", "ar": "المنتجات المميزة"}, 4, 8, "created_at"),
            {
                "type": "product-grid",
                "settings": {
                    "title": {"en": "New Arrivals", "ar": "وصل حديثاً"},
                    "columns": 4,
                    "productsPerPage": 4,
                    "sortBy": "-created_at",
                    "showPrices": True,
                    "showBadges": True,
                    "collectionSlug": "new-arrivals",
                },
            },
            _banner(
                {"en": "Summer Sale — Up to 50% Off", "ar": "تخفيضات الصيف — حتى 50% خصم"},
                {"en": "Don't miss our biggest sale of the season. Styles that sell out fast.", "ar": "لا تفوت أكبر تخفيضات الموسم. أنياق تُباع بسرعة."},
                {"en": "Shop the Sale", "ar": "تسوّق التخفيضات"}, "/shop?sale=true",
            ),
            _product_grid({"en": "Best Sellers", "ar": "الأكثر مبيعاً"}, 4, 4, "-total_sold"),
            _testimonials(
                {"en": "What Our Customers Say", "ar": "ماذا يقول عملاؤنا"},
                [
                    {"name": {"en": "Olivia P.", "ar": "أوليفيا ب."}, "quote": {"en": "The quality of these pieces is unmatched. I get compliments every time I wear them.", "ar": "جودة هذه القطع لا مثيل لها. أتلقى الإشادات في كل مرة أرتديها."}, "rating": 5},
                    {"name": {"en": "Emma S.", "ar": "إيما س."}, "quote": {"en": "Beautiful packaging, fast delivery, and the clothes fit perfectly. 10/10!", "ar": "تغليف جميل، توصيل سريع، والملابس تناسب بشكل مثالي. 10/10!"}, "rating": 5},
                    {"name": {"en": "Sophia L.", "ar": "صوفيا ل."}, "quote": {"en": "This is my go-to store now. The curation is impeccable.", "ar": "هذا متجري المفضل الآن. التنسيق لا تشوبه شائبة."}, "rating": 5},
                ],
            ),
            _newsletter({"en": "Join the Inner Circle", "ar": "انضم للدائرة المميزة"}, {"en": "Be the first to know about new drops, exclusive sales, and styling tips.", "ar": "كن أول من يعرف عن الإصدارات الجديدة والتخفيضات الحصرية ونصائح التنسيق."}),
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
            _hero({"en": "Our Story", "ar": "قصتنا"}, {"en": "Fashion that speaks to who you are.", "ar": "أزياء تعبر عن هويتك."}, alignment="center", min_height=400),
            _rich_text(
                "<h2>Founded on Passion</h2>"
                "<p>We started with a simple belief: everyone deserves to feel confident in what they wear. "
                "Every piece in our collection is carefully selected for quality, comfort, and timeless style.</p>"
                "<p>From everyday essentials to statement pieces, we curate fashion that empowers you to express "
                "your unique identity. We partner with ethical manufacturers who share our commitment to "
                "sustainability and fair labor practices.</p>"
            ),
            _testimonials(
                {"en": "Customer Love", "ar": "حب العملاء"},
                [
                    {"name": {"en": "Hannah K.", "ar": "هانا ك."}, "quote": {"en": "I love that this brand cares about sustainability. The quality shows.", "ar": "أحب أن هذا العلامة التجارية تهتم بالاستدامة. الجودة واضحة."}, "rating": 5},
                    {"name": {"en": "Grace M.", "ar": "غريس م."}, "quote": {"en": "Finally a brand that combines style with ethics. My favorite store!", "ar": "أخيراً علامة تجارية تجمع بين الأناقة والأخلاق. متجري المفضل!"}, "rating": 5},
                ],
            ),
            _newsletter({"en": "Stay Connected", "ar": "تابعنا"}, {"en": "Follow our journey and get exclusive offers.", "ar": "تابع رحلتنا واحصل على عروض حصرية."}),
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
            _hero({"en": "Get in Touch", "ar": "تواصل معنا"}, {"en": "We're here to help with any questions.", "ar": "نحن هنا للإجابة على استفساراتك."}, min_height=350),
            _contact({"en": "Send Us a Message", "ar": "أرسل لنا رسالة"}, {"en": "Send Message", "ar": "إرسال الرسالة"}),
            _faq({"en": "Frequently Asked Questions", "ar": "الأسئلة الشائعة"}, [
                {"question": {"en": "What are your shipping options?", "ar": "ما خيارات الشحن المتاحة؟"}, "answer": {"en": "We offer free standard shipping on orders over $50. Express and overnight options are available at checkout.", "ar": "نقدم شحنًا مجانيًا قياسيًا للطلبات التي تزيد عن 50 دولار. خيارات الشحن السريع متاحة عند الدفع."}},
                {"question": {"en": "How do I track my order?", "ar": "كيف أتتبع طلبي؟"}, "answer": {"en": "Once your order ships, you'll receive an email with a tracking number. You can also check your account dashboard.", "ar": "بمجرد شحن طلبك، ستتلقى بريدًا إلكترونيًا يحتوي على رقم التتبع. يمكنك أيضًا التحقق من لوحة حسابك."}},
                {"question": {"en": "What is your return policy?", "ar": "ما سياسة الإرجاع؟"}, "answer": {"en": "We accept returns within 30 days of delivery. Items must be unworn with tags attached.", "ar": "نقبل الإرجاعات خلال 30 يومًا من التوصيل. يجب أن تكون المنتجات غير ملابسة مع إرفاق العلامات."}},
                {"question": {"en": "Do you offer international shipping?", "ar": "هل تشحنون دوليًا؟"}, "answer": {"en": "Yes! We ship to over 40 countries. International shipping rates are calculated at checkout.", "ar": "نعم! نشحن إلى أكثر من 40 دولة. يتم حساب أسعار الشحن الدولي عند الدفع."}},
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
            _product_grid({"en": "All Products", "ar": "جميع المنتجات"}, 3, 12, "-created_at"),
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
            _hero({"en": "Frequently Asked Questions", "ar": "الأسئلة الشائعة"}, {"en": "Find answers to common questions.", "ar": "اكتشف إجابات الأسئلة الشائعة."}, min_height=300),
            _faq({"en": "Common Questions", "ar": "أسئلة شائعة"}, [
                {"question": {"en": "How long does shipping take?", "ar": "كم يستغرق الشحن؟"}, "answer": {"en": "Standard shipping takes 3-7 business days. Express shipping delivers within 1-3 business days.", "ar": "يستغرق الشحن القياسي 3-7 أيام عمل. الشحن السريع يصل خلال 1-3 أيام عمل."}},
                {"question": {"en": "Can I change or cancel my order?", "ar": "هل يمكنني تغيير أو إلغاء طلبي؟"}, "answer": {"en": "You can modify or cancel your order within 2 hours of placing it. Contact our support team for assistance.", "ar": "يمكنك تعديل أو إلغاء طلبك خلال ساعتين من تقديمه. تواصل مع فريق الدعم للمساعدة."}},
                {"question": {"en": "Do you offer size guides?", "ar": "هل تقدمون دليل مقاسات؟"}, "answer": {"en": "Yes! Each product page includes a detailed size guide. If you're between sizes, we recommend sizing up.", "ar": "نعم! كل صفحة منتج تتضمن دليل مقاسات مفصلًا. إذا كنت بين مقاسين، نوصي بالمقاس الأكبر."}},
                {"question": {"en": "Are your products sustainable?", "ar": "هل منتجاتكم مستدامة؟"}, "answer": {"en": "We prioritize sustainability by partnering with ethical manufacturers and using eco-friendly materials whenever possible.", "ar": "نعطي الأولوية للاستدامة من خلال الشراكة مع المصنعين الأخلاقيين واستخدام المواد الصديقة للبيئة."}},
                {"question": {"en": "How do I use a promo code?", "ar": "كيف أستخدم كود الخصم؟"}, "answer": {"en": "Enter your promo code at checkout in the discount field. Only one code can be used per order.", "ar": "أدخل كود الخصم عند الدفع في حقل الخصم. يمكن استخدام كود واحد فقط لكل طلب."}},
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
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "New In", "ar": "الجديد"}, "url": "/shop?sort=new", "order": 1},
            {"label": {"en": "Shop", "ar": "المتجر"}, "url": "/shop", "order": 2},
            {"label": {"en": "About", "ar": "من نحن"}, "url": "/about", "order": 3},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 4},
        ],
        cta_label={"en": "Sale", "ar": "تخفيضات"}, cta_url="/shop?sale=true",
    ),
    "footer": _footer(
        [
            {"title": {"en": "Shop", "ar": "المتجر"}, "links": [{"label": {"en": "New Arrivals", "ar": "وصل حديثاً"}, "url": "/shop?sort=new"}, {"label": {"en": "Best Sellers", "ar": "الأكثر مبيعاً"}, "url": "/shop?sort=popular"}, {"label": {"en": "Sale", "ar": "التخفيضات"}, "url": "/shop?sale=true"}]},
            {"title": {"en": "Help", "ar": "المساعدة"}, "links": [{"label": {"en": "FAQ", "ar": "الأسئلة الشائعة"}, "url": "/faq"}, {"label": {"en": "Shipping & Returns", "ar": "الشحن والإرجاع"}, "url": "/faq"}, {"label": {"en": "Size Guide", "ar": "دليل المقاسات"}, "url": "/faq"}]},
            {"title": {"en": "Company", "ar": "الشركة"}, "links": [{"label": {"en": "About Us", "ar": "من نحن"}, "url": "/about"}, {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact"}, {"label": {"en": "Privacy Policy", "ar": "سياسة الخصوصية"}, "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "Discover {{page_title}} at {{store_name}}. Quality fashion with free shipping on orders over $50.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "The latest additions to our curated collection", "translations": {"ar": {"name": "وصل حديثاً", "description": "أحدث الإضافات إلى مجموعتنا المختارة"}}},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular picks this season", "translations": {"ar": {"name": "الأكثر مبيعاً", "description": "اختياراتنا الأكثر شعبية هذا الموسم"}}},
            {"name": "Sale", "slug": "sale", "description": "Incredible deals on select styles", "translations": {"ar": {"name": "التخفيضات", "description": "عروض لا تصدق على أنماط محددة"}}},
        ],
        "categories": [
            {"name": "Clothing", "slug": "clothing", "description": "Tops, bottoms, dresses, and outerwear", "translations": {"ar": {"name": "الملابس"}}},
            {"name": "Shoes", "slug": "shoes", "description": "Sneakers, heels, boots, and sandals", "translations": {"ar": {"name": "الأحذية"}}},
            {"name": "Accessories", "slug": "accessories", "description": "Bags, jewelry, scarves, and more", "translations": {"ar": {"name": "الإكسسوارات"}}},
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
                {"en": "Power Your World", "ar": "شحّن عالمك"},
                {"en": "Discover cutting-edge technology at unbeatable prices. Free shipping on orders over $100.", "ar": "اكتشف أحدث التقنيات بأسعار لا تُقاوم. شحن مجاني للطلبات فوق 100$."},
                {"en": "Shop Now", "ar": "تسوّق الآن"}, "/shop",
                bg="", text_color="#ffffff",
            ),
            {
                "type": "banner",
                "settings": {
                    "title": {"en": "Flash Sale — Up to 40% Off", "ar": "تخفيضات سريعة — حتى 40% خصم"},
                    "subtitle": {"en": "Limited time only. Don't miss these deals.", "ar": "لفترة محدودة فقط. لا تفوّت هذه العروض."},
                    "backgroundImage": "",
                    "buttonText": {"en": "Shop Deals", "ar": "تسوّق العروض"},
                    "buttonLink": "/shop?sale=true",
                    "textColor": "#ffffff",
                    "backgroundColor": "#1e40af",
                },
            },
            _countdown({"en": "Flash Sale Ends In", "ar": "التخفيضات تنتهي خلال"}, "2026-12-31T23:59:59"),
            {
                "type": "banner",
                "settings": {
                    "title": {"en": "Featured Categories", "ar": "الفئات المميزة"},
                    "subtitle": "",
                    "backgroundImage": "",
                    "buttonText": "",
                    "buttonLink": "",
                    "textColor": "#111827",
                    "backgroundColor": "#f3f4f6",
                },
            },
            _product_grid({"en": "Top Picks", "ar": "اختياراتنا"}, 4, 8, "-total_sold"),
            _faq({"en": "Tech Support", "ar": "الدعم الفني"}, [
                {"question": {"en": "Do you offer warranties?", "ar": "هل تقدمون ضمانات؟"}, "answer": {"en": "Yes! All products come with a minimum 1-year manufacturer warranty. Extended warranties are available at checkout.", "ar": "نعم! جميع المنتجات تأتي بضمان صانع لمدة سنة على الأقل. ضمانات ممتدة متاحة عند الدفع."}},
                {"question": {"en": "Can I track my order?", "ar": "هل يمكنني تتبع طلبي؟"}, "answer": {"en": "Absolutely. You'll receive tracking info via email once your order ships.", "ar": "بالتأكيد. ستتلقى معلومات التتبع عبر البريد الإلكتروني بمجرد شحن طلبك."}},
                {"question": {"en": "Do you price match?", "ar": "هل تطابقون الأسعار؟"}, "answer": {"en": "We strive to offer the best prices. If you find a lower price elsewhere, contact us and we'll do our best to match it.", "ar": "نسعى لتقديم أفضل الأسعار. إذا وجدت سعرًا أقل في مكان آخر، تواصل معنا وسنبذل قصارى جهدنا لمواءمته."}},
            ]),
            _newsletter({"en": "Stay Ahead of the Curve", "ar": "كن على اطلاع دائم"}, {"en": "Get notified about new product launches, exclusive deals, and tech news.", "ar": "احصل على إشعارات عن المنتجات الجديدة والعروض الحصرية والأخبار التقنية."}),
        ],
    },
    {
        "title": "Products",
        "slug": "products",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Products | {{store_name}}",
        "seo_description": "Browse our complete range of electronics, gadgets, and tech accessories.",
        "sections": [_product_grid({"en": "All Products", "ar": "جميع المنتجات"}, 3, 12, "-created_at")],
    },
    {
        "title": "Categories",
        "slug": "categories",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Categories | {{store_name}}",
        "seo_description": "Browse by category: phones, laptops, gaming, audio, and accessories.",
        "sections": [
            _hero({"en": "Shop by Category", "ar": "تسوّق حسب الفئة"}, {"en": "Find exactly what you need.", "ar": "جد ما تحتاجه بالضبط."}, min_height=300),
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
                {"en": "Today's Deals", "ar": "عروض اليوم"}, {"en": "Save big on top tech.", "ar": "وفّر كبير على أحدث التقنيات."}, bg="#1e40af", text_color="#ffffff", min_height=350,
            ),
            _countdown({"en": "Deals End In", "ar": "العروض تنتهي خلال"}),
            _product_grid({"en": "On Sale Now", "ar": "معروض للبيع الآن"}, 4, 8, "-created_at"),
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
            _hero({"en": "How Can We Help?", "ar": "كيف يمكننا مساعدتك؟"}, min_height=300),
            _faq({"en": "Common Questions", "ar": "أسئلة شائعة"}, [
                {"question": {"en": "My order hasn't arrived. What should I do?", "ar": "لم يصل طلبي. ماذا يجب أن أفعل؟"}, "answer": {"en": "Check your tracking link first. If it's been more than the estimated delivery date, contact our support team and we'll investigate immediately.", "ar": "تحقق من رابط التتبع أولاً. إذا مر أكثر من تاريخ التوصيل المتوقع، تواصل مع فريق الدعم وسنحقق فوراً."}},
                {"question": {"en": "How do I request a refund?", "ar": "كيف أطلب استرداد المبلغ؟"}, "answer": {"en": "Go to your account dashboard, find the order, and click 'Request Refund'. You can also email us with your order number.", "ar": "انتقل إلى لوحة حسابك، وجد الطلب، وانقر 'طلب استرداد'. يمكنك أيضًا مراسلتنا عبر البريد الإلكتروني مع رقم طلبك."}},
                {"question": {"en": "Can I change my delivery address?", "ar": "هل يمكنني تغيير عنوان التوصيل؟"}, "answer": {"en": "If your order hasn't shipped yet, contact us immediately and we can update the address.", "ar": "إذا لم يتم شحن طلبك بعد، تواصل معنا فوراً ويمكننا تحديث العنوان."}},
                {"question": {"en": "Do you offer bulk discounts?", "ar": "هل تقدمون خصومات بالجملة؟"}, "answer": {"en": "Yes! For orders of 5 or more identical items, contact our sales team for special pricing.", "ar": "نعم! للطلبات التي تحتوي على 5 منتجات متماثلة أو أكثر، تواصل مع فريق المبيعات للحصول على أسعار خاصة."}},
            ]),
            _contact({"en": "Still Need Help?", "ar": "تحتاج مساعدة إضافية؟"}, {"en": "Submit a Ticket", "ar": "أرسل تذكرة"}),
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
            _hero({"en": "Contact Us", "ar": "تواصل معنا"}, {"en": "Our team is ready to help.", "ar": "فريقنا جاهز للمساعدة."}, min_height=300),
            _contact({"en": "Send Us a Message", "ar": "أرسل لنا رسالة"}, {"en": "Submit", "ar": "إرسال"}),
            _faq({"en": "Quick Answers", "ar": "إجابات سريعة"}, [
                {"question": {"en": "What are your support hours?", "ar": "ما ساعات الدعم؟"}, "answer": {"en": "Our support team is available Monday through Friday, 9am-6pm EST.", "ar": "فريق الدعم متاح من الاثنين إلى الجمعة، 9 صباحاً - 6 مساءً."}},
                {"question": {"en": "Do you have a phone number?", "ar": "هل لديكم رقم هاتف؟"}, "answer": {"en": "You can reach us at 1-800-TECH-HELP during business hours.", "ar": "يمكنك التواصل معنا على 1-800-TECH-HELP خلال ساعات العمل."}},
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
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "Products", "ar": "المنتجات"}, "url": "/products", "order": 1},
            {"label": {"en": "Deals", "ar": "العروض"}, "url": "/deals", "order": 2},
            {"label": {"en": "Support", "ar": "الدعم"}, "url": "/support", "order": 3},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 4},
        ],
        cta_label={"en": "Deals", "ar": "العروض"}, cta_url="/deals",
    ),
    "footer": _footer(
        [
            {"title": {"en": "Products", "ar": "المنتجات"}, "links": [{"label": {"en": "Phones & Tablets", "ar": "الهواتف واللوحات"}, "url": "/categories"}, {"label": {"en": "Laptops & PCs", "ar": "الحواسيب المحمولة والمكتبية"}, "url": "/categories"}, {"label": {"en": "Gaming", "ar": "الألعاب"}, "url": "/categories"}, {"label": {"en": "Audio", "ar": "الصوتيات"}, "url": "/categories"}]},
            {"title": {"en": "Support", "ar": "الدعم"}, "links": [{"label": {"en": "Help Center", "ar": "مركز المساعدة"}, "url": "/support"}, {"label": {"en": "Warranty Info", "ar": "معلومات الضمان"}, "url": "/support"}, {"label": {"en": "Track Order", "ar": "تتبع الطلب"}, "url": "/support"}]},
            {"title": {"en": "Company", "ar": "الشركة"}, "links": [{"label": {"en": "About Us", "ar": "من نحن"}, "url": "/about"}, {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact"}, {"label": {"en": "Privacy Policy", "ar": "سياسة الخصوصية"}, "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{page_title}} at {{store_name}}. Free shipping on orders over $100.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Latest tech just landed", "translations": {"ar": {"name": "وصل حديثاً", "description": "أحدث التقنيات وصلت للتو"}}},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular products", "translations": {"ar": {"name": "الأكثر مبيعاً", "description": "منتجاتنا الأكثر شعبية"}}},
            {"name": "Deals", "slug": "deals", "description": "Limited-time offers", "translations": {"ar": {"name": "العروض", "description": "عروض لفترة محدودة"}}},
        ],
        "categories": [
            {"name": "Phones & Tablets", "slug": "phones-tablets", "translations": {"ar": {"name": "الهواتف واللوحات"}}},
            {"name": "Laptops & PCs", "slug": "laptops-pcs", "translations": {"ar": {"name": "الحواسيب المحمولة والمكتبية"}}},
            {"name": "Gaming", "slug": "gaming", "translations": {"ar": {"name": "الألعاب"}}},
            {"name": "Audio", "slug": "audio", "translations": {"ar": {"name": "الصوتيات"}}},
            {"name": "Accessories", "slug": "accessories", "translations": {"ar": {"name": "الإكسسوارات"}}},
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
                {"en": "Crafted with Passion", "ar": "مُعدّ بشغف"},
                {"en": "Farm-to-table dining that celebrates local flavors and seasonal ingredients.", "ar": "مأكولات من المزرعة إلى الطاولة تحتفي بالنكهات المحلية والمكونات الموسمية."},
                {"en": "View Our Menu", "ar": "شاهد قائمتنا"}, "/menu",
                min_height=550,
            ),
            _banner(
                {"en": "Order Online for Pickup or Delivery", "ar": "اطلب عبر الإنترنت للاستلام أو التوصيل"},
                {"en": "Fresh meals delivered to your door. Same quality, added convenience.", "ar": "وجبات طازجة تصل إلى بابك. الجودة نفسها، والراحة الإضافية."},
                {"en": "Order Now", "ar": "اطلب الآن"}, "/shop",
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
                {"en": "What Our Guests Say", "ar": "ماذا يقول ضيوفنا"},
                [
                    {"name": {"en": "Rachel T.", "ar": "راشيل ت."}, "quote": {"en": "The best dining experience I've had in years. The tasting menu was extraordinary.", "ar": "أفضل تجربة طعام مررت بها منذ سنوات. قائمة التذوق كانت استثنائية."}, "rating": 5},
                    {"name": {"en": "David M.", "ar": "ديفيد م."}, "quote": {"en": "Incredible flavors and the ambiance is perfect for date night.", "ar": "نكهات مذهلة والأجواء مثالية لعشاء رومانسي."}, "rating": 5},
                    {"name": {"en": "Lisa K.", "ar": "ليزا ك."}, "quote": {"en": "We host all our family gatherings here. The staff treats us like family.", "ar": "نستضيف جميع تجمعات عائلتنا هنا. الموظفون يتعاملون معنا كعائلة."}, "rating": 5},
                ],
            ),
            {
                "type": "contact",
                "settings": {
                    "title": {"en": "Make a Reservation", "ar": "احجز طاولة"},
                    "fields": [
                        {"name": "name", "label": {"en": "Your Name", "ar": "اسمك"}, "type": "text", "required": True},
                        {"name": "email", "label": {"en": "Email", "ar": "البريد الإلكتروني"}, "type": "email", "required": True},
                        {"name": "phone", "label": {"en": "Phone", "ar": "الهاتف"}, "type": "tel", "required": True},
                        {"name": "message", "label": {"en": "Special Requests (date, time, party size)", "ar": "طلبات خاصة (التاريخ، الوقت، عدد الأشخاص)"}, "type": "textarea", "required": False},
                    ],
                    "submitText": {"en": "Request Reservation", "ar": "طلب حجز"},
                    "successMessage": {"en": "Thank you! We'll confirm your reservation within 2 hours.", "ar": "شكراً! سنؤكد حجزك خلال ساعتين."},
                },
            },
            _newsletter({"en": "Stay Updated", "ar": "تابع آخر الأخبار"}, {"en": "Get notified about new menu items, events, and special offers.", "ar": "احصل على إشعارات عن أصناف القائمة الجديدة والفعاليات والعروض الخاصة."}),
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
            _hero({"en": "Our Menu", "ar": "قائمتنا"}, {"en": "Seasonal dishes crafted with care.", "ar": "أطباق موسمية مُعدّة بعناية."}, min_height=350),
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
            _faq({"en": "Dining Information", "ar": "معلومات الطعام"}, [
                {"question": {"en": "Do you accommodate dietary restrictions?", "ar": "هل تقبلون القيود الغذائية؟"}, "answer": {"en": "Absolutely. We offer vegetarian, vegan, and gluten-free options. Please inform your server of any allergies.", "ar": "بالتأكيد. نقدم خيارات نباتية ونباتية صرف وخالية من الغلوتين. يرجى إخبار النادل بأي حساسية."}},
                {"question": {"en": "Do you take reservations?", "ar": "هل تقبلون الحجوزات؟"}, "answer": {"en": "Yes! We recommend booking 2-3 days in advance for weekend dining.", "ar": "نعم! نوصي بالحجز قبل 2-3 أيام لتناول الطعام في عطلة نهاية الأسبوع."}},
                {"question": {"en": "Is there parking available?", "ar": "هل توفر موقف سيارات؟"}, "answer": {"en": "We have a private parking lot behind the restaurant. Street parking is also available.", "ar": "لدينا موقف سيارات خاص خلف المطعم. التوقف على الشارع متاح أيضًا."}},
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
            _hero({"en": "Our Story", "ar": "قصتنا"}, {"en": "From a small kitchen to your table.", "ar": "من مطبخ صغير إلى طاولتك."}, min_height=400),
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
            _gallery({"en": "Our Space", "ar": "مساحتنا"}, [], 3),
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
            _hero({"en": "Gallery", "ar": "المعرض"}, {"en": "A glimpse into our world.", "ar": "لمحة من عالمنا."}, min_height=300),
            _gallery({"en": "Our Kitchen & Dining Room", "ar": "مطبخنا وغرفة الطعام"}, [], 3),
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
            _hero({"en": "Reserve Your Table", "ar": "احجز طاولتك"}, {"en": "We look forward to hosting you.", "ar": "نتطلع لاستضافتك."}, min_height=350),
            {
                "type": "contact",
                "settings": {
                    "title": {"en": "Request a Reservation", "ar": "طلب حجز"},
                    "fields": [
                        {"name": "name", "label": {"en": "Full Name", "ar": "الاسم الكامل"}, "type": "text", "required": True},
                        {"name": "email", "label": {"en": "Email", "ar": "البريد الإلكتروني"}, "type": "email", "required": True},
                        {"name": "phone", "label": {"en": "Phone", "ar": "الهاتف"}, "type": "tel", "required": True},
                        {"name": "message", "label": {"en": "Date, Time, and Party Size", "ar": "التاريخ والوقت وعدد الأشخاص"}, "type": "textarea", "required": True},
                    ],
                    "submitText": {"en": "Request Reservation", "ar": "طلب حجز"},
                    "successMessage": {"en": "We'll confirm your reservation via email within 2 hours.", "ar": "سنؤكد حجزك عبر البريد الإلكتروني خلال ساعتين."},
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
            _hero({"en": "Visit Us", "ar": "زورونا"}, {"en": "We'd love to see you.", "ar": "يسعدنا رؤيتكم."}, min_height=300),
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
            _contact({"en": "Send Us a Message", "ar": "أرسل لنا رسالة"}, {"en": "Send", "ar": "إرسال"}),
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
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "Menu", "ar": "القائمة"}, "url": "/menu", "order": 1},
            {"label": {"en": "About", "ar": "من نحن"}, "url": "/about", "order": 2},
            {"label": {"en": "Gallery", "ar": "المعرض"}, "url": "/gallery", "order": 3},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 4},
        ],
        cta_label={"en": "Reserve", "ar": "احجز"}, cta_url="/reservations",
    ),
    "footer": _footer(
        [
            {"title": {"en": "Quick Links", "ar": "روابط سريعة"}, "links": [{"label": {"en": "Menu", "ar": "القائمة"}, "url": "/menu"}, {"label": {"en": "Reservations", "ar": "الحجوزات"}, "url": "/reservations"}, {"label": {"en": "Gallery", "ar": "المعرض"}, "url": "/gallery"}]},
            {"title": {"en": "Hours", "ar": "ساعات العمل"}, "links": [{"label": {"en": "Mon-Fri: 11am-10pm", "ar": "الإثنين-الجمعة: 11ص-10م"}, "url": "#"}, {"label": {"en": "Sat: 10am-11pm", "ar": "السبت: 10ص-11م"}, "url": "#"}, {"label": {"en": "Sun: 10am-9pm", "ar": "الأحد: 10ص-9م"}, "url": "#"}]},
            {"title": {"en": "Contact", "ar": "تواصل معنا"}, "links": [{"label": {"en": "123 Main Street", "ar": "123 الشارع الرئيسي"}, "url": "#"}, {"label": {"en": "(555) 123-4567", "ar": "(555) 123-4567"}, "url": "tel:5551234567"}, {"label": {"en": "hello@restaurant.com", "ar": "hello@restaurant.com"}, "url": "mailto:hello@restaurant.com"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Farm-to-table dining.",
    },
    "demo_content": {
        "collections": [
            {"name": "Seasonal Specials", "slug": "seasonal-specials", "description": "This season's highlights", "translations": {"ar": {"name": "أطباق الموسم", "description": "أبرز هذا الموسم"}}},
            {"name": "Chef's Picks", "slug": "chefs-picks", "description": "Hand-selected favorites", "translations": {"ar": {"name": "اختيارات الشيف", "description": "المفضلة المختارة يدوياً"}}},
        ],
        "categories": [
            {"name": "Starters", "slug": "starters", "translations": {"ar": {"name": "المقبلات"}}},
            {"name": "Mains", "slug": "mains", "translations": {"ar": {"name": "الأطباق الرئيسية"}}},
            {"name": "Desserts", "slug": "desserts", "translations": {"ar": {"name": "الحلويات"}}},
            {"name": "Drinks", "slug": "drinks", "translations": {"ar": {"name": "المشروبات"}}},
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
                {"en": "Your Health, Our Priority", "ar": "صحتك أولويتنا"},
                {"en": "Quality health products with expert pharmacist guidance. Licensed and certified.", "ar": "منتجات صحية عالية الجودة مع إرشاد صيدلي متخصص. مرخص ومعتمد."},
                {"en": "Shop Products", "ar": "تسوّق المنتجات"}, "/shop",
                bg="#0e7490", text_color="#ffffff",
            ),
            _banner(
                {"en": "Free Delivery on Orders Over $50", "ar": "توصيل مجاني للطلبات فوق 50$"},
                {"en": "Convenient, discreet packaging. Same-day dispatch for orders before 2pm.", "ar": "تغليف مريح وسرّي. شحن في نفس اليوم للطلبات قبل الساعة 2 مساءً."},
                {"en": "Order Now", "ar": "اطلب الآن"}, "/shop",
                bg_color="#f0fdfa", text_color="#0f766e",
            ),
            {
                "type": "product-grid",
                "settings": {
                    "title": {"en": "Popular Products", "ar": "المنتجات الأكثر طلباً"},
                    "columns": 4,
                    "productsPerPage": 8,
                    "sortBy": "-total_sold",
                    "showPrices": True,
                    "showBadges": True,
                    "collectionSlug": "best-sellers",
                },
            },
            _faq({"en": "Health Questions", "ar": "أسئلة صحية"}, [
                {"question": {"en": "Do I need a prescription?", "ar": "هل أحتاج وصفة طبية؟"}, "answer": {"en": "Over-the-counter products can be purchased without a prescription. Prescription medications require a valid prescription from your healthcare provider.", "ar": "يمكن شراء المنتجات بدون وصفة طبية. الأدوية الموصفة تتطلب وصفة طبية سارية من مقدم الرعاية الصحية."}},
                {"question": {"en": "How do I transfer my prescription?", "ar": "كيف أنقل وصفتي الطبية؟"}, "answer": {"en": "Simply bring your current prescription or we can contact your previous pharmacy to transfer it for you.", "ar": "فقط أحضر وصفتك الحالية أو يمكننا التواصل مع صيادليتك السابقة لنقلها لك."}},
                {"question": {"en": "Do you offer medication reviews?", "ar": "هل تقدمون مراجعات للأدوية؟"}, "answer": {"en": "Yes! Our pharmacists provide free medication reviews to help you understand your medications and identify any potential interactions.", "ar": "نعم! يقدم صيادلتنا مراجعات مجانية للأدوية لمساعدتك في فهم أدويتك وتحديد أي تفاعلات محتملة."}},
                {"question": {"en": "What are your delivery options?", "ar": "ما خيارات التوصيل المتاحة؟"}, "answer": {"en": "We offer same-day delivery for orders placed before 2pm, standard 2-3 day shipping, and free local pickup.", "ar": "نقدم التوصيل في نفس اليوم للطلبات المقدمة قبل الساعة 2 مساءً، والشحن القياسي خلال 2-3 أيام، والاستلام المحلي المجاني."}},
            ]),
            _newsletter({"en": "Health Tips & Updates", "ar": "نصائح وتحديثات صحية"}, {"en": "Subscribe for wellness tips, new product alerts, and exclusive health offers.", "ar": "اشترك للحصول على نصائح صحية وتنبيهات المنتجات الجديدة والعروض الصحية الحصرية."}),
        ],
    },
    {
        "title": "Products",
        "slug": "products",
        "page_type": "collection",
        "is_published": True,
        "seo_title": "Products | {{store_name}}",
        "seo_description": "Browse our range of health, wellness, and personal care products.",
        "sections": [_product_grid({"en": "All Products", "ar": "جميع المنتجات"}, 3, 12, "-created_at")],
    },
    {
        "title": "Categories",
        "slug": "categories",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Categories | {{store_name}}",
        "seo_description": "Shop by health category.",
        "sections": [
            _hero({"en": "Shop by Category", "ar": "تسوّق حسب الفئة"}, {"en": "Find the right products for your needs.", "ar": "جد المنتجات المناسبة لاحتياجاتك."}, min_height=300),
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
            _hero({"en": "Health Tips & Advice", "ar": "نصائح وإرشادات صحية"}, {"en": "Expert guidance from our pharmacy team.", "ar": "إرشادات متخصصة من فريق الصيدلية."}, min_height=300),
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
            _faq({"en": "Common Health Questions", "ar": "أسئلة صحية شائعة"}, [
                {"question": {"en": "How should I store my medications?", "ar": "كيف يجب أن أخزن أدويتي؟"}, "answer": {"en": "Most medications should be stored in a cool, dry place away from direct sunlight. Some may require refrigeration. Check the label for specific instructions.", "ar": "يجب تخزين معظم الأدوية في مكان بارد وجاف بعيدًا عن أشعة الشمس المباشرة. بعضها قد يتطلب التبريد. تحقق من الملخص للتعليمات المحددة."}},
                {"question": {"en": "Can I take multiple vitamins together?", "ar": "هل يمكنني تناول عدة فيتامينات معاً؟"}, "answer": {"en": "Some vitamins are best absorbed together, while others compete for absorption. Our pharmacists can advise you on the best combination.", "ar": "بعض الفيتامينات يتم امتصاصها بشكل أفضل معاً، بينما البعض الآخر يتنافس على الامتصاص. يمكن لصيادلتنا إعطائك مشورة حول أفضل مزيج."}},
                {"question": {"en": "How do I know if a supplement is quality?", "ar": "كيف أعرف إذا كان المكمل من جودة عالية؟"}, "answer": {"en": "Look for third-party testing seals like USP or NSF. We only carry products from reputable manufacturers.", "ar": "ابحث عن ختم اختبار الأطراف الثالثة مثل USP أو NSF. نحتفظ فقط بالمنتجات من مصنعين ذوي سمعة طيبة."}},
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
            _hero({"en": "About Us", "ar": "من نحن"}, {"en": "Trusted by our community for over 15 years.", "ar": "محل ثقة مجتمعنا لأكثر من 15 عاماً."}, min_height=400),
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
            _hero({"en": "Contact Us", "ar": "تواصل معنا"}, {"en": "We're here to help.", "ar": "نحن هنا لمساعدتك."}, min_height=300),
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
            _contact({"en": "Send Us a Message", "ar": "أرسل لنا رسالة"}, {"en": "Send", "ar": "إرسال"}),
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
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "Products", "ar": "المنتجات"}, "url": "/products", "order": 1},
            {"label": {"en": "Categories", "ar": "الفئات"}, "url": "/categories", "order": 2},
            {"label": {"en": "Health Tips", "ar": "نصائح صحية"}, "url": "/health-tips", "order": 3},
            {"label": {"en": "About", "ar": "من نحن"}, "url": "/about", "order": 4},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 5},
        ],
        cta_label={"en": "Order Now", "ar": "اطلب الآن"}, cta_url="/shop",
    ),
    "footer": _footer(
        [
            {"title": {"en": "Products", "ar": "المنتجات"}, "links": [{"label": {"en": "Vitamins & Supplements", "ar": "الفيتامينات والمكملات"}, "url": "/categories"}, {"label": {"en": "Personal Care", "ar": "العناية الشخصية"}, "url": "/categories"}, {"label": {"en": "First Aid", "ar": "الإسعافات الأولية"}, "url": "/categories"}, {"label": {"en": "Medical Devices", "ar": "الأجهزة الطبية"}, "url": "/categories"}]},
            {"title": {"en": "Resources", "ar": "الموارد"}, "links": [{"label": {"en": "Health Tips", "ar": "نصائح صحية"}, "url": "/health-tips"}, {"label": {"en": "FAQ", "ar": "الأسئلة الشائعة"}, "url": "/faq"}, {"label": {"en": "Prescription Transfer", "ar": "نقل الوصفات"}, "url": "/contact"}]},
            {"title": {"en": "Company", "ar": "الشركة"}, "links": [{"label": {"en": "About Us", "ar": "من نحن"}, "url": "/about"}, {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact"}, {"label": {"en": "Privacy Policy", "ar": "سياسة الخصوصية"}, "url": "/privacy"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Your trusted pharmacy.",
    },
    "demo_content": {
        "collections": [
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most popular health products", "translations": {"ar": {"name": "الأكثر مبيعاً", "description": "منتجاتنا الصحية الأكثر شعبية"}}},
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Recently added products", "translations": {"ar": {"name": "وصل حديثاً", "description": "المنتجات المضافة مؤخراً"}}},
        ],
        "categories": [
            {"name": "Vitamins & Supplements", "slug": "vitamins-supplements", "translations": {"ar": {"name": "الفيتامينات والمكملات"}}},
            {"name": "Personal Care", "slug": "personal-care", "translations": {"ar": {"name": "العناية الشخصية"}}},
            {"name": "First Aid", "slug": "first-aid", "translations": {"ar": {"name": "الإسعافات الأولية"}}},
            {"name": "Medical Devices", "slug": "medical-devices", "translations": {"ar": {"name": "الأجهزة الطبية"}}},
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
                    {"image": "", "title": {"en": "Living Room Collection", "ar": "مجموعة غرفة المعيشة"}, "subtitle": {"en": "Comfortable seating designed for modern living", "ar": "مقاعد مريحة مصممة للحياة العصرية"}, "buttonText": {"en": "Explore", "ar": "استكشف"}, "buttonLink": "/collections"},
                    {"image": "", "title": {"en": "Bedroom Essentials", "ar": "أساسيات غرفة النوم"}, "subtitle": {"en": "Create your perfect sanctuary", "ar": "أنشئ ملاذك المثالي"}, "buttonText": {"en": "Shop Now", "ar": "تسوّق الآن"}, "buttonLink": "/shop"},
                    {"image": "", "title": {"en": "Summer Sale", "ar": "تخفيضات الصيف"}, "subtitle": {"en": "Up to 40% off select furniture", "ar": "خصم حتى 40% على الأثاث المحدد"}, "buttonText": {"en": "Shop Sale", "ar": "تسوّق التخفيضات"}, "buttonLink": "/shop?sale=true"},
                ],
            ),
            _banner(
                {"en": "New: Scandinavian Collection", "ar": "جديد: المجموعة الاسكندنافية"},
                {"en": "Clean lines, natural materials, timeless design.", "ar": "خطوط نظيفة، مواد طبيعية، تصميم خالد."},
                {"en": "Explore Collection", "ar": "استكشف المجموعة"}, "/collections",
                bg_color="#f5f0eb", text_color="#44403c",
            ),
            _product_grid({"en": "Featured Furniture", "ar": "الأثاث المميز"}, 4, 8, "created_at"),
            {
                "type": "product-grid",
                "settings": {
                    "title": {"en": "Room Inspiration", "ar": "إلهام الغرف"},
                    "columns": 3,
                    "productsPerPage": 6,
                    "sortBy": "created_at",
                    "showPrices": True,
                    "showBadges": False,
                    "collectionSlug": "new-arrivals",
                },
            },
            _testimonials(
                {"en": "What Our Customers Say", "ar": "ماذا يقول عملاؤنا"},
                [
                    {"name": {"en": "Michael B.", "ar": "مايكل ب."}, "quote": {"en": "The quality of the furniture is exceptional. Our living room has been completely transformed.", "ar": "جودة الأثاث استثنائية. تم تحويل غرفة المعيشة لدينا بالكامل."}, "rating": 5},
                    {"name": {"en": "Anna S.", "ar": "أنا س."}, "quote": {"en": "Beautiful pieces that are both stylish and comfortable. Worth every penny.", "ar": "قطع جميلة تجمع بين الأناقة والراحة. تستحق كل فلس."}, "rating": 5},
                    {"name": {"en": "Chris L.", "ar": "كريس ل."}, "quote": {"en": "The delivery team was professional and the furniture looks even better in person.", "ar": "فريق التوصيل كان محترفًا والأثاث يبدو أفضل في الواقع."}, "rating": 5},
                ],
            ),
            _newsletter({"en": "Design Inspiration", "ar": "إلهام التصميم"}, {"en": "Get styling tips, new arrivals, and exclusive offers delivered to your inbox.", "ar": "احصل على نصائح التنسيق والمنتجات الجديدة والعروض الحصرية في بريدك الإلكتروني."}),
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
            _hero({"en": "Our Collections", "ar": "مجموعاتنا"}, {"en": "Curated pieces for every room.", "ar": "قطع مُختارة لكل غرفة."}, min_height=350),
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
        "sections": [_product_grid({"en": "All Products", "ar": "جميع المنتجات"}, 3, 12, "-created_at")],
    },
    {
        "title": "Inspiration",
        "slug": "inspiration",
        "page_type": "custom",
        "is_published": True,
        "seo_title": "Inspiration | {{store_name}}",
        "seo_description": "Get inspired for your next home makeover.",
        "sections": [
            {"type": "hero", "settings": {"title": {"en": "Style Inspiration", "ar": "إلهام الأناقة"}, "subtitle": {"en": "Ideas and tips to transform your space.", "ar": "أفكار ونصائح لتحويل مساحتك."}, "buttonText": "", "buttonLink": "", "backgroundImage": "", "overlayOpacity": 0.3, "alignment": "center", "textColor": "#ffffff", "minHeight": 350}},
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
                {"en": "Design Tips from Our Team", "ar": "نصائح التصميم من فريقنا"},
                [
                    {"name": {"en": "Interior Design Team", "ar": "فريق التصميم الداخلي"}, "quote": {"en": "Every room should have a focal point. Build your design around it and let everything else support that statement.", "ar": "يجب أن يكون لكل غرفة نقطة محورية. ابنِ تصميمك حولها ودع كل شيء آخر يدعم تلك العبارة."}, "rating": 5},
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
            _hero({"en": "Our Story", "ar": "قصتنا"}, {"en": "Crafting furniture that feels like home.", "ar": "صناعة أثاث يشعر وكأنه في المنزل."}, min_height=400),
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
            _hero({"en": "Visit Our Showroom", "ar": "زورونا معرضنا"}, {"en": "See, touch, and experience our furniture.", "ar": "شاهد ولمس واختبر أثاثنا."}, min_height=300),
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
            _contact({"en": "Send Us a Message", "ar": "أرسل لنا رسالة"}, {"en": "Send Message", "ar": "إرسال الرسالة"}),
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
            {"label": {"en": "Home", "ar": "الرئيسية"}, "url": "/", "order": 0},
            {"label": {"en": "Collections", "ar": "المجموعات"}, "url": "/collections", "order": 1},
            {"label": {"en": "Products", "ar": "المنتجات"}, "url": "/products", "order": 2},
            {"label": {"en": "Inspiration", "ar": "الإلهام"}, "url": "/inspiration", "order": 3},
            {"label": {"en": "About", "ar": "من نحن"}, "url": "/about", "order": 4},
            {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact", "order": 5},
        ],
        cta_label={"en": "Sale", "ar": "تخفيضات"}, cta_url="/shop?sale=true",
    ),
    "footer": _footer(
        [
            {"title": {"en": "Collections", "ar": "المجموعات"}, "links": [{"label": {"en": "Living Room", "ar": "غرفة المعيشة"}, "url": "/collections"}, {"label": {"en": "Bedroom", "ar": "غرفة النوم"}, "url": "/collections"}, {"label": {"en": "Dining", "ar": "غرفة الطعام"}, "url": "/collections"}, {"label": {"en": "Office", "ar": "المكتب"}, "url": "/collections"}]},
            {"title": {"en": "Help", "ar": "المساعدة"}, "links": [{"label": {"en": "Shipping & Delivery", "ar": "الشحن والتوصيل"}, "url": "/contact"}, {"label": {"en": "Returns & Exchanges", "ar": "المرتجعات والاستبدال"}, "url": "/contact"}, {"label": {"en": "Care Instructions", "ar": "تعليمات العناية"}, "url": "/contact"}]},
            {"title": {"en": "Company", "ar": "الشركة"}, "links": [{"label": {"en": "About Us", "ar": "من نحن"}, "url": "/about"}, {"label": {"en": "Inspiration", "ar": "الإلهام"}, "url": "/inspiration"}, {"label": {"en": "Contact", "ar": "تواصل معنا"}, "url": "/contact"}]},
        ],
    ),
    "seo_defaults": {
        "title_pattern": "{{page_title}} | {{store_name}}",
        "description_pattern": "{{store_name}} — {{page_title}}. Beautifully crafted furniture.",
    },
    "demo_content": {
        "collections": [
            {"name": "New Arrivals", "slug": "new-arrivals", "description": "Fresh additions to our collection", "translations": {"ar": {"name": "وصل حديثاً", "description": "إضافات جديدة إلى مجموعتنا"}}},
            {"name": "Best Sellers", "slug": "best-sellers", "description": "Our most loved pieces", "translations": {"ar": {"name": "الأكثر مبيعاً", "description": "قطعنا الأكثر حباً"}}},
            {"name": "Sale", "slug": "sale", "description": "Great value on quality furniture", "translations": {"ar": {"name": "التخفيضات", "description": "قيمة رائعة على أثاث عالي الجودة"}}},
        ],
        "categories": [
            {"name": "Living Room", "slug": "living-room", "translations": {"ar": {"name": "غرفة المعيشة"}}},
            {"name": "Bedroom", "slug": "bedroom", "translations": {"ar": {"name": "غرفة النوم"}}},
            {"name": "Dining", "slug": "dining", "translations": {"ar": {"name": "غرفة الطعام"}}},
            {"name": "Office", "slug": "office", "translations": {"ar": {"name": "المكتب"}}},
            {"name": "Outdoor", "slug": "outdoor", "translations": {"ar": {"name": "الخارج"}}},
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
