/** فئة المهمة — تُلوّن الرسوم وتُجمَّع في إحصاء الفئات */
export type Category = "work" | "rest" | "waste";

/** حالة المهمة ككل */
export type TaskStatus = "active" | "completed" | "interrupted";

/** حالة جلسة بعينها داخل المهمة */
export type SegStatus = "ongoing" | "interrupted" | "done";

/** جلسة عمل واحدة. end فارغة ما دامت الجلسة جارية. */
export type Segment = {
  start: string;
  end: string | null;
  /** يوم البداية بصيغة YYYY-MM-DD — مفتاح التجميع اليومي */
  day: string;
};

/** خطوة فرعية تُسجَّل تحت المهمة الجارية */
export type Step = { text: string; day: string };

export type Task = {
  id: string;
  name: string;
  status: TaskStatus;
  category: Category;
  /** مهمة معلّقة صرفها صاحبها فلا تظهر في الحلقات المفتوحة */
  dismissed?: boolean;
  segments: Segment[];
  steps: Step[];
};

/** مذكّرة سريعة: اسم يُنتظر بدؤه لاحقاً */
export type Memo = { id: string; text: string };

export type State = { tasks: Task[]; memo: Memo[] };

export const MAX_PARALLEL = 2;

/** مسمّيات الفئات — مصدر واحد، وكانت مكتوبة في ثلاثة مواضع */
export const CATEGORY_LABEL: Record<Category, string> = {
  work: "عمل",
  rest: "راحة",
  waste: "هدر",
};

export const CATEGORIES: { key: Category; label: string }[] = (
  ["work", "rest", "waste"] as Category[]
).map((key) => ({ key, label: CATEGORY_LABEL[key] }));

/** حدّا التركيز بالدقائق: عميق فأكثر، ومتوسط فأكثر */
export const FOCUS_DEEP = 25;
export const FOCUS_MID = 10;
