"""Seed realistic data for a store so dashboard, analytics, storefront & blog show real numbers."""

from __future__ import annotations

import random
import uuid
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.core.threadlocals import set_current_org_id
from apps.stores.models import Store
from apps.products.models import Category, Collection, Product, ProductImage, ProductVariant
from apps.blog.models import BlogAuthor, BlogCategory, BlogPost, BlogPostCategory, BlogPostTag, BlogTag
from apps.customers.models import Customer
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.analytics.models import Event, DailyStats


PRODUCTS = [
    {"title": "Classic Leather Watch", "price": "149.99", "compare_at_price": "199.99", "category": "Accessories", "tags": ["watch", "leather", "classic"], "description": "Elegant leather-strap watch with Swiss movement and sapphire crystal glass."},
    {"title": "Wireless Noise-Cancelling Headphones", "price": "89.99", "compare_at_price": "129.99", "category": "Electronics", "tags": ["headphones", "wireless", "audio"], "description": "Premium over-ear headphones with active noise cancellation and 30-hour battery life."},
    {"title": "Organic Cotton T-Shirt", "price": "34.99", "category": "Clothing", "tags": ["t-shirt", "organic", "cotton"], "description": "Soft, breathable organic cotton tee available in 12 colors."},
    {"title": "Stainless Steel Water Bottle", "price": "24.99", "category": "Home & Kitchen", "tags": ["bottle", "steel", "eco-friendly"], "description": "Double-wall vacuum insulated bottle. Keeps drinks cold 24h or hot 12h."},
    {"title": "Handmade Ceramic Mug Set", "price": "42.00", "compare_at_price": "55.00", "category": "Home & Kitchen", "tags": ["mug", "ceramic", "handmade"], "description": "Set of 4 artisan-crafted ceramic mugs, each uniquely glazed."},
    {"title": "Running Sneakers Pro", "price": "119.99", "category": "Footwear", "tags": ["sneakers", "running", "sport"], "description": "Lightweight performance running shoes with responsive foam cushioning."},
    {"title": "Minimalist Backpack", "price": "69.99", "compare_at_price": "89.99", "category": "Accessories", "tags": ["backpack", "minimalist", "travel"], "description": "Sleek 20L backpack with padded laptop sleeve and hidden anti-theft pocket."},
    {"title": "Essential Oil Diffuser", "price": "39.99", "category": "Home & Kitchen", "tags": ["diffuser", "aromatherapy", "wellness"], "description": "Ultrasonic essential oil diffuser with 7 LED color lights and auto shut-off."},
    {"title": "Bamboo Cutting Board", "price": "29.99", "category": "Home & Kitchen", "tags": ["cutting-board", "bamboo", "kitchen"], "description": "Large organic bamboo cutting board with juice groove and built-in handles."},
    {"title": "Yoga Mat Premium", "price": "54.99", "compare_at_price": "69.99", "category": "Sports & Outdoors", "tags": ["yoga", "mat", "fitness"], "description": "Non-slip TPE yoga mat, 6mm thick, with alignment markings and carry strap."},
    {"title": "Bluetooth Portable Speaker", "price": "59.99", "category": "Electronics", "tags": ["speaker", "bluetooth", "portable"], "description": "Waterproof Bluetooth speaker with 360-degree sound and 12-hour playback."},
    {"title": "Canvas Slip-On Shoes", "price": "44.99", "category": "Footwear", "tags": ["shoes", "canvas", "casual"], "description": "Comfortable canvas slip-ons with memory foam insole. Perfect for everyday wear."},
    {"title": "Journal & Pen Set", "price": "27.99", "category": "Stationery", "tags": ["journal", "pen", "stationery"], "description": "Linen-bound journal with 192 lined pages plus a matching brass-tipped rollerball pen."},
    {"title": "Plant-Based Protein Powder", "price": "34.99", "category": "Health & Beauty", "tags": ["protein", "plant-based", "nutrition"], "description": "25g protein per serving from pea, brown rice, and hemp. Chocolate flavor."},
    {"title": "Scented Soy Candle Trio", "price": "32.00", "category": "Home & Kitchen", "tags": ["candle", "soy", "scented"], "description": "Three hand-poured soy wax candles: Lavender, Vanilla Bean, and Cedarwood."},
    {"title": "Polarized Sunglasses", "price": "79.99", "compare_at_price": "99.99", "category": "Accessories", "tags": ["sunglasses", "polarized", "UV protection"], "description": "Lightweight acetate frame sunglasses with UV400 polarized lenses."},
    {"title": "Resistance Band Set", "price": "22.99", "category": "Sports & Outdoors", "tags": ["resistance", "bands", "fitness"], "description": "Set of 5 color-coded latex-free resistance bands with carrying bag."},
    {"title": "Wireless Charging Pad", "price": "19.99", "category": "Electronics", "tags": ["charger", "wireless", "qi"], "description": "10W fast wireless charging pad compatible with all Qi-enabled devices."},
    {"title": "Linen Throw Blanket", "price": "64.99", "compare_at_price": "79.99", "category": "Home & Kitchen", "tags": ["blanket", "linen", "throw"], "description": "Stonewashed European linen throw, pre-shrunk, gets softer with every wash."},
    {"title": "Digital Fitness Tracker", "price": "99.99", "category": "Electronics", "tags": ["fitness", "tracker", "wearable"], "description": "Tracks steps, heart rate, sleep, and SpO2. 7-day battery life. IP68 rated."},
]

BLOG_POSTS = [
    {"title": "10 Tips for Building a Morning Routine", "slug": "10-tips-morning-routine", "category": "Lifestyle", "tags": ["morning", "routine", "productivity"], "content": "<p>Starting your day with intention can transform your productivity and well-being. Here are ten science-backed tips to help you build a morning routine that sticks.</p><h2>1. Wake Up Consistently</h2><p>Choose a wake-up time and stick to it — even on weekends. Your circadian rhythm thrives on consistency.</p><h2>2. Hydrate First</h2><p>Before reaching for coffee, drink a full glass of water. After 7+ hours of sleep, your body is dehydrated.</p><h2>3. Move Your Body</h2><p>Even 10 minutes of stretching or walking can boost endorphins and set a positive tone for the day.</p><h2>4. Practice Gratitude</h2><p>Write down three things you're grateful for. This simple practice rewires your brain for positivity.</p><h2>5. Avoid Your Phone</h2><p>Resist the urge to check email or social media for the first 30 minutes. Protect your mental space.</p>", "reading_time": 4},
    {"title": "How to Style Your Home Office for Maximum Productivity", "slug": "style-home-office-productivity", "category": "Home & Living", "tags": ["home office", "productivity", "design"], "content": "<p>Your workspace profoundly affects your focus and output. Here's how to design a home office that helps you do your best work.</p><h2>Ergonomics First</h2><p>Invest in a quality chair and desk. Your future self will thank you for the saved chiropractor bills.</p><h2>Natural Light</h2><p>Position your desk near a window. Natural light reduces eye strain and boosts mood.</p><h2>Declutter Ruthlessly</h2><p>A clean desk equals a clear mind. Keep only what you need within arm's reach.</p><h2>Add Greenery</h2><p>Plants improve air quality and reduce stress. Low-maintenance options like pothos or snake plants are perfect.</p>", "reading_time": 3},
    {"title": "The Complete Guide to Sustainable Shopping", "slug": "complete-guide-sustainable-shopping", "category": "Sustainability", "tags": ["sustainable", "eco-friendly", "shopping"], "content": "<p>Make conscious choices that benefit both you and the planet. This guide covers everything from evaluating brands to building a capsule wardrobe.</p><h2>Why It Matters</h2><p>The fashion industry alone accounts for 10% of global carbon emissions. Every purchase is a vote for the kind of world you want.</p><h2>Quality Over Quantity</h2><p>Invest in fewer, better things. A well-made item that lasts 10 years beats 10 cheap replacements.</p><h2>Read Labels</h2><p>Look for certifications like GOTS, Fair Trade, B Corp, and OEKO-TEX. They help cut through greenwashing.</p><h2>Support Local</h2><p>Buying from local artisans reduces shipping emissions and strengthens your community.</p>", "reading_time": 5},
    {"title": "5 Easy Healthy Recipes You Can Make in Under 30 Minutes", "slug": "5-healthy-recipes-under-30-minutes", "category": "Food & Recipes", "tags": ["recipes", "healthy", "quick meals"], "content": "<p>Eating well doesn't have to be time-consuming. These five recipes are nutritious, delicious, and ready in under 30 minutes.</p><h2>1. Mediterranean Quinoa Bowl</h2><p>Cook quinoa, toss with cherry tomatoes, cucumber, olives, feta, and a lemon-herb dressing.</p><h2>2. Stir-Fried Tofu with Vegetables</h2><p>Press and cube tofu, stir-fry with broccoli, bell peppers, and a garlic-ginger sauce over rice.</p><h2>3. Avocado Toast with Egg</h2><p>Toast whole grain bread, smash avocado, top with a poached egg and chili flakes.</p><h2>4. Greek Yogurt Parfait</h2><p>Layer Greek yogurt with granola, berries, and a drizzle of honey.</p><h2>5. One-Pan Salmon & Asparagus</h2><p>Bake salmon fillets with asparagus, lemon, and herbs on a single sheet pan.</p>", "reading_time": 3},
    {"title": "Digital Detox: Reclaiming Your Attention in the Age of Distraction", "slug": "digital-detox-reclaiming-attention", "category": "Wellness", "tags": ["digital detox", "mindfulness", "wellness"], "content": "<p>We check our phones an average of 96 times a day. Here's how to break the cycle and reclaim your focus.</p><h2>The Problem</h2><p>Every notification triggers a dopamine hit. Over time, we train our brains to crave constant stimulation.</p><h2>Start Small</h2><p>Begin with a 30-minute screen-free window each day. Gradually increase to longer periods.</p><h2>Create Phone-Free Zones</h2><p>The bedroom and dinner table are great places to start. Protect these sacred spaces.</p><h2>Replace the Habit</h2><p>When you feel the urge to scroll, pick up a book, go for a walk, or call a friend instead.</p><h2>The Payoff</h2><p>People who practice regular digital detoxes report better sleep, improved relationships, and greater creativity.</p>", "reading_time": 4},
]

CUSTOMER_DATA = [
    {"email": "sarah.johnson@example.com", "first_name": "Sarah", "last_name": "Johnson", "city": "Portland", "state": "OR", "country": "US"},
    {"email": "mike.chen@example.com", "first_name": "Mike", "last_name": "Chen", "city": "San Francisco", "state": "CA", "country": "US"},
    {"email": "emma.williams@example.com", "first_name": "Emma", "last_name": "Williams", "city": "Austin", "state": "TX", "country": "US"},
    {"email": "james.brown@example.com", "first_name": "James", "last_name": "Brown", "city": "Denver", "state": "CO", "country": "US"},
    {"email": "olivia.davis@example.com", "first_name": "Olivia", "last_name": "Davis", "city": "Seattle", "state": "WA", "country": "US"},
    {"email": "liam.miller@example.com", "first_name": "Liam", "last_name": "Miller", "city": "Chicago", "state": "IL", "country": "US"},
    {"email": "sophia.garcia@example.com", "first_name": "Sophia", "last_name": "Garcia", "city": "Miami", "state": "FL", "country": "US"},
    {"email": "noah.wilson@example.com", "first_name": "Noah", "last_name": "Wilson", "city": "Nashville", "state": "TN", "country": "US"},
    {"email": "ava.taylor@example.com", "first_name": "Ava", "last_name": "Taylor", "city": "Boston", "state": "MA", "country": "US"},
    {"email": "ethan.anderson@example.com", "first_name": "Ethan", "last_name": "Anderson", "city": "Phoenix", "state": "AZ", "country": "US"},
]

PLACEHOLDER = "https://placehold.co/600x600.png?text={}"


class Command(BaseCommand):
    help = "Seed realistic data for a store"

    def add_arguments(self, parser):
        parser.add_argument("--store", type=str, required=True, help="Store slug to seed")
        parser.add_argument("--clear", action="store_true", help="Clear existing seed data first")

    def handle(self, *args, **options):
        slug = options["store"]
        clear = options["clear"]

        try:
            store = Store.unscoped.get(slug=slug)
        except Store.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Store '{slug}' not found"))
            return

        org = store.organization
        set_current_org_id(str(org.id))
        self.stdout.write(f"Seeding data for store '{store.name}' (org={org.id})")

        if clear:
            self._clear_data(store, org)

        self._create_categories(store, org)
        self._create_products(store, org)
        self._create_collections(store, org)
        self._create_blog(store, org)
        self._create_customers(store, org)
        self._create_orders(store, org)
        self._create_events(store, org)
        self._create_daily_stats(store, org)

        self.stdout.write(self.style.SUCCESS("Done seeding data"))

    def _clear_data(self, store, org):
        self.stdout.write("Clearing existing data...")
        DailyStats.unscoped.filter(store=store).delete()
        Event.unscoped.filter(store=store).delete()
        Order.unscoped.filter(store=store).delete()
        Customer.unscoped.filter(store=store).delete()
        BlogPost.unscoped.filter(store=store).delete()
        BlogCategory.unscoped.filter(store=store).delete()
        BlogTag.unscoped.filter(store=store).delete()
        BlogAuthor.unscoped.filter(store=store).delete()
        Collection.unscoped.filter(store=store).delete()
        Product.unscoped.filter(store=store).delete()
        Category.unscoped.filter(store=store).delete()

    # ── Categories ────────────────────────────────────────────────────

    def _create_categories(self, store, org):
        if Category.unscoped.filter(store=store).exists():
            self.categories = {c.name: c for c in Category.unscoped.filter(store=store)}
            self.stdout.write(f"  Categories already exist ({len(self.categories)}), skipping")
            return

        names = ["Electronics", "Clothing", "Accessories", "Home & Kitchen", "Sports & Outdoors", "Footwear", "Stationery", "Health & Beauty"]
        self.categories = {}
        for i, name in enumerate(names):
            cat = Category.unscoped.create(
                organization=org,
                store=store,
                name=name,
                slug=slugify(name),
                description=f"Shop our collection of {name.lower()}",
                image=PLACEHOLDER.format(name.replace(" ", "+")),
                is_active=True,
                sort_order=i,
                seo_title=f"{name} | {store.name}",
                seo_description=f"Browse our {name.lower()} collection",
            )
            self.categories[name] = cat
            self.stdout.write(f"  Category: {name}")

    # ── Products ──────────────────────────────────────────────────────

    def _create_products(self, store, org):
        if Product.unscoped.filter(store=store).exists():
            self.products = list(Product.unscoped.filter(store=store))
            self.stdout.write(f"  Products already exist ({len(self.products)}), skipping")
            return

        self.products = []
        for i, p in enumerate(PRODUCTS):
            cat_name = p.pop("category")
            tags = p.pop("tags")
            price = Decimal(p["price"])
            compare = Decimal(p["compare_at_price"]) if "compare_at_price" in p else None
            slug = slugify(p["title"])

            product = Product.unscoped.create(
                organization=org,
                store=store,
                title=p["title"],
                slug=slug,
                description=p["description"],
                product_type="physical",
                status="active",
                price=price,
                compare_at_price=compare,
                sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
                track_inventory=True,
                inventory_quantity=random.randint(10, 150),
                requires_shipping=True,
                is_taxable=True,
                tags=tags,
                seo_title=f"{p['title']} | {store.name}",
                seo_description=p["description"][:160],
                total_sold=random.randint(5, 80),
                total_revenue=price * random.randint(5, 80),
            )

            # Category
            if cat_name in self.categories:
                product.categories.add(self.categories[cat_name])

            # Image
            ProductImage.objects.create(
                product=product,
                url=PLACEHOLDER.format(p["title"].replace(" ", "+")),
                alt_text=p["title"],
                position=0,
                is_primary=True,
            )

            # Variants for products with compare_at_price (suggests variants)
            if compare and price < Decimal("100"):
                sizes = ["S", "M", "L", "XL"]
                for j, size in enumerate(sizes):
                    ProductVariant.objects.create(
                        product=product,
                        title=size,
                        sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
                        price=price,
                        inventory_quantity=random.randint(5, 40),
                        option1=size,
                        is_active=True,
                        sort_order=j,
                    )

            self.products.append(product)
            self.stdout.write(f"  Product: {p['title']}")

    # ── Collections ───────────────────────────────────────────────────

    def _create_collections(self, store, org):
        if Collection.unscoped.filter(store=store).exists():
            self.stdout.write("  Collections already exist, skipping")
            return

        collection_defs = [
            ("Summer Essentials", "summer-essentials", "Hot picks for the warm season"),
            ("Best Sellers", "best-sellers", "Our most popular products"),
            ("New Arrivals", "new-arrivals", "Fresh finds just landed"),
            ("Gift Ideas", "gift-ideas", "Perfect gifts for everyone on your list"),
            ("Staff Picks", "staff-picks", "Hand-selected by our team"),
        ]

        for i, (name, slug, desc) in enumerate(collection_defs):
            coll = Collection.unscoped.create(
                organization=org,
                store=store,
                name=name,
                slug=slug,
                description=desc,
                image=PLACEHOLDER.format(name.replace(" ", "+")),
                is_active=True,
                sort_order=i,
                seo_title=f"{name} | {store.name}",
                seo_description=desc,
            )
            # Add 4-8 random products
            sample = random.sample(self.products, min(random.randint(4, 8), len(self.products)))
            coll.products.set(sample)
            self.stdout.write(f"  Collection: {name} ({len(sample)} products)")

    # ── Blog ──────────────────────────────────────────────────────────

    def _create_blog(self, store, org):
        if BlogPost.unscoped.filter(store=store).exists():
            self.stdout.write("  Blog already exists, skipping")
            return

        # Author
        author = BlogAuthor.unscoped.create(
            organization=org,
            store=store,
            name="Tujjar Team",
            slug="tujjar-team",
            bio="The editorial team at Tujjar — sharing tips on lifestyle, home, and sustainable living.",
        )
        self.stdout.write("  Blog author: Tujjar Team")

        # Categories
        blog_cats = {}
        cat_names = ["Lifestyle", "Home & Living", "Sustainability", "Food & Recipes", "Wellness"]
        for name in cat_names:
            bc = BlogCategory.unscoped.create(
                organization=org,
                store=store,
                name=name,
                slug=slugify(name),
                description=f"Articles about {name.lower()}",
                is_active=True,
            )
            blog_cats[name] = bc
        self.stdout.write(f"  Blog categories: {len(blog_cats)}")

        # Tags
        all_tag_names = set()
        for post in BLOG_POSTS:
            all_tag_names.update(post["tags"])
        blog_tags = {}
        for name in all_tag_names:
            bt = BlogTag.unscoped.create(
                organization=org,
                store=store,
                name=name,
                slug=slugify(name),
            )
            blog_tags[name] = bt

        # Posts
        now = timezone.now()
        for i, post_data in enumerate(BLOG_POSTS):
            cat_name = post_data.pop("category")
            tag_names = post_data.pop("tags")
            published = now - timedelta(days=random.randint(1, 60) * (i + 1))

            post = BlogPost.unscoped.create(
                organization=org,
                store=store,
                title=post_data["title"],
                slug=post_data["slug"],
                excerpt=post_data["content"][:200].replace("<p>", "").replace("</p>", ""),
                content=post_data["content"],
                author=author,
                status="published",
                published_at=published,
                reading_time=post_data["reading_time"],
                view_count=random.randint(20, 500),
                seo_title=f"{post_data['title']} | {store.name} Blog",
                seo_description=post_data["content"][:160].replace("<p>", "").replace("</p>", ""),
            )

            if cat_name in blog_cats:
                BlogPostCategory.objects.create(post=post, category=blog_cats[cat_name])

            for tag_name in tag_names:
                if tag_name in blog_tags:
                    BlogPostTag.objects.create(post=post, tag=blog_tags[tag_name])

            self.stdout.write(f"  Blog post: {post_data['title']}")

    # ── Customers ─────────────────────────────────────────────────────

    def _create_customers(self, store, org):
        if Customer.unscoped.filter(store=store).exists():
            self.customers = list(Customer.unscoped.filter(store=store))
            self.stdout.write(f"  Customers already exist ({len(self.customers)}), skipping")
            return

        self.customers = []
        for data in CUSTOMER_DATA:
            c = Customer.unscoped.create(
                organization=org,
                store=store,
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                city=data["city"],
                state=data["state"],
                country=data["country"],
                address_line1=f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} {random.choice(['St', 'Ave', 'Blvd', 'Dr'])}",
                postal_code=f"{random.randint(10000, 99999)}",
                is_verified=True,
                tags=random.sample(["loyal", "new", "returning", "vip", "wholesale"], k=random.randint(1, 2)),
            )
            c.set_password("changeme123")
            c.save(update_fields=["password"])
            self.customers.append(c)
            self.stdout.write(f"  Customer: {data['first_name']} {data['last_name']}")

    # ── Orders ────────────────────────────────────────────────────────

    def _create_orders(self, store, org):
        if Order.unscoped.filter(store=store).exists():
            self.stdout.write("  Orders already exist, skipping")
            return

        now = timezone.now()
        statuses = ["pending", "confirmed", "processing", "shipped", "delivered"]
        status_weights = [5, 10, 15, 25, 45]

        self.orders = []
        for i in range(25):
            customer = random.choice(self.customers)
            status = random.choices(statuses, weights=status_weights, k=1)[0]
            payment_status = "paid" if status in ("shipped", "delivered") else random.choice(["pending", "paid"])
            created = now - timedelta(days=random.randint(0, 90), hours=random.randint(0, 23))
            num_items = random.randint(1, 4)
            order_products = random.sample(self.products, min(num_items, len(self.products)))

            subtotal = Decimal("0")
            items_data = []
            for product in order_products:
                qty = random.randint(1, 3)
                unit_price = product.price
                line_total = unit_price * qty
                subtotal += line_total
                items_data.append((product, qty, unit_price, line_total))

            tax = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
            shipping = Decimal("5.99") if subtotal < Decimal("50") else Decimal("0")
            total = subtotal + tax + shipping

            order = Order.unscoped.create(
                organization=org,
                store=store,
                customer=customer,
                order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
                status=status,
                payment_status=payment_status,
                subtotal=subtotal,
                tax_amount=tax,
                shipping_amount=shipping,
                total=total,
                currency="USD",
                customer_email=customer.email,
                customer_first_name=customer.first_name,
                customer_last_name=customer.last_name,
                shipping_address_line1=customer.address_line1,
                shipping_city=customer.city,
                shipping_state=customer.state,
                shipping_postal_code=customer.postal_code,
                shipping_country=customer.country,
                source="web",
                created_at=created,
                updated_at=created,
            )

            for product, qty, unit_price, line_total in items_data:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    title=product.title,
                    sku=product.sku,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=line_total,
                )

            # Status history
            transitions = self._get_transitions(status)
            prev = "pending"
            for to_status in transitions:
                OrderStatusHistory.objects.create(
                    order=order,
                    from_status=prev,
                    to_status=to_status,
                    created_at=created,
                )
                prev = to_status

            # Update customer stats
            Customer.unscoped.filter(id=customer.id).update(
                orders_count=Customer.unscoped.filter(id=customer.id).first().orders_count + 1,
                total_spent=Customer.unscoped.filter(id=customer.id).first().total_spent + total,
                last_order_date=created,
            )

            self.orders.append(order)

        self.stdout.write(f"  Orders: {len(self.orders)}")

    def _get_transitions(self, final_status):
        flow = ["pending", "confirmed", "processing", "shipped", "delivered"]
        idx = flow.index(final_status) if final_status in flow else 0
        return flow[: idx + 1]

    # ── Events ────────────────────────────────────────────────────────

    def _create_events(self, store, org):
        if Event.unscoped.filter(store=store).exists():
            self.stdout.write("  Events already exist, skipping")
            return

        now = timezone.now()
        event_types = ["page_view", "product_view", "add_to_cart", "purchase", "search"]
        weights = [40, 25, 15, 10, 10]

        events = []
        for _ in range(200):
            etype = random.choices(event_types, weights=weights, k=1)[0]
            created = now - timedelta(days=random.randint(0, 89), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            product = random.choice(self.products) if etype in ("product_view", "add_to_cart", "purchase") else None

            events.append(Event(
                organization=org,
                store=store,
                event_type=etype,
                entity_type="product" if product else "",
                entity_id=product.id if product else None,
                session_id=uuid.uuid4().hex,
                visitor_id=uuid.uuid4().hex[:16],
                metadata={},
                created_at=created,
                updated_at=created,
            ))

        Event.unscoped.bulk_create(events, batch_size=50)
        self.stdout.write(f"  Events: {len(events)}")

    # ── Daily Stats ───────────────────────────────────────────────────

    def _create_daily_stats(self, store, org):
        if DailyStats.unscoped.filter(store=store).exists():
            self.stdout.write("  Daily stats already exist, skipping")
            return

        today = timezone.now().date()
        stats = []
        for day_offset in range(89, -1, -1):
            date = today - timedelta(days=day_offset)
            # Gradual growth trend
            factor = 1 + (90 - day_offset) / 200
            orders = random.randint(1, int(5 * factor))
            revenue = round(random.uniform(50, 400) * float(factor), 2)
            visitors = random.randint(20, int(150 * factor))
            page_views = visitors * random.randint(2, 5)
            products_sold = sum(random.randint(1, 3) for _ in range(orders))
            conv_rate = round((orders / max(visitors, 1)) * 100, 2)

            top_products = [
                {"product_id": str(random.choice(self.products).id), "sold": random.randint(1, 10)}
                for _ in range(min(3, len(self.products)))
            ]

            stats.append(DailyStats(
                store=store,
                organization=org,
                date=date,
                total_orders=orders,
                total_revenue=Decimal(str(revenue)),
                total_customers=random.randint(0, orders),
                total_products_sold=products_sold,
                total_page_views=page_views,
                total_visitors=visitors,
                total_searches=random.randint(5, 30),
                conversion_rate=Decimal(str(conv_rate)),
                average_order_value=Decimal(str(round(revenue / max(orders, 1), 2))),
                top_products=top_products,
                traffic_sources={"direct": random.randint(20, 50), "organic": random.randint(10, 40), "social": random.randint(5, 20), "referral": random.randint(0, 15)},
            ))

        DailyStats.unscoped.bulk_create(stats, batch_size=50)
        self.stdout.write(f"  Daily stats: {len(stats)} days")
