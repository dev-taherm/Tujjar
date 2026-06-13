from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.templates.data import TEMPLATES_DATA
from apps.templates.models import Template


class Command(BaseCommand):
    help = "Seed all system templates"

    def handle(self, *args, **options):
        created = 0
        skipped = 0

        for data in TEMPLATES_DATA:
            d = dict(data)
            presets = d.pop("presets", [])
            pages = d.pop("pages", [])

            _, was_created = Template.objects.get_or_create(
                slug=d["slug"],
                defaults={**d, "is_system": True, "presets": presets, "pages": pages},
            )
            if was_created:
                created += 1
                self.stdout.write(f"  Created: {d['name']} ({d['slug']})")
            else:
                skipped += 1
                self.stdout.write(f"  Skipped: {d['name']} (exists)")

        self.stdout.write(self.style.SUCCESS(f"\nDone! Created: {created}, Skipped: {skipped}"))
