from __future__ import annotations

import json
import time
import logging
from typing import Any

from apps.products.models import Product

from . import AIProviderError, get_provider

logger = logging.getLogger("apps.ai")


class ContentGenerator:
    """AI-powered content generation for products and store."""

    SYSTEM_PROMPTS = {
        "product_description": """You are an expert ecommerce copywriter. Generate compelling, SEO-optimized product descriptions that convert visitors into buyers. Be concise, persuasive, and highlight key benefits.""",
        "product_title": """You are an expert ecommerce copywriter. Generate clear, descriptive, SEO-friendly product titles. Keep them under 70 characters. Be specific and include key attributes.""",
        "seo_title": """You are an SEO expert. Generate optimized page titles under 60 characters. Include the primary keyword naturally. Make them compelling for click-through.""",
        "seo_description": """You are an SEO expert. Generate meta descriptions under 160 characters. Include a clear value proposition and call-to-action. Make them compelling for search results.""",
        "marketing_copy": """You are a marketing copywriter. Create compelling marketing copy that engages customers and drives action. Use persuasive language, emotional triggers, and clear CTAs.""",
        "store_description": """You are an ecommerce expert. Generate a compelling store description that builds trust, communicates value, and encourages shopping. Keep it concise but impactful.""",
        "blog_post": """You are a content writer for an ecommerce store. Write engaging, informative blog posts that provide value to customers while subtly promoting products. Use a friendly, authoritative tone.""",
    }

    def __init__(self, provider_config: dict[str, Any]):
        self.provider = get_provider(provider_config)

    def generate(self, task_type: str, prompt: str, context: dict | None = None, **kwargs) -> dict[str, Any]:
        system_prompt = self.SYSTEM_PROMPTS.get(task_type, "You are a helpful AI assistant.")
        if context:
            context_str = json.dumps(context, indent=2)
            prompt = f"Context:\n{context_str}\n\nRequest:\n{prompt}"

        start_time = time.time()
        try:
            result = self.provider.generate_text(prompt, system_prompt=system_prompt, **kwargs)
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "content": result,
                "tokens_used": result.get("tokens_used", 0) if isinstance(result, dict) else 0,
                "latency_ms": latency_ms,
                "is_success": True,
            }
        except AIProviderError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "content": "",
                "tokens_used": 0,
                "latency_ms": latency_ms,
                "is_success": False,
                "error": str(e),
            }

    def generate_product_description(self, product: Product, tone: str = "professional") -> dict[str, Any]:
        prompt = f"""Generate a compelling product description for:
Title: {product.title}
Type: {product.product_type}
Price: ${product.price}
SKU: {product.sku}
Current description: {product.description or "None"}

Tone: {tone}
Include key benefits, features, and a call-to-action."""
        return self.generate("product_description", prompt)

    def generate_seo_content(self, product: Product) -> dict[str, Any]:
        prompt = f"""Generate SEO content for this product:
Title: {product.title}
Price: ${product.price}
Category: {", ".join(c.name for c in product.categories.all())}

Generate both:
1. SEO title (under 60 chars)
2. Meta description (under 160 chars)

Return as JSON: {{"seo_title": "...", "seo_description": "..."}}"""
        result = self.generate("seo_title", prompt)
        try:
            parsed = json.loads(result["content"])
            return {"seo_title": parsed.get("seo_title", ""), "seo_description": parsed.get("seo_description", "")}
        except (json.JSONDecodeError, KeyError):
            return {"seo_title": product.title, "seo_description": product.description[:160]}

    def generate_marketing_email(self, store_name: str, products: list[dict], offer: str = "") -> dict[str, Any]:
        products_str = "\n".join([f"- {p.get('title', '')}: ${p.get('price', 0)}" for p in products[:5]])
        prompt = f"""Generate a marketing email for store: {store_name}
Products to feature:
{products_str}
Special offer: {offer or "None"}

Include subject line, preview text, and email body."""
        return self.generate("marketing_copy", prompt)

    def generate_store_description(self, store_name: str, niche: str = "") -> dict[str, Any]:
        prompt = f"""Generate a compelling store description for:
Store name: {store_name}
Niche/Category: {niche or "General"}

Include value proposition, what makes it unique, and encourage shopping."""
        return self.generate("store_description", prompt)
