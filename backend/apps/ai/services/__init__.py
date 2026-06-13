from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("apps.ai")


class AIProviderError(Exception):
    """Custom exception for AI provider errors."""
    pass


class BaseAIProvider:
    """Base class for AI providers."""

    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.api_key = config.get("api_key", "")
        self.model_name = config.get("model_name", "gpt-4o-mini")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        raise NotImplementedError

    def generate_text(self, prompt: str, system_prompt: str = "", **kwargs) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        result = self.generate(messages, **kwargs)
        return result.get("content", "")


class OpenAIProvider(BaseAIProvider):
    """OpenAI API provider."""

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        try:
            import openai
            client = openai.OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                temperature=kwargs.get("temperature", self.temperature),
            )
            choice = response.choices[0]
            return {
                "content": choice.message.content or "",
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "model": response.model,
            }
        except ImportError:
            raise AIProviderError("openai package not installed. Run: pip install openai")
        except Exception as e:
            raise AIProviderError(f"OpenAI error: {e}")


class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude provider."""

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)
            system_msg = ""
            user_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    system_msg = msg["content"]
                else:
                    user_messages.append(msg)
            response = client.messages.create(
                model=self.model_name,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                system=system_msg,
                messages=user_messages,
            )
            return {
                "content": response.content[0].text if response.content else "",
                "tokens_used": (response.usage.input_tokens + response.usage.output_tokens) if response.usage else 0,
                "model": self.model_name,
            }
        except ImportError:
            raise AIProviderError("anthropic package not installed. Run: pip install anthropic")
        except Exception as e:
            raise AIProviderError(f"Anthropic error: {e}")


class OllamaProvider(BaseAIProvider):
    """Ollama local provider."""

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        try:
            import requests
            base_url = self.config.get("api_base_url", "http://localhost:11434")
            response = requests.post(
                f"{base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": kwargs.get("temperature", self.temperature),
                        "num_predict": kwargs.get("max_tokens", self.max_tokens),
                    },
                },
                timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            return {
                "content": data.get("message", {}).get("content", ""),
                "tokens_used": data.get("eval_count", 0) + data.get("prompt_eval_count", 0),
                "model": self.model_name,
            }
        except Exception as e:
            raise AIProviderError(f"Ollama error: {e}")


class GroqProvider(BaseAIProvider):
    """Groq provider (fast inference)."""

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                temperature=kwargs.get("temperature", self.temperature),
            )
            choice = response.choices[0]
            return {
                "content": choice.message.content or "",
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "model": response.model,
            }
        except ImportError:
            raise AIProviderError("groq package not installed. Run: pip install groq")
        except Exception as e:
            raise AIProviderError(f"Groq error: {e}")


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter provider (multi-model gateway)."""

    def generate(self, messages: list[dict], **kwargs) -> dict[str, Any]:
        try:
            import openai
            base_url = self.config.get("api_base_url", "https://openrouter.ai/api/v1")
            client = openai.OpenAI(api_key=self.api_key, base_url=base_url)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                temperature=kwargs.get("temperature", self.temperature),
            )
            choice = response.choices[0]
            return {
                "content": choice.message.content or "",
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "model": response.model,
            }
        except Exception as e:
            raise AIProviderError(f"OpenRouter error: {e}")


PROVIDER_MAP = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "ollama": OllamaProvider,
    "groq": GroqProvider,
    "openrouter": OpenRouterProvider,
}


def get_provider(provider_config: dict[str, Any]) -> BaseAIProvider:
    """Get an AI provider instance from config."""
    provider_type = provider_config.get("provider", "openai")
    provider_cls = PROVIDER_MAP.get(provider_type)
    if not provider_cls:
        raise AIProviderError(f"Unknown provider: {provider_type}")
    return provider_cls(provider_config)
