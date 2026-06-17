from __future__ import annotations

import copy

import pytest

from apps.themes.models import Theme, ThemePreset, ThemeVersion, _deep_merge


@pytest.mark.django_db
class TestThemeModel:
    def test_create_theme(self):
        theme = Theme.objects.create(
            name="My Theme",
            slug="my-theme",
            config={"colors": {"primary": "#000"}},
        )
        assert theme.pk is not None
        assert theme.name == "My Theme"
        assert theme.slug == "my-theme"
        assert theme.version == "1.0.0"
        assert theme.is_system is False
        assert theme.is_active is True
        assert theme.config == {"colors": {"primary": "#000"}}

    def test_str(self):
        theme = Theme(name="Minimal", version="2.1.0")
        assert str(theme) == "Minimal v2.1.0"

    def test_effective_config_no_parent(self):
        config = {"colors": {"primary": "#fff"}, "typography": {"fontFamily": "Inter"}}
        theme = Theme(name="T", slug="t", config=config)
        effective = theme.effective_config
        assert effective == config
        assert effective is not theme.config

    def test_effective_config_with_parent_deep_merge(self):
        parent = Theme(
            name="Parent",
            slug="parent",
            config={
                "colors": {"primary": "#000", "secondary": "#555"},
                "typography": {"fontFamily": "Arial"},
            },
        )
        parent.save()

        child = Theme(
            name="Child",
            slug="child",
            parent_theme=parent,
            config={
                "colors": {"primary": "#fff"},
            },
        )
        child.save()

        effective = child.effective_config
        assert effective["colors"]["primary"] == "#fff"
        assert effective["colors"]["secondary"] == "#555"
        assert effective["typography"]["fontFamily"] == "Arial"

    def test_effective_config_recursive_chain(self):
        grandparent = Theme(
            name="GP",
            slug="gp",
            config={
                "colors": {"primary": "#000", "secondary": "#111", "accent": "#222"},
            },
        )
        grandparent.save()

        parent = Theme(
            name="P",
            slug="p",
            parent_theme=grandparent,
            config={
                "colors": {"secondary": "#aaa"},
            },
        )
        parent.save()

        child = Theme(
            name="C",
            slug="c",
            parent_theme=parent,
            config={
                "colors": {"accent": "#zzz"},
            },
        )
        child.save()

        effective = child.effective_config
        assert effective["colors"]["primary"] == "#000"
        assert effective["colors"]["secondary"] == "#aaa"
        assert effective["colors"]["accent"] == "#zzz"

    def test_get_color(self):
        theme = Theme(
            name="T",
            slug="t",
            config={"colors": {"primary": "#abc", "bg": "#fff"}},
        )
        assert theme.get_color("primary") == "#abc"
        assert theme.get_color("bg") == "#fff"
        assert theme.get_color("nonexistent") is None

    def test_get_typography(self):
        theme = Theme(
            name="T",
            slug="t",
            config={"typography": {"fontFamily": "Inter", "fontSize": "16px"}},
        )
        assert theme.get_typography("fontFamily") == "Inter"
        assert theme.get_typography("fontSize") == "16px"
        assert theme.get_typography("missing") is None


@pytest.mark.django_db
class TestThemePreset:
    def test_create_preset(self):
        theme = Theme.objects.create(name="T", slug="t")
        preset = ThemePreset.objects.create(
            theme=theme,
            name="Dark Mode",
            config={"colors": {"primary": "#000", "bg": "#111"}},
        )
        assert preset.pk is not None
        assert preset.theme == theme
        assert preset.name == "Dark Mode"

    def test_unique_together_constraint(self):
        theme = Theme.objects.create(name="T", slug="t")
        ThemePreset.objects.create(theme=theme, name="Dark", config={})
        with pytest.raises(Exception):
            ThemePreset.objects.create(theme=theme, name="Dark", config={})

    def test_str(self):
        theme = Theme.objects.create(name="Minimal", slug="minimal")
        preset = ThemePreset(theme=theme, name="Colorful")
        assert str(preset) == "Minimal - Colorful"


@pytest.mark.django_db
class TestThemeVersion:
    def test_create_version(self):
        theme = Theme.objects.create(name="T", slug="t")
        version = ThemeVersion.objects.create(
            theme=theme,
            version="1.0.0",
            config={"colors": {"primary": "#000"}},
            note="Initial",
        )
        assert version.pk is not None
        assert version.theme == theme
        assert version.version == "1.0.0"
        assert version.note == "Initial"

    def test_ordering_by_created_at_desc(self):
        from apps.authentication.models import User

        user = User.objects.create_user(email="v@test.com", password="pass123")
        theme = Theme.objects.create(name="T", slug="t")
        v1 = ThemeVersion.objects.create(theme=theme, version="1.0.0", note="first")
        v2 = ThemeVersion.objects.create(theme=theme, version="1.0.1", note="second")
        versions = list(theme.versions.all())
        assert versions[0].pk == v2.pk
        assert versions[1].pk == v1.pk


@pytest.mark.django_db
class TestDeepMerge:
    def test_flat_override(self):
        base = {"a": 1, "b": 2}
        override = {"b": 3, "c": 4}
        result = _deep_merge(base, override)
        assert result == {"a": 1, "b": 3, "c": 4}

    def test_nested_merge(self):
        base = {"colors": {"primary": "#000", "secondary": "#555"}}
        override = {"colors": {"primary": "#fff"}}
        result = _deep_merge(base, override)
        assert result["colors"]["primary"] == "#fff"
        assert result["colors"]["secondary"] == "#555"

    def test_deep_nested_merge(self):
        base = {"a": {"b": {"c": 1, "d": 2}}}
        override = {"a": {"b": {"c": 99}}}
        result = _deep_merge(base, override)
        assert result == {"a": {"b": {"c": 99, "d": 2}}}

    def test_override_non_dict_with_dict(self):
        base = {"a": "string"}
        override = {"a": {"nested": True}}
        result = _deep_merge(base, override)
        assert result == {"a": {"nested": True}}

    def test_override_dict_with_non_dict(self):
        base = {"a": {"nested": True}}
        override = {"a": "string"}
        result = _deep_merge(base, override)
        assert result == {"a": "string"}

    def test_does_not_mutate_inputs(self):
        base = {"a": {"b": 1}}
        override = {"a": {"c": 2}}
        result = _deep_merge(base, override)
        assert base == {"a": {"b": 1}}
        assert override == {"a": {"c": 2}}
        assert result == {"a": {"b": 1, "c": 2}}

    def test_empty_override(self):
        base = {"a": 1}
        result = _deep_merge(base, {})
        assert result == {"a": 1}

    def test_empty_base(self):
        override = {"a": 1}
        result = _deep_merge({}, override)
        assert result == {"a": 1}
