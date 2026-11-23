"use client";

import { useMemo, useState } from "react";
import type { Aid, Beneficiary, Program } from "../types";
import { AID_STATUS } from "../types";
import { fmtDate, money } from "../format";
import { useMe } from "../hooks";
import { Empty, Modal, Tag, jField, jGhost, jPrimary } from "../ui";
import { BeneficiaryForm, CATEGORIES } from "./BeneficiaryForm";
import { AID_TONE, AidForm } from "./AidForm";

export function Beneficiaries({
  beneficiaries,
  aids,
  programs,
  onChanged,
}: {
  beneficiaries: Beneficiary[];
  aids: Aid[];
  programs: Program[];
  onChanged: () => void;
}) {
  const me = useMe();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [draft, setDraft] = useState<Partial<Beneficiary> | null>(null);
  const [open, setOpen] = useState<Beneficiary | null>(null);
  const [aidDraft, setAidDraft] = useState<Partial<Aid> | null>(null);

  /** مجموع ما صُرف لكل مستفيد — يُحسب من السجلّ لا من عمود يتعفّن */
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of aids)
      if (a.status === "disbursed")
        m.set(a.beneficiary_id, (m.get(a.beneficiary_id) ?? 0) + Number(a.amount));
    return m;
  }, [aids]);

  const list = beneficiaries.filter((b) => {
    if (cat !== "all" && b.category !== cat) return false;
    const q = query.trim();
    return (
      !q ||
      b.name.includes(q) ||
      (b.national_id ?? "").includes(q) ||
      (b.phone ?? "").includes(q)
    );
  });

  const mine = open ? aids.filter((a) => a.beneficiary_id === open.id) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${jField} max-w-xs`}
          placeholder="بحث بالاسم أو الهوية أو الجوال"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${jField} max-w-44`}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="all">كل الفئات</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button onClick={() => setDraft({ is_active: true })} className={`${jPrimary} ms-auto`}>
          + مستفيد
        </button>
      </div>

      {list.length === 0 ? (
        <Empty title="لا مستفيدين" hint="ابدأ بتسجيل أول ملف" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpen(b)}
              className="flex flex-col gap-1.5 rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-sm font-semibold">{b.name}</span>
                {b.category && <Tag>{b.category}</Tag>}
              </div>
              <span className="mark truncate text-[11px] text-j-faint" dir="ltr">
                {b.national_id ?? "—"}
              </span>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-j-dim">
                  {b.city ?? "—"}
                  {b.family_size ? ` · ${b.family_size} أفراد` : ""}
                </span>
                <span className="font-semibold text-j-brand">
                  {money(totals.get(b.id) ?? 0)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <BeneficiaryForm
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSaved={onChanged}
      />

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        wide
        title={open?.name ?? ""}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setAidDraft({ kind: "cash", status: "requested" })}
              className={`${jPrimary} flex-1`}
            >
              + مساعدة
            </button>
            <button
              onClick={() => {
                setDraft(open);
                setOpen(null);
              }}
              className={jGhost}
            >
              تعديل الملف
            </button>
          </div>
        }
      >
        {open && (
          <>
            <dl className="grid grid-cols-3 gap-3 rounded-xl bg-j-raised p-3 text-xs">
              <div>
                <dt className="text-j-dim">الهوية</dt>
                <dd className="mark" dir="ltr">
                  {open.national_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-j-dim">الجوال</dt>
                <dd className="mark" dir="ltr">
                  {open.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-j-dim">الدخل</dt>
                <dd>{open.income != null ? money(open.income) : "—"}</dd>
              </div>
              <div>
                <dt className="text-j-dim">المدينة</dt>
                <dd>{open.city ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-j-dim">الحي</dt>
                <dd>{open.district ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-j-dim">أفراد الأسرة</dt>
                <dd className="mark">{open.family_size ?? "—"}</dd>
              </div>
            </dl>

            {open.notes && (
              <p className="whitespace-pre-wrap rounded-xl bg-j-surface p-3 text-xs leading-relaxed">
                {open.notes}
              </p>
            )}

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-j-dim">
                المساعدات ({mine.length}) — مصروف {money(totals.get(open.id) ?? 0)}
              </h3>
              {mine.length === 0 ? (
                <p className="text-xs text-j-faint">لا مساعدات بعد</p>
              ) : (
                mine.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAidDraft(a)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-j-line p-3 text-start text-xs"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{a.description ?? "مساعدة"}</span>
                      <span className="text-j-faint">
                        {fmtDate(a.created_at)}
                        {a.program_id
                          ? ` · ${programs.find((p) => p.id === a.program_id)?.name ?? ""}`
                          : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold">{money(a.amount)}</span>
                      <Tag tone={AID_TONE[a.status]}>{AID_STATUS[a.status]}</Tag>
                    </span>
                  </button>
                ))
              )}
            </section>
          </>
        )}
      </Modal>

      <AidForm
        draft={aidDraft}
        beneficiaryId={open?.id ?? null}
        programs={programs}
        me={me}
        onChange={setAidDraft}
        onClose={() => setAidDraft(null)}
        onSaved={onChanged}
      />
    </div>
  );
}
