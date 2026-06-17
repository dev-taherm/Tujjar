from __future__ import annotations

import json
import logging
import time
from typing import Any

from . import AIProviderError, get_provider

logger = logging.getLogger("apps.ai")


class AIChatAssistant:
    """AI chat assistant with context awareness."""

    SYSTEM_PROMPT = """You are an AI assistant for Tujjar, an AI-powered ecommerce platform. 
You help merchants manage their stores, generate content, analyze data, and answer questions.
Be helpful, concise, and professional. If you don't know something, say so.
When asked about analytics or data, provide clear insights and recommendations."""

    def __init__(self, provider_config: dict[str, Any]):
        self.provider = get_provider(provider_config)

    def chat(self, messages: list[dict], context: dict | None = None, **kwargs) -> dict[str, Any]:
        system_prompt = self.SYSTEM_PROMPT
        if context:
            context_str = json.dumps(context, indent=2)
            system_prompt += f"\n\nContext about the store:\n{context_str}"

        full_messages = [{"role": "system", "content": system_prompt}] + messages

        start_time = time.time()
        try:
            result = self.provider.generate(full_messages, **kwargs)
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "content": result.get("content", ""),
                "tokens_used": result.get("tokens_used", 0),
                "latency_ms": latency_ms,
                "is_success": True,
            }
        except AIProviderError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "content": "I apologize, but I encountered an error processing your request. Please try again.",
                "tokens_used": 0,
                "latency_ms": latency_ms,
                "is_success": False,
                "error": str(e),
            }

    def generate_product_ideas(self, store_niche: str, count: int = 5) -> dict[str, Any]:
        prompt = f"""Generate {count} product ideas for a store in the {store_niche} niche.
For each product, provide:
- Title
- Brief description
- Suggested price range
- Target audience
- Key selling points

Return as JSON array."""
        messages = [{"role": "user", "content": prompt}]
        return self.chat(messages)

    def analyze_sentiment(self, text: str) -> dict[str, Any]:
        prompt = f"""Analyze the sentiment of this text and provide:
- Overall sentiment (positive/neutral/negative)
- Confidence score (0-1)
- Key themes
- Suggested response

Text: {text}"""
        messages = [{"role": "user", "content": prompt}]
        return self.chat(messages)
