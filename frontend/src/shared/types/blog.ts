import type { UUID } from "./index";

export interface BlogCategory {
  id: UUID;
  organization: UUID;
  store: UUID;
  name: string;
  slug: string;
  description: string;
  featured_image: UUID | null;
  seo_title: string;
  seo_description: string;
  og_image: UUID | null;
  translations: Record<string, { name?: string; description?: string }>;
  is_active: boolean;
  order: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: UUID;
  organization: UUID;
  store: UUID;
  name: string;
  slug: string;
  description: string;
  translations: Record<string, { name?: string; description?: string }>;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogAuthor {
  id: UUID;
  organization: UUID;
  store: UUID;
  user: UUID | null;
  name: string;
  slug: string;
  bio: string;
  avatar: UUID | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
  translations: Record<string, { name?: string; bio?: string }>;
  created_at: string;
  updated_at: string;
}

export interface BlogPostCategory {
  id: UUID;
  category: UUID;
  name: string;
  slug: string;
  order: number;
}

export interface BlogPostTag {
  id: UUID;
  tag: UUID;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: UUID;
  organization: UUID;
  store: UUID;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: UUID | null;
  featured_image_url: string | null;
  featured_image_alt: string;
  author: UUID | null;
  author_detail: BlogAuthor | null;
  status: "draft" | "published" | "scheduled" | "archived";
  published_at: string | null;
  scheduled_at: string | null;
  categories: UUID[];
  categories_detail: BlogPostCategory[];
  tags: UUID[];
  tags_detail: BlogPostTag[];
  seo_title: string;
  seo_description: string;
  og_image: UUID | null;
  og_image_url: string | null;
  twitter_card: "summary" | "summary_large_image";
  canonical_url: string;
  focus_keyword: string;
  translations: Record<string, { title?: string; excerpt?: string; content?: string }>;
  reading_time: number;
  allow_comments: boolean;
  is_featured: boolean;
  view_count: number;
  expires_at: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: UUID;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  author_name: string;
  status: "draft" | "published" | "scheduled" | "archived";
  published_at: string | null;
  reading_time: number;
  is_featured: boolean;
  view_count: number;
  comment_count: number;
  created_at: string;
}

export interface BlogComment {
  id: UUID;
  organization: UUID;
  store: UUID;
  post: UUID;
  parent: UUID | null;
  user: UUID | null;
  author_name: string;
  author_email: string;
  author_website: string;
  content: string;
  status: "pending" | "approved" | "spam" | "trash";
  is_guest: boolean;
  replies: BlogComment[];
  created_at: string;
  updated_at: string;
}

export interface BlogSubscriber {
  id: UUID;
  organization: UUID;
  store: UUID;
  email: string;
  user: UUID | null;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface BlogPostStats {
  view_count: number;
  reading_time: number;
  comment_count: number;
  approved_comments: number;
  pending_comments: number;
}

export interface BlogListParams {
  store?: string;
  status?: string;
  search?: string;
}
