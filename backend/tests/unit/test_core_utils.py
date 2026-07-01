from unittest.mock import MagicMock

import pytest
from django.test import TestCase

from apps.core.utils import (
    _deep_get,
    _resolve_inline_locale,
    resolve_content_schema_locale,
    resolve_footer_locale,
    resolve_locale_field,
    resolve_navigation_locale,
    sanitize_html,
    validate_url_protocols,
)


class TestSanitizeHtmlBasic(TestCase):
    def test_none_returns_empty(self):
        assert sanitize_html(None) == ""

    def test_empty_string(self):
        assert sanitize_html("") == ""


try:
    import bleach  # noqa: F401

    has_bleach = True
except ImportError:
    has_bleach = False


@pytest.mark.skipif(not has_bleach, reason="bleach not installed")
class TestSanitizeHtml(TestCase):
    def test_allowed_tags_pass_through(self):
        result = sanitize_html("<p>Hello <strong>world</strong></p>")
        assert "<p>" in result
        assert "<strong>" in result

    def test_script_tag_stripped(self):
        result = sanitize_html("<p>Safe</p><script>alert('xss')</script>")
        assert "<script>" not in result

    def test_iframe_stripped(self):
        result = sanitize_html("<iframe src='evil.com'></iframe>")
        assert "<iframe" not in result

    def test_disallowed_attributes_stripped(self):
        result = sanitize_html('<a href="http://ok.com" onclick="evil()">link</a>')
        assert "onclick" not in result

    def test_allowed_attributes_pass(self):
        result = sanitize_html('<a href="http://ok.com" title="link">click</a>')
        assert 'href="http://ok.com"' in result


class TestValidateUrlProtocols(TestCase):
    def test_none_returns_none(self):
        assert validate_url_protocols(None) is None

    def test_empty_returns_empty(self):
        assert validate_url_protocols("") == ""

    def test_http_allowed(self):
        assert validate_url_protocols("http://example.com") == "http://example.com"

    def test_https_allowed(self):
        assert validate_url_protocols("https://example.com") == "https://example.com"

    def test_mailto_allowed(self):
        assert validate_url_protocols("mailto:test@example.com") == "mailto:test@example.com"

    def test_tel_allowed(self):
        assert validate_url_protocols("tel:+1234567890") == "tel:+1234567890"

    def test_javascript_rejected(self):
        with self.assertRaises(ValueError):
            validate_url_protocols("javascript:alert(1)")

    def test_data_rejected(self):
        with self.assertRaises(ValueError):
            validate_url_protocols("data:text/html,<script>alert(1)</script>")


class TestResolveLocaleField(TestCase):
    def test_returns_translations_for_locale(self):
        obj = MagicMock()
        obj.translations = {"en": {"name": "English Name"}, "ar": {"name": "Arabic Name"}}
        assert resolve_locale_field(obj, "ar", "name") == "Arabic Name"

    def test_falls_back_to_default_locale(self):
        obj = MagicMock()
        obj.translations = {"en": {"name": "English Name"}}
        assert resolve_locale_field(obj, "fr", "name") == "English Name"

    def test_falls_back_to_obj_field(self):
        obj = MagicMock()
        obj.translations = {}
        obj.name = "Fallback"
        assert resolve_locale_field(obj, "ar", "name") == "Fallback"

    def test_non_dict_translations(self):
        obj = MagicMock()
        obj.translations = "invalid"
        obj.name = "Fallback"
        assert resolve_locale_field(obj, "en", "name") == "Fallback"

    def test_none_translations(self):
        obj = MagicMock()
        obj.translations = None
        obj.name = "Fallback"
        assert resolve_locale_field(obj, "en", "name") == "Fallback"


class TestDeepGet(TestCase):
    def test_returns_value(self):
        assert _deep_get({"en": {"name": "Hi"}}, "en", "name") == "Hi"

    def test_missing_locale(self):
        assert _deep_get({"en": {"name": "Hi"}}, "ar", "name") is None

    def test_missing_key(self):
        assert _deep_get({"en": {"name": "Hi"}}, "en", "title") is None

    def test_non_dict_locale(self):
        assert _deep_get({"en": "string"}, "en", "name") is None


class TestResolveNavigationLocale(TestCase):
    def test_none_returns_none(self):
        assert resolve_navigation_locale(None, "en") is None

    def test_non_dict_returns_as_is(self):
        assert resolve_navigation_locale("invalid", "en") == "invalid"

    def test_resolves_logo_text(self):
        nav = {"logo_text": {"en": "Home", "ar": "الرئيسية"}, "links": []}
        result = resolve_navigation_locale(nav, "ar")
        assert result["logo_text"] == "الرئيسية"

    def test_resolves_links(self):
        nav = {"links": [{"label": {"en": "About", "ar": "حول"}}]}
        result = resolve_navigation_locale(nav, "ar")
        assert result["links"][0]["label"] == "حول"

    def test_resolves_cta_button(self):
        nav = {"cta_button": {"label": {"en": "Buy", "ar": "شراء"}}}
        result = resolve_navigation_locale(nav, "ar")
        assert result["cta_button"]["label"] == "شراء"

    def test_flat_label_not_modified(self):
        nav = {"logo_text": "Home", "links": [{"label": "About"}]}
        result = resolve_navigation_locale(nav, "ar")
        assert result["logo_text"] == "Home"
        assert result["links"][0]["label"] == "About"


class TestResolveFooterLocale(TestCase):
    def test_none_returns_none(self):
        assert resolve_footer_locale(None, "en") is None

    def test_resolves_column_title(self):
        footer = {"columns": [{"title": {"en": "Shop", "ar": "متجر"}, "links": []}]}
        result = resolve_footer_locale(footer, "ar")
        assert result["columns"][0]["title"] == "متجر"

    def test_resolves_column_links(self):
        footer = {
            "columns": [{"title": "Shop", "links": [{"label": {"en": "FAQ", "ar": "أسئلة"}}]}]
        }
        result = resolve_footer_locale(footer, "ar")
        assert result["columns"][0]["links"][0]["label"] == "أسئلة"

    def test_resolves_copyright(self):
        footer = {"copyright": {"en": "2026 Tujjar", "ar": "٢٠٢٦ تجر"}}
        result = resolve_footer_locale(footer, "ar")
        assert result["copyright"] == "٢٠٢٦ تجر"


class TestResolveInlineLocale(TestCase):
    def test_resolves_locale(self):
        assert _resolve_inline_locale({"en": "Hello", "ar": "مرحبا"}, "ar") == "مرحبا"

    def test_falls_back_to_english(self):
        assert _resolve_inline_locale({"en": "Hello"}, "ar") == "Hello"

    def test_missing_both(self):
        assert _resolve_inline_locale({"fr": "Bonjour"}, "en") == ""

    def test_non_dict_passthrough(self):
        assert _resolve_inline_locale("literal", "en") == "literal"

    def test_none_passthrough(self):
        assert _resolve_inline_locale(None, "en") == ""


class TestResolveContentSchemaLocale(TestCase):
    def test_none_returns_none(self):
        assert resolve_content_schema_locale(None, "en") is None

    def test_non_dict_returns_as_is(self):
        assert resolve_content_schema_locale("string", "en") == "string"

    def test_dict_returns_as_is(self):
        schema = {"sections": [{"type": "hero"}]}
        assert resolve_content_schema_locale(schema, "en") == schema
