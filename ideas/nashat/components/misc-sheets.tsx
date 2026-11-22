"use client";

import { useState } from "react";
import { OptionButton, Sheet, btnPrimary } from "./ui";

/* ---------- تأكيد ---------- */

export function ConfirmSheet({
  title,
  desc,
  confirmLabel = "نعم، احذف نهائيًا",
  onConfirm,
  onClose,
}: {
  title: string;
  desc: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open onClose={onClose} title={title} desc={desc}>
      <button
        onClick={() => {
          onConfirm();
          onClose();
        }}
        className="w-full rounded-xl bg-[#e08a7a] px-4 py-2.5 text-sm font-medium text-[#2b1512] transition-colors hover:brightness-110"
      >
        {confirmLabel}
      </button>
    </Sheet>
  );
}

/* ---------- قائمة الخيارات ---------- */

export function MenuSheet({
  onClose,
  onPrint,
  onExport,
  onImport,
  onClearDay,
  onClearAll,
  onLogout,
}: {
  onClose: () => void;
  onPrint: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearDay: () => void;
  onClearAll: () => void;
  onLogout: () => void;
}) {
  const act = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet open onClose={onClose} title="خيارات">
      <OptionButton icon="⎙" title="طباعة" onClick={act(onPrint)} />
      <OptionButton icon="↓" title="استيراد" onClick={act(onImport)} />
      <OptionButton icon="↑" title="تصدير" onClick={act(onExport)} />
      <OptionButton icon="✕" title="مسح سجل هذا اليوم" danger onClick={act(onClearDay)} />
      <OptionButton icon="✕" title="مسح جميع السجلات" danger onClick={act(onClearAll)} />
      <OptionButton icon="→" title="تسجيل الخروج" onClick={act(onLogout)} />
    </Sheet>
  );
}

/* ---------- تصدير ---------- */

export type ExportKind = "txt" | "csv" | "jsonDay" | "jsonAll";

export function ExportSheet({
  dayLabel,
  onClose,
  onExport,
}: {
  dayLabel: string;
  onClose: () => void;
  onExport: (kind: ExportKind) => void;
}) {
  const act = (k: ExportKind) => () => {
    onExport(k);
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="تصدير" desc={`اليوم المعروض: ${dayLabel}`}>
      <OptionButton icon="¶" title="تقرير نصّي" sub="ملخّص مقروء لهذا اليوم" onClick={act("txt")} />
      <OptionButton icon="▦" title="جدول CSV" sub="جلسات هذا اليوم — يفتح في Excel" onClick={act("csv")} />
      <OptionButton icon="{}" title="JSON لهذا اليوم" sub="بيانات اليوم كاملة" onClick={act("jsonDay")} />
      <OptionButton icon="⛁" title="JSON لكل البيانات" sub="نسخة احتياطية كاملة" onClick={act("jsonAll")} />
    </Sheet>
  );
}

/* ---------- استيراد ---------- */

export function ImportSheet({
  onClose,
  onFile,
}: {
  onClose: () => void;
  onFile: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Sheet
      open
      onClose={onClose}
      title="استيراد بيانات"
      desc="اختر ملف JSON صُدِّر من نشاط — لن يُحذف شيء من بياناتك الحالية"
    >
      <input
        type="file"
        accept="application/json,.json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-xs text-muted file:me-3 file:rounded-lg file:border file:border-edge file:bg-paper file:px-3 file:py-2 file:text-xs file:text-ink"
      />
      <button
        disabled={!file}
        onClick={() => {
          if (file) onFile(file);
          onClose();
        }}
        className={`${btnPrimary} w-full`}
      >
        استيراد
      </button>
    </Sheet>
  );
}
