# دليل ربط الموقع بالخدمات

مستودع هذا المشروع: `m7nmri-byte/7`

الترتيب أدناه مقصود: Supabase و Cloudinary أولاً لأن مفاتيحهما تُلصق لاحقاً في Vercel.

---

## قبل أن تبدأ: عزل الحسابات في المتصفح

لوحات Supabase و Vercel و Cloudinary تعمل بجلسات متصفح. لتبقى قادراً على التبديل
بين مشاريعك بلا تسجيل خروج ودخول، أنشئ **ملف مستخدم منفصل في المتصفح** لكل مشروع:

- Chrome/Edge: القائمة ← الملف الشخصي ← إضافة ← سمّه `7`
- سجّل داخل هذا الملف بحساب `m7nmri-byte` وحده

هكذا يبقى كل مشروع في نافذة مستقلة بجلساته الخاصة — نفس مبدأ عزل اعتمادات git
الذي أُعدّ لك في هذا المجلد.

---

## 1) Supabase

1. افتح <https://supabase.com/dashboard> وسجّل الدخول بـ **Continue with GitHub**
   باستخدام حساب `m7nmri-byte`.
2. **New project** ثم:
   - **Name:** اسم موقعك
   - **Database Password:** ولّد كلمة قوية و**احفظها فوراً** — لن تظهر ثانية،
     وهي جزء من روابط الاتصال.
   - **Region:** اختر الأقرب لزوّارك. للسعودية الأفضل عادةً
     `Central EU (Frankfurt)` أو `Middle East (Bahrain)` إن توفّرت.
     (مشروع `zad` عندك في سيدني — بعيد نسبياً.)
3. انتظر اكتمال التجهيز (دقيقتان تقريباً).

### نسخ المفاتيح إلى `.env`

| القيمة في `.env` | أين تجدها في اللوحة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings ← API ← **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings ← API Keys ← المفتاح العام (`anon` أو `publishable`) |
| `SUPABASE_SERVICE_ROLE_KEY` | نفس الصفحة ← المفتاح السري (`service_role` أو `secret`) — اضغط Reveal |
| `DATABASE_URL` | زر **Connect** في الأعلى ← ORMs ← Prisma ← السطر الأول (منفذ 6543) |
| `DIRECT_URL` | نفس النافذة ← السطر الثاني (منفذ 5432) |
| `SUPABASE_PROJECT_REF` | الجزء العشوائي من رابط المشروع في المتصفح |

في `DATABASE_URL` و `DIRECT_URL` استبدل `[YOUR-PASSWORD]` بكلمة قاعدة البيانات
التي حفظتها في الخطوة 2.

> ملاحظة: إن احتجت لاحقاً أداة `supabase` CLI للهجرات، لا تستخدم `supabase login`
> لأنه يحفظ توكناً واحداً لكل الجهاز فيكسر عزل حساباتك. ضع بدلاً منه
> `SUPABASE_ACCESS_TOKEN` في `.env` من
> <https://supabase.com/dashboard/account/tokens>.

---

## 2) Cloudinary

1. افتح <https://cloudinary.com/users/register_free> وأنشئ حساباً.
2. من لوحة التحكم: **Settings ← API Keys**.
3. انسخ إلى `.env`:
   - `CLOUDINARY_CLOUD_NAME` ← **Cloud name**
   - `CLOUDINARY_API_KEY` ← **API Key**
   - `CLOUDINARY_API_SECRET` ← **API Secret** (اضغط العين لإظهاره)
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ← نفس قيمة Cloud name
   - `CLOUDINARY_URL` ← اللوحة تعرضه جاهزاً، أو ركّبه هكذا:
     `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`

Cloudinary لا يحتاج أي تسجيل دخول على الجهاز — مفاتيحه داخل `.env` فقط،
فهو معزول بين مشاريعك بطبيعته.

---

## 3) Vercel

> ⚠ **يتطلب وجود commit واحد على الأقل في المستودع.** Vercel لا يستطيع استيراد
> مستودعاً فارغاً تماماً. ارفع أول commit قبل هذه الخطوة.

1. افتح <https://vercel.com/signup> وسجّل بـ **Continue with GitHub**
   بحساب `m7nmri-byte`.
2. **Add New… ← Project**.
3. إن لم يظهر المستودع: **Adjust GitHub App Permissions** ثم اسمح بالوصول إلى
   `m7nmri-byte/7`.
4. اختر `7` ثم **Import**.
5. قبل الضغط على Deploy، افتح **Environment Variables** وألصق فيها نفس القيم
   من ملف `.env` (عدا `VERCEL_*`). اختر البيئات الثلاث:
   Production و Preview و Development.
6. **Deploy**.

بعدها يصبح كل `git push` إلى الفرع `main` نشراً تلقائياً للإنتاج،
وكل فرع آخر يحصل على رابط معاينة.

> ملاحظة: مثل Supabase، تجنّب `vercel login` لأنه يحفظ توكناً عاماً واحداً.
> إن احتجت الأداة، ضع `VERCEL_TOKEN` في `.env` من
> <https://vercel.com/account/tokens>.

---

## قائمة تحقق

- [ ] مشروع Supabase مُنشأ وكلمة قاعدة البيانات محفوظة
- [ ] مفاتيح Supabase الستة في `.env`
- [ ] حساب Cloudinary ومفاتيحه الأربعة في `.env`
- [ ] أول commit مرفوع إلى GitHub
- [ ] مشروع Vercel مستورد ومتغيّرات البيئة ملصقة فيه
- [ ] `.env` لم يُرفع (محميّ عبر `.gitignore` — تم التحقق ✔)
