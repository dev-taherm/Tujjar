import type { SectionDefinition, SettingField } from "@/shared/types";

const heroSettings: SettingField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "subtitle", label: "Subtitle", type: "text" },
  { key: "buttonText", label: "Button Text", type: "text" },
  { key: "buttonLink", label: "Button Link", type: "text" },
  { key: "backgroundImage", label: "Background Image", type: "image" },
  { key: "overlayOpacity", label: "Overlay Opacity", type: "number" },
  { key: "alignment", label: "Alignment", type: "select", options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ]},
  { key: "textColor", label: "Text Color", type: "color" },
  { key: "minHeight", label: "Min Height (px)", type: "number" },
];

const productGridSettings: SettingField[] = [
  { key: "title", label: "Section Title", type: "text" },
  { key: "columns", label: "Columns", type: "select", options: [
    { value: "2", label: "2 Columns" },
    { value: "3", label: "3 Columns" },
    { value: "4", label: "4 Columns" },
  ]},
  { key: "productsPerPage", label: "Products Per Page", type: "number" },
  { key: "sortBy", label: "Sort By", type: "select", options: [
    { value: "created_at", label: "Newest" },
    { value: "price", label: "Price" },
    { value: "title", label: "Name" },
  ]},
  { key: "showPrices", label: "Show Prices", type: "toggle" },
  { key: "showBadges", label: "Show Badges", type: "toggle" },
];

export const sectionRegistry: Record<string, SectionDefinition> = {
  hero: {
    type: "hero",
    label: "Hero Banner",
    category: "hero",
    icon: "LayoutTemplate",
    limit: 1,
    defaultSettings: {
      title: "Welcome to Our Store",
      subtitle: "Discover amazing products",
      buttonText: "Shop Now",
      buttonLink: "/products",
      backgroundImage: "",
      overlayOpacity: 0.4,
      alignment: "center",
      textColor: "#ffffff",
      minHeight: 500,
    },
    presets: [
      {
        name: "centered",
        label: "Centered",
        settings: {
          title: "Welcome to Our Store",
          subtitle: "Discover amazing products",
          buttonText: "Shop Now",
          buttonLink: "/products",
          backgroundImage: "",
          overlayOpacity: 0.4,
          alignment: "center",
          textColor: "#ffffff",
          minHeight: 500,
        },
      },
      {
        name: "left",
        label: "Left Aligned",
        settings: {
          title: "Welcome to Our Store",
          subtitle: "Discover amazing products",
          buttonText: "Shop Now",
          buttonLink: "/products",
          backgroundImage: "",
          overlayOpacity: 0.4,
          alignment: "left",
          textColor: "#ffffff",
          minHeight: 500,
        },
      },
    ],
    settingsSchema: heroSettings,
  },
  "product-grid": {
    type: "product-grid",
    label: "Product Grid",
    category: "products",
    icon: "LayoutGrid",
    defaultSettings: {
      title: "Featured Products",
      columns: 4,
      productsPerPage: 8,
      sortBy: "created_at",
      showPrices: true,
      showBadges: true,
    },
    presets: [
      {
        name: "4col",
        label: "4 Columns",
        settings: {
          title: "Featured Products",
          columns: "4",
          productsPerPage: 8,
          sortBy: "created_at",
          showPrices: true,
          showBadges: true,
        },
      },
      {
        name: "3col",
        label: "3 Columns",
        settings: {
          title: "Featured Products",
          columns: "3",
          productsPerPage: 8,
          sortBy: "created_at",
          showPrices: true,
          showBadges: true,
        },
      },
    ],
    settingsSchema: productGridSettings,
  },
  gallery: {
    type: "gallery",
    label: "Image Gallery",
    category: "content",
    icon: "Images",
    defaultSettings: { title: "Gallery", images: [], columns: 3, aspectRatio: "1/1", lightbox: true },
    presets: [
      { name: "grid-3", label: "3 Column Grid", settings: { title: "Gallery", images: [], columns: "3", aspectRatio: "1/1", lightbox: true } },
      { name: "grid-4", label: "4 Column Grid", settings: { title: "Gallery", images: [], columns: "4", aspectRatio: "1/1", lightbox: true } },
      { name: "masonry", label: "Masonry Layout", settings: { title: "Gallery", images: [], columns: "3", aspectRatio: "auto", lightbox: true } },
    ],
    settingsSchema: [
      { key: "title", label: "Section Title", type: "text" },
      { key: "columns", label: "Columns", type: "select", options: [
        { value: "2", label: "2 Columns" },
        { value: "3", label: "3 Columns" },
        { value: "4", label: "4 Columns" },
      ]},
      { key: "lightbox", label: "Enable Lightbox", type: "toggle" },
    ],
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    category: "social",
    icon: "Quote",
    defaultSettings: {
      title: "What Our Customers Say",
      testimonials: [
        { name: "John Doe", quote: "Great products!", rating: 5 },
        { name: "Jane Smith", quote: "Best experience ever.", rating: 5 },
      ],
      layout: "carousel",
    },
    presets: [
      { name: "carousel", label: "Carousel", settings: { title: "What Our Customers Say", testimonials: [{ name: "John Doe", quote: "Great products!", rating: 5 }, { name: "Jane Smith", quote: "Best experience ever.", rating: 5 }], layout: "carousel" } },
      { name: "grid", label: "Grid", settings: { title: "What Our Customers Say", testimonials: [{ name: "John Doe", quote: "Great products!", rating: 5 }, { name: "Jane Smith", quote: "Best experience ever.", rating: 5 }], layout: "grid" } },
      { name: "minimal", label: "Minimal Quote", settings: { title: "Reviews", testimonials: [{ name: "John Doe", quote: "Amazing quality.", rating: 5 }], layout: "carousel" } },
    ],
    settingsSchema: [
      { key: "title", label: "Section Title", type: "text" },
      { key: "layout", label: "Layout", type: "select", options: [
        { value: "carousel", label: "Carousel" },
        { value: "grid", label: "Grid" },
      ]},
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ",
    category: "content",
    icon: "HelpCircle",
    defaultSettings: {
      title: "Frequently Asked Questions",
      items: [
        { question: "What is your return policy?", answer: "30-day return policy." },
        { question: "How long does shipping take?", answer: "3-5 business days." },
      ],
    },
    presets: [
      { name: "standard", label: "Standard", settings: { title: "Frequently Asked Questions", items: [{ question: "What is your return policy?", answer: "30-day return policy." }, { question: "How long does shipping take?", answer: "3-5 business days." }] } },
      { name: "minimal", label: "Minimal", settings: { title: "FAQ", items: [{ question: "How do I contact support?", answer: "Email us at support@example.com" }] } },
    ],
    settingsSchema: [
      { key: "title", label: "Section Title", type: "text" },
    ],
  },
  "rich-text": {
    type: "rich-text",
    label: "Rich Text",
    category: "content",
    icon: "Type",
    defaultSettings: {
      htmlContent: "<h2>About Us</h2><p>We are a leading ecommerce platform.</p>",
      maxWidth: 800,
      alignment: "left",
    },
    presets: [
      { name: "about", label: "About Us", settings: { htmlContent: "<h2>About Us</h2><p>We are a leading ecommerce platform committed to delivering the best products and experiences.</p>", maxWidth: 800, alignment: "left" } },
      { name: "story", label: "Our Story", settings: { htmlContent: "<h2>Our Story</h2><p>Founded in 2024, we set out to revolutionize the shopping experience with quality and innovation.</p>", maxWidth: 600, alignment: "center" } },
      { name: "announcement", label: "Announcement", settings: { htmlContent: "<h2>We've Launched!</h2><p>Check out our new collection, now available in store.</p>", maxWidth: 800, alignment: "center" } },
    ],
    settingsSchema: [
      { key: "htmlContent", label: "HTML Content", type: "textarea" },
      { key: "maxWidth", label: "Max Width (px)", type: "number" },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]},
    ],
  },
  banner: {
    type: "banner",
    label: "Banner",
    category: "content",
    icon: "Megaphone",
    defaultSettings: {
      title: "Special Offer",
      subtitle: "Limited time only",
      backgroundImage: "",
      buttonText: "Shop Now",
      buttonLink: "/products",
      textColor: "#ffffff",
      backgroundColor: "#2563eb",
    },
    presets: [
      {
        name: "blue",
        label: "Blue Banner",
        settings: {
          title: "Special Offer",
          subtitle: "Limited time only",
          backgroundImage: "",
          buttonText: "Shop Now",
          buttonLink: "/products",
          textColor: "#ffffff",
          backgroundColor: "#2563eb",
        },
      },
      {
        name: "dark",
        label: "Dark Banner",
        settings: {
          title: "Special Offer",
          subtitle: "Limited time only",
          backgroundImage: "",
          buttonText: "Shop Now",
          buttonLink: "/products",
          textColor: "#ffffff",
          backgroundColor: "#1f2937",
        },
      },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "backgroundImage", label: "Background Image", type: "image" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "buttonLink", label: "Button Link", type: "text" },
      { key: "textColor", label: "Text Color", type: "color" },
      { key: "backgroundColor", label: "Background Color", type: "color" },
    ],
  },
  newsletter: {
    type: "newsletter",
    label: "Newsletter",
    category: "content",
    icon: "Mail",
    limit: 1,
    defaultSettings: {
      title: "Subscribe to Our Newsletter",
      subtitle: "Stay updated with the latest products",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      privacyText: "We respect your privacy.",
    },
    presets: [
      { name: "standard", label: "Standard", settings: { title: "Subscribe to Our Newsletter", subtitle: "Stay updated with the latest products", placeholder: "Enter your email", buttonText: "Subscribe", privacyText: "We respect your privacy." } },
      { name: "minimal", label: "Minimal", settings: { title: "Stay in the Loop", subtitle: "", placeholder: "Your email", buttonText: "Join", privacyText: "" } },
      { name: "discount", label: "With Discount", settings: { title: "Get 10% Off", subtitle: "Subscribe for exclusive deals", placeholder: "Enter your email", buttonText: "Get Discount", privacyText: "No spam, ever." } },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "placeholder", label: "Input Placeholder", type: "text" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "privacyText", label: "Privacy Text", type: "text" },
    ],
  },
  "custom-html": {
    type: "custom-html",
    label: "Custom HTML",
    category: "content",
    icon: "Code",
    defaultSettings: { htmlContent: "<div>Custom HTML</div>" },
    presets: [
      { name: "divider", label: "Divider", settings: { htmlContent: "<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;' />" } },
      { name: "spacer", label: "Spacer", settings: { htmlContent: "<div style='height: 64px;'></div>" } },
      { name: "badge", label: "Promo Badge", settings: { htmlContent: "<div style='text-align: center; padding: 12px; background: #fef3c7; border-radius: 8px;'><strong>🔥 Free Shipping on Orders Over $50</strong></div>" } },
    ],
    settingsSchema: [
      { key: "htmlContent", label: "HTML Content", type: "textarea" },
    ],
  },
  countdown: {
    type: "countdown",
    label: "Countdown Timer",
    category: "content",
    icon: "Timer",
    defaultSettings: { title: "Sale Ends In", targetDate: "", showDays: true, showHours: true, showMinutes: true, showSeconds: true },
    presets: [
      { name: "sale", label: "Sale Countdown", settings: { title: "Sale Ends In", targetDate: "", showDays: true, showHours: true, showMinutes: true, showSeconds: true } },
      { name: "launch", label: "Product Launch", settings: { title: "Launching In", targetDate: "", showDays: true, showHours: true, showMinutes: true, showSeconds: false } },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "targetDate", label: "Target Date", type: "text" },
      { key: "showDays", label: "Show Days", type: "toggle" },
      { key: "showHours", label: "Show Hours", type: "toggle" },
      { key: "showMinutes", label: "Show Minutes", type: "toggle" },
      { key: "showSeconds", label: "Show Seconds", type: "toggle" },
    ],
  },
  video: {
    type: "video",
    label: "Video Embed",
    category: "content",
    icon: "Play",
    defaultSettings: { videoUrl: "", title: "", autoplay: false, aspectRatio: "16/9" },
    presets: [
      { name: "youtube", label: "YouTube 16:9", settings: { videoUrl: "", title: "", autoplay: false, aspectRatio: "16/9" } },
      { name: "square", label: "Square 1:1", settings: { videoUrl: "", title: "", autoplay: false, aspectRatio: "1/1" } },
    ],
    settingsSchema: [
      { key: "videoUrl", label: "Video URL", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "autoplay", label: "Autoplay", type: "toggle" },
      { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: [
        { value: "16/9", label: "16:9" },
        { value: "4/3", label: "4:3" },
        { value: "1/1", label: "1:1" },
      ]},
    ],
  },
  image: {
    type: "image",
    label: "Image",
    category: "content",
    icon: "Image",
    defaultSettings: { imageUrl: "", altText: "", caption: "", alignment: "center", maxWidth: 100 },
    presets: [
      { name: "full-width", label: "Full Width", settings: { imageUrl: "", altText: "", caption: "", alignment: "center", maxWidth: 100 } },
      { name: "centered", label: "Centered (80%)", settings: { imageUrl: "", altText: "", caption: "", alignment: "center", maxWidth: 80 } },
      { name: "with-caption", label: "With Caption", settings: { imageUrl: "", altText: "", caption: "Image caption text", alignment: "center", maxWidth: 100 } },
    ],
    settingsSchema: [
      { key: "imageUrl", label: "Image URL", type: "image" },
      { key: "altText", label: "Alt Text", type: "text" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "alignment", label: "Alignment", type: "select", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]},
      { key: "maxWidth", label: "Max Width (%)", type: "number" },
    ],
  },
  pricing: {
    type: "pricing",
    label: "Pricing Table",
    category: "content",
    icon: "CreditCard",
    defaultSettings: {
      title: "Choose Your Plan",
      plans: [
        { name: "Basic", price: "$9", period: "/mo", features: ["1 User", "10GB Storage", "Email Support"], buttonText: "Get Started", highlighted: false },
        { name: "Pro", price: "$29", period: "/mo", features: ["5 Users", "100GB Storage", "Priority Support", "API Access"], buttonText: "Get Started", highlighted: true },
        { name: "Enterprise", price: "$99", period: "/mo", features: ["Unlimited Users", "1TB Storage", "24/7 Support", "API Access", "Custom Integrations"], buttonText: "Contact Sales", highlighted: false },
      ],
    },
    presets: [
      { name: "3-plans", label: "3 Plans", settings: { title: "Choose Your Plan", plans: [{ name: "Basic", price: "$9", period: "/mo", features: ["1 User", "10GB Storage"], buttonText: "Get Started", highlighted: false }, { name: "Pro", price: "$29", period: "/mo", features: ["5 Users", "100GB Storage", "Priority Support"], buttonText: "Get Started", highlighted: true }, { name: "Enterprise", price: "$99", period: "/mo", features: ["Unlimited Users", "1TB Storage", "24/7 Support"], buttonText: "Contact Sales", highlighted: false }] } },
      { name: "2-plans", label: "2 Plans", settings: { title: "Simple Pricing", plans: [{ name: "Starter", price: "$19", period: "/mo", features: ["1 User", "50GB Storage"], buttonText: "Start Free", highlighted: false }, { name: "Business", price: "$49", period: "/mo", features: ["10 Users", "500GB Storage", "Priority Support"], buttonText: "Get Started", highlighted: true }] } },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
    ],
  },
  contact: {
    type: "contact",
    label: "Contact Section",
    category: "content",
    icon: "Phone",
    defaultSettings: { title: "Contact Us", subtitle: "", email: "", phone: "", address: "", showForm: true },
    presets: [
      { name: "with-form", label: "With Form", settings: { title: "Contact Us", subtitle: "We'd love to hear from you", email: "", phone: "", address: "", showForm: true } },
      { name: "info-only", label: "Info Only", settings: { title: "Get in Touch", subtitle: "Reach out to us anytime", email: "", phone: "", address: "", showForm: false } },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "showForm", label: "Show Form", type: "toggle" },
    ],
  },
  carousel: {
    type: "carousel",
    label: "Image Carousel",
    category: "content",
    icon: "GalleryHorizontalEnd",
    defaultSettings: { title: "", images: [], autoplay: false, showDots: true, showArrows: true },
    presets: [
      { name: "standard", label: "Standard", settings: { title: "", images: [], autoplay: false, showDots: true, showArrows: true } },
      { name: "autoplay", label: "Autoplay", settings: { title: "", images: [], autoplay: true, showDots: true, showArrows: false } },
      { name: "minimal", label: "Minimal", settings: { title: "", images: [], autoplay: false, showDots: false, showArrows: true } },
    ],
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "autoplay", label: "Autoplay", type: "toggle" },
      { key: "showDots", label: "Show Dots", type: "toggle" },
      { key: "showArrows", label: "Show Arrows", type: "toggle" },
    ],
  },
  footer: {
    type: "footer",
    label: "Footer",
    category: "layout",
    icon: "PanelBottom",
    defaultSettings: {
      columns: [
        { title: "Company", links: [{ label: "About", url: "/about" }, { label: "Careers", url: "/careers" }, { label: "Contact", url: "/contact" }] },
        { title: "Products", links: [{ label: "Features", url: "/features" }, { label: "Pricing", url: "/pricing" }, { label: "Docs", url: "/docs" }] },
        { title: "Legal", links: [{ label: "Privacy", url: "/privacy" }, { label: "Terms", url: "/terms" }] },
      ],
      copyright: "All rights reserved.",
      socialLinks: { facebook: "#", twitter: "#", instagram: "#" },
    },
    presets: [
      { name: "3-col", label: "3 Columns", settings: { columns: [{ title: "Company", links: [{ label: "About", url: "/about" }, { label: "Contact", url: "/contact" }] }, { title: "Products", links: [{ label: "Features", url: "/features" }, { label: "Pricing", url: "/pricing" }] }, { title: "Legal", links: [{ label: "Privacy", url: "/privacy" }, { label: "Terms", url: "/terms" }] }], copyright: "All rights reserved.", socialLinks: { facebook: "#", twitter: "#", instagram: "#" } } },
      { name: "minimal", label: "Minimal", settings: { columns: [{ title: "Links", links: [{ label: "About", url: "/about" }, { label: "Contact", url: "/contact" }, { label: "Privacy", url: "/privacy" }] }], copyright: "All rights reserved.", socialLinks: {} } },
    ],
    settingsSchema: [
      { key: "copyright", label: "Copyright Text", type: "text" },
    ],
  },
};

export function getRegistryEntry(type: string): SectionDefinition | undefined {
  return sectionRegistry[type];
}

export function getAllSectionTypes(): SectionDefinition[] {
  return Object.values(sectionRegistry);
}

export function getSectionsByCategory(category: string): SectionDefinition[] {
  return Object.values(sectionRegistry).filter((s) => s.category === category);
}
