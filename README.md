# SAMI DEVELOPER V9

> **V9:** تحسين SEO كامل (محتوى مرسوم على السيرفر، نسخة إنجليزية `/en/`، صفحات للمقالات والمشاريع، بيانات منظّمة، صورة مشاركة، sitemap) وإصلاحات تصميم. التفاصيل في `docs/SEO_AR.md`.

إصدار للتجربة قبل الإطلاق؛ يعمل بـ FastAPI وSQLite على المنفذ الداخلي 8000. لم يُنشر هذا الإصدار على أي دومين ولم يتم تعديل main أو الموقع الأساسي.

## ابدأ هنا

1. اقرأ `docs/DEPLOY_AR.md` قبل ربط أي بيانات حالية.
2. انسخ `.env.example` إلى `.env`، ثم ضع ADMIN_TOKEN عشوائيًا بطول 32 حرفًا على الأقل.
3. للتجربة المحلية:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

4. افتح http://localhost:8000 ولوحة الإدارة http://localhost:8000/admin.
5. سجّل دخول الإدارة باستخدام ADMIN_TOKEN؛ لا يوجد حساب للزائر.
6. أضف المحتوى بالعربية والإنجليزية من لوحة الإدارة. قاعدة جديدة لا تحتوي مشاريع أو مقالات وهمية؛ بيانات V7 تُحفظ عند ربط نسخة قاعدة البيانات.
7. إعداد n8n اختياري لواجهة الموقع، وإلزامي للمساعد والتحليل وPlayground. لا تظهر نتائج AI مصطنعة إذا لم يتصل.

## الملفات

- `app.py`: التطبيق الفعلي، API، الحماية، إدارة المحتوى والترحيل الإضافي.
- `seo.py`: رسم الصفحات على السيرفر (عربي/إنجليزي)، صفحات المقالات والمشاريع، البيانات المنظّمة وsitemap.
- `main.py`: إعادة تصدير التطبيق نفسه لتوحيد مسارات التشغيل.
- `static/`: الواجهة العامة ولوحة الإدارة؛ دون build أو CDN JavaScript.
- `scripts/backup.py`: نسخة SQLite متسقة مع الصور والمرفقات.
- `tests/`: اختبارات التطبيق الفعلي.
- `docs/DEPLOY_AR.md`: التشغيل والنشر والنسخ والرجوع الآمن.
- `docs/CHANGELOG_AR.md`: المراجعة والتغييرات.
- `docs/TEST_REPORT_AR.md`: ما اختُبر فعليًا وحدود التحقق.
- `legacy_v7/`: مرجع الملفات القديمة غير النشطة، مستبعد من Docker.

## التطوير بدون Docker

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell بدل الأمر السابق:
# .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

اضبط متغيرات البيئة في الطرفية (ملف `.env` يُقرأ تلقائيًا عبر Compose فقط):

```bash
export DATABASE_PATH=./data/site.db
export HTTPS_ONLY=false
export ADMIN_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
uvicorn app:app --host 127.0.0.1 --port 8000
```

احفظ الرمز المولّد لديك قبل بدء التشغيل. في PowerShell استخدم `$env:ADMIN_TOKEN` و`$env:DATABASE_PATH` و`$env:HTTPS_ONLY`.

```bash
python -m pytest tests -q
```

راجع تقرير الاختبارات للأرقام والقيود الفعلية. نسخة الترحيل تحفظ الأعمدة والجداول القديمة؛ لا تحذف البيانات ولا تعتمد على `SEED_DEMO`.
