import type { MetadataRoute } from "next";
import "server-only";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface StoreListItem {
  slug: string;
  name: string;
  domain: string;
  base_url: string;
  updated_at: string | null;
}

interface ProductListItem {
  slug: string;
  updated_at?: string;
}

interface BlogListItem {
  slug: string;
  published_at?: string | null;
}

function storeUrl(slug: string, path = "", locale = "en"): string {
  const base = SITE_URL.replace(/\/$/, "");
  const suffix = path ? `/${path.replace(/^\//, "").replace(/\/$/, "")}/` : "/";
  return `${base}/${locale}/shop/${slug}${suffix}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await fetchJson<StoreListItem[]>(`${BACKEND_URL}/api/v1/store/`);
  if (!stores || stores.length === 0) {
    return [
      {
        url: `${SITE_URL}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
    ];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const store of stores) {
    // Store homepage (with en/ar alternates)
    entries.push({
      url: storeUrl(store.slug),
      lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          en: storeUrl(store.slug, "", "en"),
          ar: storeUrl(store.slug, "", "ar"),
        },
      },
    });

    const [products, blog] = await Promise.all([
      fetchJson<{ results: ProductListItem[] }>(
        `${BACKEND_URL}/api/v1/store/${store.slug}/products/`
      ),
      fetchJson<{ posts: BlogListItem[] }>(
        `${BACKEND_URL}/api/v1/store/${store.slug}/blog/`
      ),
    ]);

    for (const product of products?.results ?? []) {
      entries.push({
        url: storeUrl(store.slug, `shop/${product.slug}`),
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const post of blog?.posts ?? []) {
      entries.push({
        url: storeUrl(store.slug, `shop/blog/${post.slug}`),
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
