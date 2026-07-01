from __future__ import annotations

import pytest

from apps.templates.models import Template, TemplateVersion

pytestmark = pytest.mark.django_db


class TestTemplateModel:
    def test_str(self):
        t = Template(name="Fashion Store", version="2.1.0")
        assert str(t) == "Fashion Store v2.1.0"

    def test_default_version(self):
        t = Template(name="Test", slug="test", config={"colors": {"primary": "#000"}})
        assert t.version == "1.0.0"

    def test_default_fields(self):
        t = Template(name="Test", slug="test-2")
        assert t.is_system is False
        assert t.is_premium is False
        assert t.config == {}
        assert t.pages == []
        assert t.navigation == {}
        assert t.footer == {}


class TestTemplateVersionModel:
    def test_str(self):
        t = Template.objects.create(name="My Store", slug="my-store", config={"a": 1})
        v = TemplateVersion(template=t, version="1.0.0", note="First")
        assert str(v) == "My Store v1.0.0"

    def test_creation(self):
        t = Template.objects.create(name="V Store", slug="v-store", config={"a": 1})
        v = TemplateVersion.objects.create(
            template=t,
            version="1.0.0",
            note="Snapshot",
            config={"a": 2},
            pages=[{"title": "Home"}],
        )
        assert v.config == {"a": 2}
        assert v.pages == [{"title": "Home"}]
        assert v.template == t

    def test_cascade_delete(self):
        t = Template.objects.create(name="Del Store", slug="del-store", config={"a": 1})
        TemplateVersion.objects.create(template=t, version="1.0.0")
        TemplateVersion.objects.create(template=t, version="1.0.1")
        assert TemplateVersion.objects.filter(template=t).count() == 2
        t_id = t.pk
        t.delete()
        assert TemplateVersion.objects.filter(template_id=t_id).count() == 0

    def test_ordering(self):
        t = Template.objects.create(name="Order Store", slug="order-store", config={"a": 1})
        TemplateVersion.objects.create(template=t, version="1.0.0")
        v2 = TemplateVersion.objects.create(template=t, version="1.0.1")
        versions = list(t.versions.all())
        assert versions[0].pk == v2.pk
