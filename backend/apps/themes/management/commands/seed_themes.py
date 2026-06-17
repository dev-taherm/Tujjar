from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.themes.models import Theme, ThemePreset
from apps.themes.signals import HOMEPAGE_TEMPLATES, THEMES_DATA


class Command(BaseCommand):
    help = "Seed all 8 system themes with presets and homepage templates"

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for theme_data in THEMES_DATA:
            data = dict(theme_data)
            presets_data = data.pop("presets")
            slug = data["slug"]

            theme, created = Theme.objects.get_or_create(
                slug=slug,
                defaults={
                    **data,
                    "is_system": True,
                    "organization": None,
                },
            )

            if created:
                created_count += 1
                self.stdout.write(f"  Created theme: {theme.name} ({theme.slug})")

                for preset_data in presets_data:
                    ThemePreset.objects.get_or_create(
                        theme=theme,
                        name=preset_data["name"],
                        defaults={"config": preset_data["config"]},
                    )
                    self.stdout.write(f"    + Preset: {preset_data['name']}")

                homepage = HOMEPAGE_TEMPLATES.get(slug)
                if homepage:
                    theme.sections_schema = homepage
                    theme.save(update_fields=["sections_schema"])
                    self.stdout.write("    + Homepage template attached")
            else:
                skipped_count += 1
                self.stdout.write(f"  Skipped (exists): {theme.name} ({theme.slug})")

        self.stdout.write(
            self.style.SUCCESS(f"\nDone! Created: {created_count}, Skipped: {skipped_count}")
        )
