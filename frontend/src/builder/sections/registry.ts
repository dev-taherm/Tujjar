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
    settingsSchema: productGridSettings,
  },
  gallery: {
    type: "gallery",
    label: "Image Gallery",
    category: "content",
    icon: "Images",
    defaultSettings: { title: "Gallery", images: [], columns: 3, aspectRatio: "1/1", lightbox: true },
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
    defaultSettings: {
      title: "Subscribe to Our Newsletter",
      subtitle: "Stay updated with the latest products",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      privacyText: "We respect your privacy.",
    },
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
    settingsSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "targetDate", label: "Target Date", type: "text" },
      { key: "showDays", label: "Show Days", type: "toggle" },
      { key: "showHours", label: "Show Hours", type: "toggle" },
      { key: "showMinutes", label: "Show Minutes", type: "toggle" },
      { key: "showSeconds", label: "Show Seconds", type: "toggle" },
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
