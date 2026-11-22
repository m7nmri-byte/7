# m7nmri

موقع شخصي مبني بـ Next.js 16 و Tailwind 4، عربي من اليمين لليسار.

```bash
npm run dev     # تشغيل محلي على http://localhost:3000
npm run build   # بناء الإنتاج
npm run lint    # فحص الكود
```

## إضافة فكرة

ثلاث خطوات، كلها في مكانين فقط:

**١. أنشئ المكوّن** في `ideas/<slug>/view.tsx`:

```tsx
export default function MyIdea() {
  return <div>…</div>;
}
```

**٢ و ٣. سجّلها** في `ideas/index.ts` — سطر في `ideas` وسطر في `views`:

```ts
export const ideas: Idea[] = [
  {
    slug: "my-idea",
    title: "اسم الفكرة",
    summary: "سطر واحد يظهر في الفهرس.",
    status: "seed",
    tags: ["وسم"],
    started: "2026-11",
  },
];

export const views: Record<string, ComponentType> = {
  "my-idea": dynamic(() => import("./my-idea/view")),
};
```

تظهر الفكرة في الفهرس وعلى `/lab/my-idea` فوراً.

## الحالات

| الحالة | المعنى |
|---|---|
| `seed` | بذرة — مجرد بداية |
| `building` | قيد العمل |
| `ripe` | ناضجة |
| `freed` | معزولة إلى مشروع مستقل — أضف `freedUrl` |

## نزع فكرة

احذف مجلد `ideas/<slug>/` والسطرين من `ideas/index.ts`.

وإن أردت إبقاء أثرها في الفهرس بعد نقلها لمشروع مستقل، اجعل حالتها `freed`
وأضف `freedUrl` بدل الحذف.

## البنية

```
app/
  layout.tsx          الجذر — RTL، الخطوط، البيانات الوصفية
  page.tsx            الفهرس
  lab/[slug]/page.tsx صفحة الفكرة الواحدة
  globals.css         الألوان والخطوط
components/           عناصر مشتركة
ideas/
  index.ts            السجل — هنا تُضاف الأفكار وتُنزع
  <slug>/view.tsx     الفكرة نفسها
```

## الخدمات

المفاتيح في `.env` محلياً، وفي Vercel للإنتاج. راجع `SETUP.md`.

| | |
|---|---|
| قاعدة البيانات والمصادقة | Supabase — فرانكفورت |
| الصور والوسائط | Cloudinary |
| الاستضافة | Vercel — fra1 |
