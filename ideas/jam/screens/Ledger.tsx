"use client";

import { useMemo, useState } from "react";
import type { EntryKind, Grant, LedgerEntry, Program, Settings } from "../types";
import { remove, save } from "../db";
import { fmtDate, money } from "../format";
import { Empty, Modal, Stat, jField, jGhost, jPrimary } from "../ui";
import { FileField } from "../FileField";
import {
  PERIOD_LABEL,
  type Period,
  categoriesFor,
  monthlyFlow,
  periodStart,
  runningBalance,
  toCsv,
  totalsOf,
} from "./ledger-core";

export function Ledger({
  entries,
  programs,
  grants,
  settings,
  me,
  onChanged,
}: {
  entries: LedgerEntry[];
  programs: Program[];
  grants: Grant[];
  settings: Settings | null;
  me: string | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<LedgerEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [kind, setKind] = useState<EntryKind | "all">("all");
  const [programId, setProgramId] = useState("");

  const programName = (id: string | null) =>
    id ? (programs.find((p) => p.id === id)?.name ?? "—") : "—";

  const from = useMemo(
    () => periodStart(period, settings?.fiscal_start ?? 1, new Date()),
    [period, settings?.fiscal_start],
  );

  const shown = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!from || e.entry_date >= from) &&
          (kind === "all" || e.kind === kind) &&
          (!programId || e.program_id === programId),
      ),
    [entries, from, kind, programId],
  );

  const totals = useMemo(() => totalsOf(shown), [shown]);
  /** الرصيد تراكمي على كل القيود، لا على المعروض فقط — وإلّا كان رقمًا كاذبًا */
  const balance = useMemo(() => runningBalance(entries), [entries]);
  const flow = useMemo(() => monthlyFlow(shown), [shown]);
  const peak = useMemo(
    () => Math.max(1, ...flow.map((f) => Math.max(f.income, f.expense))),
    [flow],
  );

  const exportCsv = () => {
    const blob = new Blob(["﻿" + toCsv(shown, programName)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jam-ledger-" + (from ?? "all") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (!draft?.category || !draft.amount) return;
    setError(null);
    try {
      await save("jam_ledger", {
        ...(draft.id ? { id: draft.id } : {}),
        kind: draft.kind ?? "expense",
        amount: Number(draft.amount),
        category: draft.category,
        description: draft.description ?? null,
        entry_date: draft.entry_date || new Date().toISOString().slice(0, 10),
        program_id: draft.program_id ?? null,
        grant_id: draft.grant_id ?? null,
        request_id: draft.request_id ?? null,
        attachment_url: draft.attachment_url ?? null,
        created_by: draft.created_by ?? me,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const openNew = (k: EntryKind) =>
    setDraft({
      kind: k,
      category: categoriesFor(k)[0],
      entry_date: new Date().toISOString().slice(0, 10),
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="الإيرادات" value={money(totals.income)} tone="var(--j-ok)" />
        <Stat label="المصروفات" value={money(totals.expense)} tone="var(--j-danger)" />
        <Stat
          label="الصافي"
          value={money(totals.net)}
          tone={totals.net < 0 ? "var(--j-danger)" : "var(--j-brand)"}
        />
        <Stat label="عدد القيود" value={shown.length} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (period === p ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {(["all", "income", "expense"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (kind === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {k === "all" ? "الكل" : k === "income" ? "إيراد" : "مصروف"}
            </button>
          ))}
        </div>

        <select
          className={jField + " w-auto"}
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
        >
          <option value="">كل البرامج</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="flex-1" />

        <button onClick={exportCsv} className={jGhost + " text-xs"}>
          تصدير
        </button>
        <button onClick={() => openNew("income")} className={jGhost + " text-xs"}>
          + إيراد
        </button>
        <button onClick={() => openNew("expense")} className={jPrimary}>
          + مصروف
        </button>
      </div>

      {flow.length > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
          <span className="text-xs text-j-dim">الحركة الشهرية</span>
          <div className="flex items-end gap-3 overflow-x-auto pb-1">
            {flow.map((f) => (
              <div key={f.month} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="flex h-24 items-end gap-1">
                  <span
                    className="w-3 rounded-t bg-j-ok"
                    style={{ height: Math.max(2, (f.income / peak) * 96) + "px" }}
                    title={"إيراد " + money(f.income)}
                  />
                  <span
                    className="w-3 rounded-t bg-j-danger"
                    style={{ height: Math.max(2, (f.expense / peak) * 96) + "px" }}
                    title={"مصروف " + money(f.expense)}
                  />
                </div>
                <span className="mark text-[10px] text-j-faint" dir="ltr">
                  {f.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totals.byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {totals.byCategory.slice(0, 10).map((c) => (
            <span
              key={c.kind + c.category}
              className="flex items-baseline gap-2 rounded-xl border border-j-line bg-j-surface px-3 py-2 text-xs"
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  backgroundColor: c.kind === "income" ? "var(--j-ok)" : "var(--j-danger)",
                }}
              />
              <span className="text-j-dim">{c.category}</span>
              <span className="mark font-semibold">{money(c.amount)}</span>
            </span>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <Empty title="لا قيود في هذه الفترة" hint="كل ريال يدخل أو يخرج يُسجّل هنا" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm">
          {shown.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setDraft(e)}
              className={
                "flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-j-raised " +
                (i > 0 ? "border-t border-j-line" : "")
              }
            >
              <span className="mark w-24 shrink-0 text-xs text-j-dim">{fmtDate(e.entry_date)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{e.description || e.category}</span>
                <span className="block truncate text-[11px] text-j-faint">
                  {e.category}
                  {e.program_id ? " · " + programName(e.program_id) : ""}
                </span>
              </span>
              <span
                className="mark shrink-0 text-sm font-semibold"
                style={{ color: e.kind === "income" ? "var(--j-ok)" : "var(--j-danger)" }}
              >
                {(e.kind === "income" ? "+" : "−") + money(e.amount)}
              </span>
              <span className="mark hidden w-28 shrink-0 text-end text-xs text-j-faint sm:block">
                {money(balance.get(e.id) ?? 0)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={
          draft?.id
            ? "تعديل قيد"
            : draft?.kind === "income"
              ? "إيراد جديد"
              : "مصروف جديد"
        }
        footer={
          <div className="flex gap-2">
            <button onClick={() => void submit()} className={jPrimary + " flex-1"}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  const id = draft.id;
                  if (!id) return;
                  await remove("jam_ledger", id);
                  setDraft(null);
                  onChanged();
                }}
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <>
            {error && (
              <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
            )}

            <div className="flex gap-1 rounded-xl bg-j-raised p-1">
              {(["income", "expense"] as EntryKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      kind: k,
                      /** تغيير النوع يبدّل قائمة التصنيفات، فالتصنيف القديم لا يصلح */
                      category: categoriesFor(k)[0],
                    })
                  }
                  className={
                    "flex-1 rounded-lg px-3 py-2 text-xs transition " +
                    (draft.kind === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
                  }
                >
                  {k === "income" ? "إيراد" : "مصروف"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المبلغ</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.amount ?? ""}
                  onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">التاريخ</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.entry_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, entry_date: e.target.value })}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">التصنيف</span>
              <select
                className={jField}
                value={draft.category ?? ""}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categoriesFor(draft.kind ?? "expense").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <input
              className={jField}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
              placeholder="الوصف"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">البرنامج</span>
                <select
                  className={jField}
                  value={draft.program_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, program_id: e.target.value || null })}
                >
                  <option value="">— بلا برنامج —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المنحة</span>
                <select
                  className={jField}
                  value={draft.grant_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, grant_id: e.target.value || null })}
                >
                  <option value="">— بلا منحة —</option>
                  {grants.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <FileField
              label="المستند (فاتورة أو سند)"
              folder="jam/ledger"
              value={draft.attachment_url ?? null}
              onChange={(f) => setDraft({ ...draft, attachment_url: f ? f.url : null })}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
