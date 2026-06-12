<p align="center">
  <img src="https://img.shields.io/badge/🚀-Tujjar-FF6B35?style=for-the-badge&labelColor=1a1a2e" alt="Tujjar Banner"/>
</p>

<h1 align="center">تججر — منصة سوق SaaS مدعومة بالذكاء الاصطناعي</h1>

<p align="center">
  <strong>البديل المفتوح المصدر لـ Shopify مع الذكاء الاصطناعي، ومحرر السحب والإفلات، والبنية متعددة المستأجرين.</strong><br/>
  ابنِ وخصّص ووسّع سوقك الإلكتروني — استضافة ذاتية أو سحابية.
</p>

<p align="center">
  <a href="https://github.com/dev-taherm/Tujjar/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"/>
  </a>
  <a href="https://www.python.org/downloads/">
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+"/>
  </a>
  <a href="https://www.djangoproject.com/">
    <img src="https://img.shields.io/badge/Django-4.2+-092E20.svg?style=for-the-badge&logo=django&logoColor=white" alt="Django 4.2+"/>
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16-000000.svg?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16"/>
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5"/>
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16"/>
  </a>
  <a href="https://www.docker.com/">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  </a>
  <a href="https://github.com/dev-taherm/Tujjar/pulls">
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"/>
  </a>
</p>

<p align="center">
  <a href="#-بداية-سريعة">بداية سريعة</a> •
  <a href="#-المميزات">المميزات</a> •
  <a href="#-التقنيات">التقنيات</a> •
  <a href="#-مرجع-الـ-api">توثيق API</a> •
  <a href="#-المساهمة">المساهمة</a> •
  <a href="README.md">English</a>
</p>

---

## لماذا تججر؟

تججر هي **منصة سوق متكاملة مستضافة ذاتياً** مبنية بتقنيات حديثة. على عكس حلول SaaS فقط، تمنحك تججر **التحكم الكامل** في بياناتك وبنية تحتيتك وتخصيصك.

- **مفتوح المصدر** — ترخيص MIT. امتلك منصتك، لا تقييد من الموردين.
- **مدمج بالذكاء الاصطناعي** — تكامل ذكاء اصطناعي مع 6+ مزودين (OpenAI, Anthropic, Gemini, Groq, Ollama, OpenRouter). ولّد أوصاف المنتجات واحصل على رؤى المتجر وتواصل مع مساعدي الذكاء الاصطناعي.
- **محرر السحب والإفلات** — محرر مرئي مع 16 نوع قسم، والتراجع/الإعادة، ومعاينة فورية. لا يحتاج كود.
- **متعدد المستأجرين** — عزل قائم على المنظمات. شغّل نسخة واحدة، قدّم عدة متاجر.
- **مستضافة ذاتياً** — نشر بأمر واحد عبر Docker Compose. بياناتك تبقى على خوادمك.
- **قابل للتوسع** — مبني بـ Django + Next.js. أضف أي ميزة، تكامل مع أي خدمة.

---

## المميزات

### 🤖 تكامل الذكاء الاصطناعي
- 6 مزودين للذكاء الاصطناعي: OpenAI, Anthropic, Google Gemini, Groq, Ollama (محلي), OpenRouter
- توليد أوصاف المنتجات بالذكاء الاصطناعي
- مساعد ذكاء اصطناعي لإدارة المتجر
- توليد المحتوى (منشورات المدونة، نسخ التسويق)
- تبديل تلقائي بين المزودين وتحسين التكلفة

### 🏪 إدارة المتجر
- دعم متاجر متعددة لكل منظمة
- ربط نطاقات مخصصة
- إعدادات المتجر (الاسم، الوصف، الشعار، العملة)
- إدارة حالة المتجر (نشط/غير نشط)

### 📄 محرر المرئي (صفحة البناء)
- محرر أقسام قائم على السحب والإفلات
- 16 نوع قسم (بطل، منتجات، ميزات، شهادات، أسئلة شائعة، إلخ)
- تاريخ التراجع/الإعادة (20+ خطوة)
- معاينة فورية مع وراثة السمة
- إصدارات الصفحة وسير عمل النشر
- 3سمات مدمجة ( بسيط، عصري، فاخر)

### 📦 نظام المنتجات
- متغيرات المنتج بسمات مخصصة
- معرض صور (حتى 10 صور لكل منتج)
- التصنيفات والمجموعات
- تتبع المخزون
- بحث المنتجات مع فهرسة النص الكامل
- توصيات المنتجات عبر الذكاء الاصطناعي

### 🛒 الطلبات والسلة
- سلة تسوق مع تحديثات فورية
- سير عمل الدفع مع إدارة العناوين
- سجل الطلبات وتتبع الحالة
- إدارة العملاء
- دعم الدفع كضيف

### 📊 التحليلات والبحث
- لوحة تحليلات فورية
- رسوم بيانية للإيرادات والطلبات والزوار
- إحصائيات يومية مجمّعة
- بحث نص كامل مع تشابه الثلاثيات
- تحليلات البحث والاستعلامات الرائجة

### 🔔 الإشعارات
- نظام إشعارات داخل التطبيق
- تفضيلات الإشعارات لكل مستخدم
- تحديد كمقروء / تحديد الكل كمقروء
- عدد غير المقروءات الفوري
- جرس الإشعارات في رأس لوحة التحكم

### 💳 الفواتير والاشتراكات
- خطط الاشتراك (مجاني، أساسي، احترافي، مؤسسي)
- إدارة الفواتير
- تتبع طرق الدفع
- جاهز لتكامل Stripe
- دعم الفواتير القائمة على الاستخدام

### 🏬 سوق الإضافات
- قوائم الإضافات والسمات
- تقييمات ومراجعات المستخدمين
- تصفح وتصفية حسب التصفيات
- تثبيت/إلغاء تثبيت عناصر السوق
- نظام امتداد ص友好 للمطورين

---

## التقنيات

| الطبقة | التقنية | الغرض |
|--------|---------|-------|
| **الخلفية** | Django 4.2 + Django REST Framework | API المصادقة، منطق الأعمال |
| **الواجهة** | Next.js 16 + React 19 + TypeScript | واجهة لوحة التحكم، واجهة المتجر، محرر الصفحة |
| **قاعدة البيانات** | PostgreSQL 16 + pgvector | قاعدة البيانات الرئيسية، بحث المتجهات للذكاء الاصطناعي |
| **التخزين المؤقت** | Redis 7 | تخزين مؤقت للجلسات، broker Celery |
| **قائمة المهام** | Celery + django-celery-beat | المهام الخلفية، المهام المجدولة |
| **التخزين** | MinIO / AWS S3 | تخزين ملفات الوسائط (متوافق مع S3) |
| **الذكاء الاصطناعي** | LiteLLM + LangChain | تجريد مزودي الذكاء الاصطناعي المتعددين |
| **الواجهة** | Tailwind CSS 4 + Radix UI | نظام التصميم، مكونات سهلة الوصول |
| **النماذج** | React Hook Form + Zod | التحقق من النماذج، قواعد schemas متوافقة مع TypeScript |
| **الحالة** | Zustand + React Query | إدارة حالة العميل وحالة الخادم |
| **السحب** | dnd-kit | محرر السحب والإفلات |
| **المصادقة** | JWT (SimpleJWT) | مصادقة قائمة على الرمز المميز |
| **التوثيق** | drf-spectacular | توثيق OpenAPI/Swagger |

---

## بداية سريعة

### Docker (موصى به)

```bash
# استنساخ المستودع
git clone https://github.com/dev-taherm/Tujjar.git
cd Tujjar

# نسخ ملف البيئة
cp .env.example .env
# عدّل .env واضبط DJANGO_SECRET_KEY

# تشغيل جميع الخدمات
docker compose up -d

# الوصول للتطبيق
# الواجهة:     http://localhost:3000
# الخلفية:     http://localhost:8000
# توثيق API:  http://localhost:8000/api/docs/
# MinIO:       http://localhost:9001
```

### التطوير المحلي

```bash
# استنساخ المستودع
git clone https://github.com/dev-taherm/Tujjar.git
cd Tujjar

# إعداد الخلفية
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# إنشاء .env بمفتاح DJANGO_SECRET_KEY (مطلوب)
echo "DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')" > .env

# تشغيل الهجرات وبدء الخلفية
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# إعداد الواجهة (طرفية جديدة)
cd frontend
pnpm install
pnpm dev
```

### تشغيل الاختبارات

```bash
# اختبارات الخلفية
cd backend
DJANGO_SETTINGS_MODULE=config.settings.development python -m pytest -v

# اختبارات الواجهة
cd frontend
pnpm test:run
```

### بيانات الاعتماد الافتراضية

| الحساب | البريد الإلكتروني | كلمة المرور |
|--------|-------------------|-------------|
| **المدير** | admin@tujjar.com | admin123 |

> **ملاحظة**: أنشئ حساباً جديداً من `/register` للوصول كمستخدم عادي.

---

## هيكل المشروع

```
Tujjar/
├── backend/                    # الخلفية Django
│   ├── apps/                   # 19 تطبيق Django معياري
│   │   ├── ai/                 # إدارة مزودي الذكاء الاصطناعي والدردشة
│   │   ├── analytics/          # الأحداث، إحصائيات لوحة التحكم
│   │   ├── audit/              # تسجيل المراجعة
│   │   ├── authentication/     # مصادقة JWT، التسجيل
│   │   ├── billing/            # الخطط، الاشتراكات، الفواتير
│   │   ├── core/               # الأدوات المشتركة
│   │   ├── customers/          # إدارة العملاء
│   │   ├── marketplace/        # سوق الإضافات
│   │   ├── media/              # مكتبة الوسائط والتخزين
│   │   ├── notifications/      # نظام الإشعارات
│   │   ├── orders/             # الطلبات، السلة، الدفع
│   │   ├── organizations/      # المنظمات متعددة المستأجرين
│   │   ├── pages/              # محرر الصفحة والإصدارات
│   │   ├── platform/           # إدارة المنصة
│   │   ├── products/           # المنتجات، المتغيرات، التصنيفات
│   │   ├── search/             # البحث النص الكامل
│   │   ├── storefront/         # API واجهة المتجر العامة
│   │   ├── stores/             # إدارة المتاجر
│   │   └── themes/             # نظام السمات
│   ├── config/                 # إعدادات Django
│   ├── conftest.py             # fixtures لـ pytest
│   ├── tests/                  # مجموعة الاختبارات (71 اختبار backend)
│   └── pyproject.toml          # تبعيات Python
├── frontend/                   # واجهة Next.js
│   ├── src/
│   │   ├── api/                # عميل API والخطافات (مقسّم حسب النطاق)
│   │   ├── app/                # صفحات App Router
│   │   │   ├── (auth)/         # تسجيل الدخول، التسجيل
│   │   │   ├── (dashboard)/    # صفحات لوحة التحكم
│   │   │   ├── admin/          # لوحة تحكم إدارة المنصة
│   │   │   └── shop/           # صفحات واجهة المتجر
│   │   ├── features/           # وحدات الميزات (20+)
│   │   ├── shared/             # المكونات المشتركة، الأنواع، الأدوات
│   │   └── stores/             # متاجر Zustand
│   └── package.json            # تبعيات الواجهة
├── docker/                     # إعدادات Docker
├── docker-compose.yml          # إعداد Docker Compose (تطوير)
├── docker-compose.prod.yml     # إعداد Docker Compose (إنتاج)
├── Makefile                    # أوامر التطوير
└── .env.example                # قالب متغيرات البيئة
```

---

## مرجع الـ API

تججر توفر **75+ نقطة نهاية REST API** مع توثيق OpenAPI مُولّد تلقائياً.

### المصادقة
| الطريقة | النهاية | الوصف |
|---------|---------|-------|
| POST | `/api/v1/auth/login/` | تسجيل الدخول بالبريد/كلمة المرور |
| POST | `/api/v1/auth/register/` | إنشاء حساب جديد |
| POST | `/api/v1/auth/refresh/` | تحديث رمز JWT |
| GET | `/api/v1/auth/profile/` | الحصول على ملف المستخدم الحالي |

### المنتجات
| الطريقة | النهاية | الوصف |
|---------|---------|-------|
| GET | `/api/v1/products/` | عرض المنتجات |
| POST | `/api/v1/products/` | إنشاء منتج |
| GET | `/api/v1/products/{id}/` | تفاصيل المنتج |
| GET | `/api/v1/products/{id}/variants/` | عرض المتغيرات |
| GET | `/api/v1/products/{id}/images/` | عرض الصور |

### الطلبات
| الطريقة | النهاية | الوصف |
|---------|---------|-------|
| GET | `/api/v1/orders/` | عرض الطلبات |
| POST | `/api/v1/orders/` | إنشاء طلب |
| GET | `/api/v1/orders/{id}/` | تفاصيل الطلب |

### الصفحات
| الطريقة | النهاية | الوصف |
|---------|---------|-------|
| GET | `/api/v1/pages/` | عرض الصفحات |
| POST | `/api/v1/pages/` | إنشاء صفحة |
| POST | `/api/v1/pages/{id}/publish/` | نشر الصفحة |
| GET | `/api/v1/pages/{id}/versions/` | عرض الإصدارات |

### الذكاء الاصطناعي
| الطريقة | النهاية | الوصف |
|---------|---------|-------|
| GET | `/api/v1/ai/providers/` | عرض مزودي الذكاء الاصطناعي |
| POST | `/api/v1/ai/generate/` | توليد محتوى |
| POST | `/api/v1/ai/generate-product/` | توليد منتج بالذكاء الاصطناعي |
| POST | `/api/v1/ai/chat/{id}/message/` | دردشة مع مساعد الذكاء الاصطناعي |

> توثيق API الكامل متاح على `/api/docs/` (واجهة Swagger) أو `/api/schema/` (OpenAPI JSON).

---

## مزودو الذكاء الاصطناعي

تججر تدعم **6 مزودين للذكاء الاصطناعي** مع تبديل تلقائي:

| المزود | النموذج | حالة الاستخدام | التكلفة |
|--------|---------|---------------|---------|
| **OpenAI** | GPT-4o, GPT-4o-mini | توليد المحتوى، الدردشة | دفع حسب الاستخدام |
| **Anthropic** | Claude 3.5 Sonnet | التحليل، المحتوى الطويل | دفع حسب الاستخدام |
| **Google Gemini** | Gemini Pro | متعدد الوسائط، استنتاج سريع | طبقة مجانية متاحة |
| **Groq** | LLaMA 3 | استنتاج فائق السرعة | طبقة مجانية متاحة |
| **Ollama** | LLaMA, Mistral, إلخ | محلي، خاص، مجاني | مجاني (مستضاف ذاتياً) |
| **OpenRouter** | متعدد النماذج | مجمّع، أفضل سعر | دفع حسب الاستخدام |

---

## متغيرات البيئة

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `DJANGO_SECRET_KEY` | مفتاح Django السري | (مطلوب) |
| `DJANGO_DEBUG` | وضع التطوير | `True` |
| `DJANGO_SETTINGS_MODULE` | وحدة إعدادات Django | `config.settings.development` |
| `POSTGRES_DB` | اسم قاعدة البيانات | `tujjar` |
| `POSTGRES_USER` | مستخدم قاعدة البيانات | `tujjar` |
| `POSTGRES_PASSWORD` | كلمة مرور قاعدة البيانات | `tujjar` |
| `REDIS_URL` | رابط اتصال Redis | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | رابط broker Celery | `redis://redis:6379/1` |
| `STORE_DOMAIN` | نطاق المتجر للنطاقات الفرعية | `tujjar.com` |
| `FRONTEND_URL` | رابط الواجهة الأمامية للروابط | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | مصادر CORS المسموح بها | `http://localhost:3000` |
| `MINIO_ENDPOINT` | نقطة نهاية MinIO | `http://minio:9000` |
| `MINIO_ACCESS_KEY` | مفتاح وصول MinIO | `minioadmin` |
| `MINIO_SECRET_KEY` | مفتاح سر MinIO | `minioadmin` |
| `OPENAI_API_KEY` | مفتاح OpenAI API | (اختياري) |
| `ANTHROPIC_API_KEY` | مفتاح Anthropic API | (اختياري) |
| `GOOGLE_API_KEY` | مفتاح Google Gemini | (اختياري) |
| `GROQ_API_KEY` | مفتاح Groq API | (اختياري) |
| `OPENROUTER_API_KEY` | مفتاح OpenRouter API | (اختياري) |
| `STRIPE_SECRET_KEY` | مفتاح Stripe السري | (اختياري) |
| `STRIPE_PUBLISHABLE_KEY` | مفتاح Stripe للنشر | (اختياري) |

> راجع `.env.example` للقائمة الكاملة مع الأوصاف.

---

## المساهمة

المساهمات مرحب بها! إليك كيفية البدء:

1. **نص** المستودع
2. **استنسخ** نسختك: `git clone https://github.com/your-username/Tujjar.git`
3. **أنشئ** فرع ميزة: `git checkout -b feature/amazing-feature`
4. **أجرِ** التغييرات
5. **شغّل** الاختبارات: `make test`
6. **شغّل** المدقق: `make lint`
7. **ثبّت** تغييراتك: `git commit -m "feat: add amazing feature"`
8. **ادفع** إلى نسختك: `git push origin feature/amazing-feature`
9. **افتح** طلب سحب

### إرشادات التطوير

- اتبع نمط الكود الحالي
- اكتب اختبارات للميزات الجديدة
- حدّث التوثيق إذا لزم الأمر
- استخدم الحجوزات التقليدية (`feat:`, `fix:`, `docs:`, `refactor:`, إلخ)

---

## خارطة الطريق

- [ ] تكامل معالجة مدفوعات Stripe
- [ ] قوالب إشعارات البريد الإلكتروني
- [ ] التحكم في الوصول القائم على الأدوار المتقدم (RBAC)
- [ ] دعم متعدد اللغات (i18n)
- [ ] نظام Webhook لتكاملات الأطراف الثالثة
- [ ] تحليلات متقدمة مع تقارير مخصصة
- [ ] تطبيق جوال (React Native)
- [ ] سوق الإضافات والامتدادات

---

## الترخيص

هذا المشروع مرخّص تحت **رخصة MIT** — راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## الاعترافات

- [Django](https://www.djangoproject.com/) — إطار العمل
- [Next.js](https://nextjs.org/) — إطار React
- [Tailwind CSS](https://tailwindcss.com/) — إطار CSS الأدوات الأولية
- [LiteLLM](https://github.com/BerriAI/litellm) — بوابة مزودي الذكاء الاصطناعي المتعددين
- [dnd-kit](https://dndkit.com/) — أدوات السحب والإفلات
- [Radix UI](https://www.radix-ui.com/) — مبادئ مكونات سهلة الوصول

---

<p align="center">
  صُنع بـ ❤️ بواسطة <a href="https://github.com/dev-taherm">طاهر محرم</a>
</p>

<p align="center">
  إذا وجدت تججر مفيدة، يرجى إعطاءها ⭐ على GitHub — يساعد الآخرين في اكتشاف المشروع!
</p>
