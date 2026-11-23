export type SectionKey =
  | "home"
  | "tasks"
  | "requests"
  | "meetings"
  | "members"
  | "attendance"
  | "leaves"
  | "beneficiaries"
  | "programs"
  | "donors"
  | "grants"
  | "ledger"
  | "mail"
  | "policies"
  | "documents"
  | "news"
  | "surveys"
  | "org"
  | "structure"
  | "chains";

export type NavItem = {
  key: SectionKey;
  label: string;
  /** عنوان الشاشة وسطرها التعريفي */
  title: string;
  subtitle: string;
  /** مسار SVG في مربّع 24×24 */
  icon: string;
};

export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "",
    items: [
      {
        key: "home",
        label: "الرئيسة",
        title: "الرئيسة",
        subtitle: "ما ينتظرك اليوم",
        icon: "M4 11.5 12 4l8 7.5M6 10v10h12V10",
      },
    ],
  },
  {
    label: "العمل",
    items: [
      {
        key: "tasks",
        label: "المهام",
        title: "المهام",
        subtitle: "ما أُسند ومتى يُسلَّم",
        icon: "M9 5h10M9 12h10M9 19h10M4.5 5l1.2 1.2L8 4M4.5 12l1.2 1.2L8 11M4.5 19l1.2 1.2L8 18",
      },
      {
        key: "requests",
        label: "الطلبات",
        title: "الطلبات والاعتماد",
        subtitle: "ما يمرّ على سلسلة المعتمِدين",
        icon: "M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16.5h3",
      },
      {
        key: "meetings",
        label: "الاجتماعات",
        title: "الاجتماعات",
        subtitle: "جداول الأعمال والمحاضر والقرارات",
        icon: "M8 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM16 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19v-1.5A3.5 3.5 0 0 1 6.5 14h3A3.5 3.5 0 0 1 13 17.5V19M14.5 14h3a3.5 3.5 0 0 1 3.5 3.5V19",
      },
    ],
  },
  {
    label: "الفريق",
    items: [
      {
        key: "members",
        label: "الأعضاء",
        title: "فريق الجمعية",
        subtitle: "من هم، وأين، ولمن يرفعون",
        icon: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5a4.5 4.5 0 0 1 4.5 4.5V20",
      },
      {
        key: "attendance",
        label: "الحضور",
        title: "الحضور والانصراف",
        subtitle: "البصمة بالموقع ونطاقه",
        icon: "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6ZM12 7.6V12l3.2 2",
      },
      {
        key: "leaves",
        label: "الإجازات",
        title: "الإجازات",
        subtitle: "الطلبات والاعتماد والأرصدة",
        icon: "M7 4v3M17 4v3M4 9h16M4 7.5h16V20H4zM8.5 13h3M8.5 16.5h7",
      },
    ],
  },
  {
    label: "الأثر",
    items: [
      {
        key: "beneficiaries",
        label: "المستفيدون",
        title: "المستفيدون",
        subtitle: "الملفّات وما صُرف لكلّ واحد",
        icon: "M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z",
      },
      {
        key: "programs",
        label: "البرامج",
        title: "البرامج",
        subtitle: "الميزانية والمصروف والمستهدف",
        icon: "M4 19h16M6.5 19V9M11.5 19V5M16.5 19v-7",
      },
    ],
  },
  {
    label: "الموارد",
    items: [
      {
        key: "donors",
        label: "المانحون",
        title: "المانحون",
        subtitle: "الجهات التي تموّل البرامج",
        icon: "M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 7.5 3.3c0 5.4-7.5 10-7.5 10Z",
      },
      {
        key: "grants",
        label: "المنح",
        title: "المنح",
        subtitle: "من الفكرة إلى التحصيل",
        icon: "M4 7.5h16v11H4zM4 11h16M8 4v3.5M16 4v3.5",
      },
      {
        key: "ledger",
        label: "المالية",
        title: "السجلّ المالي",
        subtitle: "كل إيراد ومصروف بسنده",
        icon: "M12 4v16M8.5 7.5h5.2a2.2 2.2 0 0 1 0 4.4H9.5a2.2 2.2 0 0 0 0 4.4h5.4",
      },
    ],
  },
  {
    label: "السجلّ",
    items: [
      {
        key: "mail",
        label: "المخاطبات",
        title: "المخاطبات",
        subtitle: "الوارد والصادر والداخلي بترقيم واحد",
        icon: "M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6",
      },
      {
        key: "policies",
        label: "السياسات",
        title: "السياسات واللوائح",
        subtitle: "المعتمد ومواعيد المراجعة",
        icon: "M7 3.5h7l4 4v13H7zM14 3.5v4h4M10 12h5M10 15.5h5",
      },
      {
        key: "documents",
        label: "المستندات",
        title: "مكتبة المستندات",
        subtitle: "مكان واحد لكل ملفّ",
        icon: "M4 7.5h5.5l2 2.5H20V19H4z",
      },
      {
        key: "news",
        label: "الأخبار",
        title: "الأخبار والإنجازات",
        subtitle: "ما يُعلَن للفريق وما تحقّق",
        icon: "M5 5.5h14v13H5zM8 9h8M8 12.5h8M8 16h5",
      },
      {
        key: "surveys",
        label: "الاستبيانات",
        title: "الاستبيانات",
        subtitle: "اسأل الفريق أو المستفيدين، واقرأ التفريغ",
        icon: "M7 4.5h10v15H7zM10 9h4M10 12.5h4M10 16h2",
      },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      {
        key: "org",
        label: "الهوية",
        title: "هوية الجمعية",
        subtitle: "الاسم والترخيص والرسالة والسنة المالية",
        icon: "M4 20V8l8-4 8 4v12M9.5 20v-6h5v6",
      },
      {
        key: "structure",
        label: "البنية",
        title: "البنية والدوام",
        subtitle: "الإدارات والورديات والمواقع",
        icon: "M9.5 4h5v4h-5zM3.5 16h5v4h-5zM15.5 16h5v4h-5zM12 8v4M6 16v-2h12v2",
      },
      {
        key: "chains",
        label: "سلاسل الاعتماد",
        title: "سلاسل الاعتماد",
        subtitle: "من يعتمد، وبأي ترتيب",
        icon: "M12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 22.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 5.5V10M12 14v4.5",
      },
    ],
  },
];

const FLAT = NAV.flatMap((g) => g.items);

export const navItem = (key: SectionKey): NavItem =>
  FLAT.find((i) => i.key === key) ?? FLAT[0];

export const isSection = (s: string): s is SectionKey => FLAT.some((i) => i.key === s);
