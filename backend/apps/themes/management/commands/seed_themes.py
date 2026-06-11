import copy

from django.core.management.base import BaseCommand

from apps.themes.models import Theme, ThemePreset


THEMES_DATA = [
    {
        "name": "Modern",
        "slug": "modern",
        "config": {
            "colors": {
                "primary": "#2563eb",
                "secondary": "#64748b",
                "accent": "#10b981",
                "background": "#ffffff",
                "surface": "#f8fafc",
                "text": "#0f172a",
                "textSecondary": "#64748b",
                "border": "#e2e8f0",
                "error": "#ef4444",
                "success": "#10b981",
                "warning": "#f59e0b",
            },
            "typography": {
                "headingFont": "Inter",
                "bodyFont": "Inter",
                "baseFontSize": 16,
                "scale": 1.25,
                "lineHeight": 1.6,
            },
            "spacing": {
                "sectionPaddingY": 80,
                "sectionPaddingX": 24,
                "containerMaxWidth": 1200,
                "gridGap": 24,
            },
            "borderRadius": {"small": 4, "medium": 8, "large": 16, "full": 9999},
            "animations": {"enabled": True, "duration": "normal", "easing": "ease-in-out"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0f172a",
                        "surface": "#1e293b",
                        "text": "#f8fafc",
                        "textSecondary": "#94a3b8",
                        "border": "#334155",
                    }
                },
            },
            {
                "name": "Colorful",
                "config": {
                    "colors": {"primary": "#7c3aed", "accent": "#f43f5e"}
                },
            },
        ],
    },
    {
        "name": "Minimal",
        "slug": "minimal",
        "config": {
            "colors": {
                "primary": "#000000",
                "secondary": "#525252",
                "accent": "#000000",
                "background": "#ffffff",
                "surface": "#fafafa",
                "text": "#000000",
                "textSecondary": "#737373",
                "border": "#e5e5e5",
                "error": "#dc2626",
                "success": "#16a34a",
                "warning": "#ca8a04",
            },
            "typography": {
                "headingFont": "system-ui",
                "bodyFont": "system-ui",
                "baseFontSize": 16,
                "scale": 1.2,
                "lineHeight": 1.5,
            },
            "spacing": {
                "sectionPaddingY": 96,
                "sectionPaddingX": 32,
                "containerMaxWidth": 1100,
                "gridGap": 32,
            },
            "borderRadius": {"small": 0, "medium": 0, "large": 0, "full": 9999},
            "animations": {"enabled": False, "duration": "fast", "easing": "ease"},
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0a0a0a",
                        "surface": "#171717",
                        "text": "#fafafa",
                        "textSecondary": "#a3a3a3",
                        "border": "#262626",
                    }
                },
            },
        ],
    },
    {
        "name": "Luxury",
        "slug": "luxury",
        "config": {
            "colors": {
                "primary": "#b8860b",
                "secondary": "#1a1a2e",
                "accent": "#c9a94e",
                "background": "#fefcf3",
                "surface": "#f5f0e8",
                "text": "#1a1a2e",
                "textSecondary": "#6b6b80",
                "border": "#d4c5a9",
                "error": "#c0392b",
                "success": "#27ae60",
                "warning": "#d4a017",
            },
            "typography": {
                "headingFont": "Playfair Display",
                "bodyFont": "Lato",
                "baseFontSize": 17,
                "scale": 1.3,
                "lineHeight": 1.7,
            },
            "spacing": {
                "sectionPaddingY": 100,
                "sectionPaddingX": 40,
                "containerMaxWidth": 1140,
                "gridGap": 28,
            },
            "borderRadius": {"small": 2, "medium": 4, "large": 8, "full": 9999},
            "animations": {
                "enabled": True,
                "duration": "slow",
                "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
            },
            "darkMode": {"enabled": True, "default": False, "toggle": True},
        },
        "presets": [
            {"name": "Default", "config": {}},
            {
                "name": "Dark",
                "config": {
                    "colors": {
                        "background": "#0d0d1a",
                        "surface": "#1a1a2e",
                        "text": "#f5f0e8",
                        "textSecondary": "#a0a0b0",
                        "border": "#2a2a3e",
                        "primary": "#c9a94e",
                    }
                },
            },
            {
                "name": "Royal",
                "config": {
                    "colors": {"primary": "#7b2d8e", "accent": "#d4af37"}
                },
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed system themes with presets"

    def handle(self, *args, **options):
        created_count = 0
        for theme_data in THEMES_DATA:
            presets_data = theme_data.pop("presets")
            theme, created = Theme.objects.get_or_create(
                slug=theme_data["slug"],
                defaults={**theme_data, "is_system": True, "organization": None},
            )
            if created:
                created_count += 1
                for preset_data in presets_data:
                    ThemePreset.objects.get_or_create(
                        theme=theme,
                        name=preset_data["name"],
                        defaults={"config": preset_data["config"]},
                    )
                self.stdout.write(self.style.SUCCESS(f"Created theme: {theme.name}"))
            else:
                self.stdout.write(f"Theme already exists: {theme.name}")

        self.stdout.write(
            self.style.SUCCESS(f"Done. {created_count} themes created.")
        )
