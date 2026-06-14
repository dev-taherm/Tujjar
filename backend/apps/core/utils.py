from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.organizations.models import Organization


SUPPORTED_LOCALES = ["en", "ar"]
DEFAULT_LOCALE = "en"


def resolve_organization(org_id: str | None) -> Organization | None:
    """Resolve an organization ID to an Organization instance."""
    if not org_id:
        return None
    from apps.organizations.models import Organization

    return Organization.objects.filter(id=org_id).first()


def resolve_locale_field(obj: object, locale: str, field_name: str) -> str | dict | list | None:
    """Resolve a model field value for the given locale.

    Fallback chain: translations[locale][field] -> translations[DEFAULT_LOCALE][field] -> obj.field
    Works for CharField, TextField, and JSONField (e.g. tags).
    """
    translations = getattr(obj, "translations", None) or {}
    if not isinstance(translations, dict):
        translations = {}

    return (
        _deep_get(translations, locale, field_name)
        or _deep_get(translations, DEFAULT_LOCALE, field_name)
        or getattr(obj, field_name, None)
    )


def _deep_get(d: dict, locale: str, key: str):
    """Get a value from nested dict: d[locale][key]. Returns None if missing."""
    locale_data = d.get(locale)
    if isinstance(locale_data, dict):
        return locale_data.get(key)
    return None


def resolve_navigation_locale(navigation: dict | None, locale: str) -> dict | None:
    """Resolve navigation labels for the given locale.

    Supports both formats:
    - Flat: {"label": "Home"} (backward compat, returned as-is)
    - Nested: {"label": {"en": "Home", "ar": "الرئيسية"}} -> resolved string
    """
    if not navigation or not isinstance(navigation, dict):
        return navigation

    result = dict(navigation)

    # Resolve logo_text
    if "logo_text" in result and isinstance(result["logo_text"], dict):
        result["logo_text"] = _resolve_inline_locale(result["logo_text"], locale)

    # Resolve links
    if "links" in result and isinstance(result["links"], list):
        result["links"] = [_resolve_link(link, locale) for link in result["links"]]

    # Resolve cta_button
    if "cta_button" in result and isinstance(result["cta_button"], dict):
        cta = dict(result["cta_button"])
        if isinstance(cta.get("label"), dict):
            cta["label"] = _resolve_inline_locale(cta["label"], locale)
        result["cta_button"] = cta

    return result


def _resolve_link(link: dict, locale: str) -> dict:
    """Resolve a single navigation link's label."""
    result = dict(link)
    if isinstance(result.get("label"), dict):
        result["label"] = _resolve_inline_locale(result["label"], locale)
    return result


def resolve_footer_locale(footer_config: dict | None, locale: str) -> dict | None:
    """Resolve footer column titles and link labels for the given locale."""
    if not footer_config or not isinstance(footer_config, dict):
        return footer_config

    result = dict(footer_config)

    # Resolve columns
    if "columns" in result and isinstance(result["columns"], list):
        resolved_columns = []
        for col in result["columns"]:
            resolved = dict(col)
            if isinstance(resolved.get("title"), dict):
                resolved["title"] = _resolve_inline_locale(resolved["title"], locale)
            if "links" in resolved and isinstance(resolved["links"], list):
                resolved["links"] = [_resolve_link(link, locale) for link in resolved["links"]]
            resolved_columns.append(resolved)
        result["columns"] = resolved_columns

    # Resolve copyright
    if "copyright" in result and isinstance(result["copyright"], dict):
        result["copyright"] = _resolve_inline_locale(result["copyright"], locale)

    return result


def resolve_content_schema_locale(content_schema: dict | None, locale: str) -> dict | None:
    """Resolve page section text settings for the given locale.

    For pages, the entire translated content_schema is stored under
    translations[locale]['content_schema']. If present, return that.
    Otherwise return the original content_schema as-is.
    """
    if not content_schema or not isinstance(content_schema, dict):
        return content_schema
    # Content schema resolution is handled at the model level:
    # translations[locale]['content_schema'] replaces the whole schema.
    return content_schema


def _resolve_inline_locale(value: dict, locale: str) -> str:
    """Resolve a locale dict like {"en": "Home", "ar": "الرئيسية"} to a string."""
    if not isinstance(value, dict):
        return str(value) if value is not None else ""
    return value.get(locale) or value.get(DEFAULT_LOCALE) or ""
