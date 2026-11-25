/**
 * Server-only storefront data layer.
 *
 * Calls the Django backend directly (bypassing the Next.js /api proxy) so
 * pages and layouts can fetch data on the server with Next.js caching.
 * Import only from Server Components / generateMetadata — never from
 * client components.
 */

import "server-only";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const REVALIDATE_SECONDS = 300;

// ---------------------------------------------------------------------------
// Types (mirroring the backend storefront serializers)
// ---------------------------------------------------------------------------

export interface StorefrontImage {
  url: string;
  alt?: string | null;
}

export interface StorefrontVariant {
  id: string;
  name: string;
  price: number | null;
}

export interface StorefrontProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  primary_image: StorefrontImage | null;
  images?: StorefrontImage[];
  variants?: StorefrontVariant[];  seo_title?: string;
  seo_description?: string;
  tags?: string[];
}

export interface StorefrontSection {
  id: string;
  type: string;
  settings?: Record<string, unknown>;
  visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  className?: string;
  customCSS?: string;
  [key: string]: unknown;
}

export interface StorefrontPageData {
  id: string;
  title: string;
  slug: string;
  content_schema: { sections: StorefrontSection[] };
  seo_title: string;
  seo_description: string;
  theme_override?: Record<string, unknown> | null;
}

export interface StorefrontNavigation {
  logo_text?: string | Record<string, string>;
  links?: { label: string | Record<string, string>; url: string; order?: number }[];
  cta_button?: { label: string | Record<string, string>; url: string; enabled: boolean };
  header_layout?: "classic" | "centered";
  header_sticky?: boolean;
  header_show_search?: boolean;
  header_show_cart?: boolean;
  header_height?: number;
  logo_height?: number;
}

export interface StorefrontFooterConfig {
  columns?: {
    title: string | Record<string, string>;
    links: { label: string | Record<string, string>; url: string }[];
  }[];
  copyright?: string | Record<string, string>;
  social_links?: Record<string, string>;
  layout?: "columns" | "stacked" | "minimal";
  show_social?: boolean;
  show_copyright?: boolean;
}

export interface StorefrontThemeConfig {
  colors?: Record<string, string>;
  borderRadius?: Record<string, number>;
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    baseFontSize?: number;
    scale?: number;
    lineHeight?: number;
    headingWeight?: number;
    headingLetterSpacing?: number;
    letterSpacing?: number;
  };
  spacing?: {
    sectionPaddingY?: number;
    sectionPaddingX?: number;
    containerMaxWidth?: number;
    gridGap?: number;
  };
  animations?: { enabled: boolean; duration: string; easing: string };
  darkMode?: { enabled: boolean; default: boolean; toggle: boolean };
}

export interface StorefrontStore {
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  seo_title: string;
  seo_description: string;
  og_image: string | null;
  twitter_card: string;
  domain: string;
  navigation: StorefrontNavigation;
  footer_config: StorefrontFooterConfig;
  theme_config: StorefrontThemeConfig | null;
  theme_assets?: { custom_css?: string } | null;
  settings: Record<string, unknown>;
}

export interface StorefrontHomePayload {
  store: StorefrontStore;
  featured_products: StorefrontProduct[];
  homepage: StorefrontPageData | null;
}

export interface StorefrontCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  products_count: number;
}

export interface StorefrontBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string | null;
  featured_image_alt?: string;
  author?: { name: string; slug: string; bio?: string; avatar_url?: string | null } | null;
  author_name?: string;
  published_at?: string | null;
  reading_time?: number;
  view_count?: number;
  seo_title?: string;
  seo_description?: string;
  categories?: { name: string; slug: string }[];
  tags?: { name: string; slug: string }[];
  allow_comments?: boolean;
}

export interface StorefrontBlogPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface StorefrontBlogListPayload {
  posts: StorefrontBlogPost[];
  pagination: StorefrontBlogPagination;
}

export interface StorefrontBlogCategory {
  name: string;
  slug: string;
  post_count: number;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function storeApiFetch<T>(
  path: string,
  locale: string,
  tags: string[] = []
): Promise<T | null> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BACKEND_URL}/api/v1/store/${path}${separator}locale=${locale}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["storefront", ...tags] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Data accessors
// ---------------------------------------------------------------------------

export function getStoreHome(slug: string, locale: string): Promise<StorefrontHomePayload | null> {
  return storeApiFetch<StorefrontHomePayload>(`${slug}/`, locale, [`store:${slug}`]);
}

export function getStore(slug: string, locale: string): Promise<StorefrontStore | null> {
  return getStoreHome(slug, locale).then((data) => data?.store ?? null);
}

export function getStoreProducts(
  slug: string,
  locale: string,
  options: { search?: string; sort?: string; category?: string; collection?: string } = {}
): Promise<StorefrontProduct[]> {
  const sp = new URLSearchParams();
  if (options.sort) sp.set("sort", options.sort);
  if (options.search) sp.set("search", options.search);
  if (options.category) sp.set("category", options.category);
  if (options.collection) sp.set("collection", options.collection);
  return storeApiFetch<{ results: StorefrontProduct[] }>(
    `${slug}/products/?${sp.toString()}`,
    locale,
    [`store:${slug}:products`]
  ).then((data) => data?.results ?? []);
}

export interface StorefrontProductsPageResult {
  results: StorefrontProduct[];
  count: number;
  total_pages: number;
  current_page: number;
}

export function getStoreProductsPage(
  slug: string,
  locale: string,
  options: { search?: string; sort?: string; page?: number } = {}
): Promise<StorefrontProductsPageResult | null> {
  const sp = new URLSearchParams();
  if (options.sort) sp.set("sort", options.sort);
  if (options.search) sp.set("search", options.search);
  if (options.page && options.page > 1) sp.set("page", String(options.page));
  return storeApiFetch<{
    results: StorefrontProduct[];
    pagination?: { page: number; total: number; total_pages: number };
  }>(`${slug}/products/?${sp.toString()}`, locale, [`store:${slug}:products`]).then(
    (data) => {
      if (!data) return null;
      return {
        results: data.results ?? [],
        count: data.pagination?.total ?? data.results?.length ?? 0,
        total_pages: data.pagination?.total_pages ?? 1,
        current_page: data.pagination?.page ?? 1,
      };
    }
  );
}

export function getStoreProduct(
  slug: string,
  productSlug: string,
  locale: string
): Promise<StorefrontProduct | null> {
  return storeApiFetch<StorefrontProduct>(
    `${slug}/products/${productSlug}/`,
    locale,
    [`store:${slug}:product:${productSlug}`]
  );
}

export function getStoreProductRelated(
  slug: string,
  productSlug: string,
  locale: string
): Promise<StorefrontProduct[]> {
  return storeApiFetch<{ related_products: StorefrontProduct[] }>(
    `${slug}/products/${productSlug}/`,
    locale,
    [`store:${slug}:product:${productSlug}:related`]
  ).then((data) => data?.related_products ?? []);
}

export function getStoreCollections(slug: string, locale: string): Promise<StorefrontCollection[]> {
  return storeApiFetch<{ results?: StorefrontCollection[] } | StorefrontCollection[]>(
    `${slug}/collections/`,
    locale,
    [`store:${slug}:collections`]
  ).then((data) => {
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  });
}

export function getStorePage(
  slug: string,
  pageSlug: string,
  locale: string
): Promise<StorefrontPageData | null> {
  return storeApiFetch<StorefrontPageData>(
    `${slug}/pages/${pageSlug}/`,
    locale,
    [`store:${slug}:page:${pageSlug}`]
  );
}

export function getStoreBlogPosts(
  slug: string,
  locale: string,
  options: { page?: number; category?: string } = {}
): Promise<StorefrontBlogListPayload | null> {
  const sp = new URLSearchParams();
  if (options.page) sp.set("page", String(options.page));
  if (options.category) sp.set("category", options.category);
  return storeApiFetch<StorefrontBlogListPayload>(
    `${slug}/blog/?${sp.toString()}`,
    locale,
    [`store:${slug}:blog`]
  );
}

export function getStoreBlogCategories(
  slug: string,
  locale: string
): Promise<StorefrontBlogCategory[]> {
  return storeApiFetch<StorefrontBlogCategory[]>(
    `${slug}/blog/categories/`,
    locale,
    [`store:${slug}:blog-categories`]
  ).then((data) => data ?? []);
}

export function getStoreBlogPost(
  slug: string,
  postSlug: string,
  locale: string
): Promise<StorefrontBlogPost | null> {
  return storeApiFetch<StorefrontBlogPost>(
    `${slug}/blog/${postSlug}/`,
    locale,
    [`store:${slug}:blog:${postSlug}`]
  );
}

// ---------------------------------------------------------------------------
// SEO helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the store-level SEO title template against a page name.
 * Templates look like "%s | {{ store_name }}" or use the store default.
 */
export function resolveSeoTitle(
  template: string | undefined,
  pageName: string,
  storeName: string
): string {
  if (!template) return storeName;
  const resolved = template
    .replace(/\{\{page_title\}\}/g, pageName)
    .replace(/\{\{store_name\}\}/g, storeName);
  // Support Shopify-style "%s" templates too
  if (resolved.includes("%s")) {
    return resolved.replace("%s", pageName).replace(/\{\{store_name\}\}/g, storeName);
  }
  return resolved;
}

/** Absolute URL for a storefront page, used for canonical tags and JSON-LD. */
export function storefrontUrl(
  slug: string,
  path = "",
  locale = "en"
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const base = siteUrl.replace(/\/$/, "");
  const suffix = path ? `/${path.replace(/^\//, "").replace(/\/$/, "")}/` : "/";
  return `${base}/${locale}/shop/${slug}${suffix}`;
}
