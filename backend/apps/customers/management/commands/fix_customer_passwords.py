from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.customers.models import Customer


class Command(BaseCommand):
    help = "Set a temporary password for customers with empty password fields."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="changeme123",
            help="Temporary password to set (default: changeme123)",
        )

    def handle(self, *args, **options):
        password = options["password"]
        customers = Customer.unscoped.filter(password="")
        count = customers.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("All customers already have passwords set."))
            return

        for customer in customers:
            customer.set_password(password)
            customer.save(update_fields=["password"])

        self.stdout.write(
            self.style.SUCCESS(f"Set temporary password for {count} customer(s).")
        )
