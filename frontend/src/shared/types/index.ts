export type UUID = string;

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  pagination: Pagination;
  results: T[];
}

export interface ApiError {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: {
      field_errors?: Array<{ field: string; message: string }>;
    };
  };
}

export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  phone: string;
  is_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  two_factor_enabled: boolean;
  provider: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  plan: UUID | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  logo: string | null;
  owner_email: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: UUID;
  name: string;
  codename: string;
  module: string;
  description: string;
}

export interface Store {
  id: UUID;
  organization: UUID;
  name: string;
  slug: string;
  custom_domain: string | null;
  description: string;
  logo: string | null;
  favicon: string | null;
  theme: UUID | null;
  template: UUID | null;
  navigation: {
    logo_text: string;
    links: Array<{ label: string; url: string; order?: number }>;
    cta_button?: { label: string; url: string; enabled: boolean };
  } | null;
  footer_config: {
    columns: Array<{ title: string; links: Array<{ label: string; url: string }> }>;
    copyright: string;
    social_links: Record<string, string>;
  } | null;
  settings: Record<string, unknown>;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  translations?: Record<string, { name?: string; description?: string; seo_title?: string; seo_description?: string }>;
  domain: string;
  domains: StoreDomain[];
  created_at: string;
  updated_at: string;
}

export interface StoreDomain {
  id: UUID;
  domain: string;
  is_primary: boolean;
  verified: boolean;
  created_at: string;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    scale: number;
    lineHeight: number;
  };
  spacing: {
    sectionPaddingY: number;
    sectionPaddingX: number;
    containerMaxWidth: number;
    gridGap: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  animations: {
    enabled: boolean;
    duration: string;
    easing: string;
  };
  darkMode: {
    enabled: boolean;
    default: boolean;
    toggle: boolean;
  };
}

export interface Theme {
  id: UUID;
  organization: UUID | null;
  name: string;
  slug: string;
  version: string;
  parent_theme: UUID | null;
  config: ThemeConfig;
  sections_schema: Record<string, unknown>;
  assets: Record<string, unknown>;
  preview_image: string | null;
  is_system: boolean;
  is_active: boolean;
  presets: ThemePreset[];
  effective_config: ThemeConfig;
  created_at: string;
  updated_at: string;
}

export interface ThemePreset {
  id: UUID;
  name: string;
  config: Partial<ThemeConfig>;
  preview_image: string | null;
  created_at: string;
}

// Page Builder Types
export interface Section {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  className?: string;
  customCSS?: string;
}

export interface PageSchema {
  sections: Section[];
}

export interface Page {
  id: UUID;
  organization: UUID;
  store: UUID;
  title: string;
  slug: string;
  page_type: "homepage" | "product" | "collection" | "blog" | "custom" | "legal";
  content_schema: PageSchema;
  theme_override: Record<string, unknown> | null;
  seo_title: string;
  seo_description: string;
  translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }>;
  is_published: boolean;
  published_at: string | null;
  created_by: UUID | null;
  version: number;
  section_count: number;
  created_at: string;
  updated_at: string;
}

export interface PageVersion {
  id: UUID;
  page: UUID;
  version: number;
  content_schema: PageSchema;
  created_by: UUID | null;
  created_by_email: string;
  change_summary: string;
  created_at: string;
}

export interface SettingField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "color" | "image" | "toggle" | "repeater";
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
  required?: boolean;
}

export interface SectionDefinition {
  type: string;
  label: string;
  category: "hero" | "products" | "content" | "social" | "layout";
  icon: string;
  defaultSettings: Record<string, unknown>;
  settingsSchema: SettingField[];
}

// Product Types
export interface Category {
  id: UUID;
  organization: UUID;
  store: UUID;
  parent: UUID | null;
  name: string;
  slug: string;
  description: string;
  image: string;
  is_active: boolean;
  sort_order: number;
  translations?: Record<string, { name?: string; description?: string }>;
  children: Category[];
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: UUID;
  organization: UUID;
  store: UUID;
  name: string;
  slug: string;
  description: string;
  image: string;
  is_active: boolean;
  sort_order: number;
  products: Product[];
  product_count: number;
  translations?: Record<string, { name?: string; description?: string }>;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: UUID;
  url: string;
  alt_text: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: UUID;
  product: UUID;
  title: string;
  sku: string;
  barcode: string;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  track_inventory: boolean;
  weight: number | null;
  option1: string;
  option2: string;
  option3: string;
  is_active: boolean;
  sort_order: number;
  is_in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: UUID;
  organization: UUID;
  store: UUID;
  title: string;
  slug: string;
  description: string;
  product_type: "physical" | "digital" | "service";
  status: "draft" | "active" | "archived";
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  sku: string;
  barcode: string;
  track_inventory: boolean;
  inventory_quantity: number;
  allow_backorder: boolean;
  low_stock_threshold: number;
  weight: number | null;
  requires_shipping: boolean;
  seo_title: string;
  seo_description: string;
  is_taxable: boolean;
  tax_code: string;
  categories: Category[];
  category_ids?: UUID[];
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  is_in_stock: boolean;
  is_on_sale: boolean;
  primary_image: ProductImage | null;
  category_names?: string[];
  variant_count?: number;
  total_sold: number;
  total_revenue: number;
  translations?: Record<string, { title?: string; description?: string; seo_title?: string; seo_description?: string; tags?: string[] }>;
  created_at: string;
  updated_at: string;
}

// Customer Types
export interface Customer {
  id: UUID;
  organization: UUID;
  store: UUID;
  user: UUID | null;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  company: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  orders_count: number;
  total_spent: number;
  loyalty_points: number;
  tags: string[];
  notes: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Cart Types
export interface CartItem {
  id: UUID;
  cart: UUID;
  product: UUID;
  variant: UUID | null;
  quantity: number;
  unit_price: number;
  product_title: string;
  line_total: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: UUID;
  organization: UUID;
  store: UUID;
  customer: UUID | null;
  session_key: string;
  status: "active" | "abandoned" | "converted";
  subtotal: number;
  currency: string;
  items: CartItem[];
  total_items: number;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface OrderItem {
  id: UUID;
  order: UUID;
  product: UUID | null;
  variant: UUID | null;
  title: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string;
  created_at: string;
}

export interface Order {
  id: UUID;
  order_number: string;
  organization: UUID;
  store: UUID;
  customer: UUID | null;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_status: "pending" | "authorized" | "paid" | "partially_paid" | "refunded" | "voided";
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_name: string;
  customer_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  customer_notes: string;
  internal_notes: string;
  tracking_number: string;
  tracking_url: string;
  shipped_at: string | null;
  delivered_at: string | null;
  source: string;
  ip_address: string | null;
  items: OrderItem[];
  item_count: number;
  created_at: string;
  updated_at: string;
}

// AI Types
export interface AIProvider {
  id: UUID;
  organization: UUID;
  name: string;
  provider: "openai" | "anthropic" | "gemini" | "ollama" | "groq" | "openrouter";
  model_name: string;
  api_base_url: string;
  is_active: boolean;
  is_default: boolean;
  max_tokens: number;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: UUID;
  conversation: UUID;
  role: "system" | "user" | "assistant";
  content: string;
  tokens_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AIConversation {
  id: UUID;
  organization: UUID;
  store: UUID | null;
  user: UUID | null;
  title: string;
  context_type: "chat" | "product_gen" | "content_gen" | "analytics" | "support";
  model_name: string;
  is_active: boolean;
  total_tokens_used: number;
  messages: AIMessage[];
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AIGenerationLog {
  id: UUID;
  organization: UUID;
  user: UUID | null;
  task_type: string;
  prompt: string;
  result: string;
  provider: string;
  model_name: string;
  tokens_used: number;
  latency_ms: number;
  is_success: boolean;
  error_message: string;
  created_at: string;
}

export interface AIGenerateResult {
  content: string;
  tokens_used: number;
  latency_ms: number;
  is_success: boolean;
  error?: string;
}

export interface AIProductGenerateResult {
  description: string;
  seo_title: string;
  seo_description: string;
  bullet_points: string[];
}

// Media Types
export interface MediaFolder {
  id: UUID;
  organization: UUID;
  store: UUID | null;
  name: string;
  parent: UUID | null;
  path: string;
  asset_count: number;
  created_at: string;
}

export interface MediaAsset {
  id: UUID;
  organization: UUID;
  store: UUID | null;
  folder: UUID | null;
  folder_name: string | null;
  title: string;
  filename: string;
  original_filename: string;
  file_type: "image" | "video" | "document" | "other";
  mime_type: string;
  file_size: number;
  file_size_display: string;
  file_url: string;
  thumbnail_url: string;
  cdn_url: string;
  storage_backend: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  title_attr: string;
  is_image: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaStats {
  total_assets: number;
  total_images: number;
  total_videos: number;
  total_documents: number;
  total_size: number;
}

// Analytics Types
export interface AnalyticsEvent {
  id: UUID;
  event_type: string;
  entity_type: string;
  entity_id: UUID | null;
  metadata: Record<string, unknown>;
  session_id: string;
  url: string;
  referrer: string;
  created_at: string;
}

export interface DailyStats {
  id: UUID;
  date: string;
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products_sold: number;
  total_page_views: number;
  total_visitors: number;
  total_searches: number;
  conversion_rate: number;
  average_order_value: number;
  top_products: { product_id: UUID; title: string; revenue: number }[];
  traffic_sources: Record<string, number>;
}

export interface DashboardSummary {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products_sold: number;
  revenue_change_pct: number;
  orders_change_pct: number;
  customers_change_pct: number;
  recent_orders: AnalyticsEvent[];
  top_products: { product_id: UUID; title: string; revenue: number }[];
  revenue_chart: { date: string; revenue: number; orders: number }[];
  traffic_sources: Record<string, number>;
}

export interface RealtimeStats {
  total_events: number;
  page_views: number;
  product_views: number;
  purchases: number;
  visitors: number;
}

// Search Types
export interface SearchResult {
  entity_type: string;
  entity_id: UUID;
  title: string;
  description: string;
  score: number;
  highlight: string;
}

export interface SearchQueryLog {
  id: UUID;
  query: string;
  results_count: number;
  clicked_entity_type: string;
  clicked_entity_id: UUID | null;
  created_at: string;
}

// Notification Types
export interface Notification {
  id: UUID;
  notification_type: "order" | "product" | "store" | "billing" | "system" | "ai" | "custom";
  title: string;
  message: string;
  entity_type: string;
  entity_id: UUID | null;
  is_read: boolean;
  action_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPreference {
  id: UUID;
  order_notifications: boolean;
  product_notifications: boolean;
  store_notifications: boolean;
  billing_notifications: boolean;
  system_notifications: boolean;
  ai_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

// Billing Types
export interface Plan {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  trial_days: number;
  max_products: number;
  max_orders: number;
  max_storage_gb: number;
  max_ai_generations: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: UUID;
  plan: UUID;
  plan_name: string;
  plan_price: number;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
}

export interface Invoice {
  id: UUID;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  amount: number;
  currency: string;
  description: string;
  invoice_number: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: UUID;
  method_type: "card" | "bank_account";
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

// Marketplace Types
export interface MarketplaceListing {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
  pricing_type: "free" | "paid";
  price: number;
  category: string;
  tags: string[];
  screenshots: string[];
  demo_url: string;
  download_count: number;
  rating_average: number;
  rating_count: number;
  is_featured: boolean;
  developer_name: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceReview {
  id: UUID;
  rating: number;
  title: string;
  body: string;
  helpful_count: number;
  user_name: string;
  created_at: string;
}
