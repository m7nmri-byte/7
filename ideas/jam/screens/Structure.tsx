"use client";

import { useMemo, useState } from "react";
import type { Department, Member, Shift, Site } from "../types";
import { patch, remove, save } from "../db";
import { DAY_NAMES } from "../format";
import { Empty, Modal, jField, jGhost, jPrimary, jOption } from "../ui";
import { MapPicker } from "../MapPicker";

type Tab = "departments" | "shifts" | "sites";

const TABS: [Tab, string][] = [
  ["departments", "الإدارات"],
  ["shifts", "الورديات"],
  ["sites", "المواقع"],
];

export function Structure({
  departments,
  shifts,
  sites,
  members,
  onChanged,
}: {
  departments: Department[];
  shifts: Shift[];
  sites: Site[];
  members: Member[];
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<Tab>("departments");
  const [dept, setDept] = useState<Partial<Department> | null>(null);
  const [shift, setShift] = useState<Partial<Shift> | null>(null);
  const [site, setSite] = useState<Partial<Site> | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** عدد الأعضاء في كل إدارة — الإدارة الفارغة علامة على بنية لم تُستعمل */
  const headcount = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of members)
      if (x.department_id) m.set(x.department_id, (m.get(x.department_id) ?? 0) + 1);
    return m;
  }, [members]);

  /** شجرة الإدارات: الجذور ثم الأبناء، بمستوى واحد من التداخل يكفي جمعية */
  const tree = useMemo(() => {
    const roots = departments.filter((d) => !d.parent_id);
    return roots.map((r) => ({
      node: r,
      children: departments.filter((d) => d.parent_id === r.id),
    }));
  }, [departments]);

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const toggleDay = (d: number) => {
    if (!shift) return;
    const days = shift.work_days ?? [];
    setShift({
      ...shift,
      work_days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort(),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {TABS.map(([k, t]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (tab === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        {tab === "departments" && (
          <button onClick={() => setDept({ sort_order: departments.length })} className={jPrimary}>
            + إدارة
          </button>
        )}
        {tab === "shifts" && (
          <button
            onClick={() =>
              setShift({
                start_time: "08:00",
                end_time: "16:00",
                late_after_minutes: 15,
                early_leave_before_minutes: 15,
                work_days: [0, 1, 2, 3, 4],
                is_default: shifts.length === 0,
              })
            }
            className={jPrimary}
          >
            + وردية
          </button>
        )}
        {tab === "sites" && (
          <button onClick={() => setSite({ radius_m: 150, is_active: true })} className={jPrimary}>
            + موقع
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      {tab === "departments" &&
        (departments.length === 0 ? (
          <Empty title="لا إدارات" hint="البنية التي تُسند إليها المهام والاجتماعات" />
        ) : (
          <div className="flex flex-col gap-2">
            {tree.map(({ node, children }) => (
              <div
                key={node.id}
                className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm"
              >
                <button
                  onClick={() => setDept(node)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start"
                >
                  <span className="flex-1 text-sm font-semibold">{node.name}</span>
                  <span className="mark text-[11px] text-j-faint">
                    {headcount.get(node.id) ?? 0} عضو
                  </span>
                </button>
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDept(c)}
                    className="flex w-full items-center gap-3 border-t border-j-line px-4 py-2.5 ps-8 text-start"
                  >
                    <span className="flex-1 text-xs text-j-dim">{c.name}</span>
                    <span className="mark text-[11px] text-j-faint">
                      {headcount.get(c.id) ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}

      {tab === "shifts" &&
        (shifts.length === 0 ? (
          <Empty title="لا ورديات" hint="الوردية تحدّد متى يُحسب الحضور متأخّرًا" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-2 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm"
              >
                <button onClick={() => setShift(s)} className="flex items-start gap-2 text-start">
                  <span className="flex-1 text-sm font-semibold">{s.name}</span>
                  {s.is_default && (
                    <span className="shrink-0 rounded-md bg-j-brand/10 px-2 py-0.5 text-[10px] text-j-brand">
                      الافتراضية
                    </span>
                  )}
                </button>
                <span className="mark text-xs text-j-dim" dir="ltr">
                  {s.start_time} — {s.end_time}
                </span>
                <div className="flex flex-wrap gap-1">
                  {DAY_NAMES.map((d, i) => (
                    <span
                      key={d}
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] " +
                        (s.work_days.includes(i)
                          ? "bg-j-brand/10 text-j-brand"
                          : "text-j-faint line-through")
                      }
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-j-faint">
                  تأخّر بعد {s.late_after_minutes} دقيقة · خروج مبكّر قبل{" "}
                  {s.early_leave_before_minutes} دقيقة
                </span>
                {!s.is_default && (
                  <button
                    onClick={() =>
                      void guard(async () => {
                        /** افتراضية واحدة فقط — تُنزع عن البواقي قبل منحها */
                        for (const o of shifts)
                          if (o.is_default) await patch("jam_shifts", o.id, { is_default: false });
                        await patch("jam_shifts", s.id, { is_default: true });
                      })
                    }
                    className="self-start text-[11px] text-j-brand"
                  >
                    اجعلها الافتراضية
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

      {tab === "sites" &&
        (sites.length === 0 ? (
          <Empty title="لا مواقع" hint="الموقع ونطاقه يقرّران قبول بصمة الحضور" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSite(s)}
                className="flex flex-col gap-1.5 rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
              >
                <span className="flex items-baseline gap-2">
                  <span className="flex-1 text-sm font-semibold">{s.name}</span>
                  {!s.is_active && <span className="text-[10px] text-j-faint">معطّل</span>}
                </span>
                <span className="mark text-[11px] text-j-faint" dir="ltr">
                  {s.lat !== null && s.lng !== null
                    ? s.lat.toFixed(5) + ", " + s.lng.toFixed(5)
                    : "بلا إحداثيات"}
                </span>
                <span className="mark text-[11px] text-j-dim">نطاق {s.radius_m} م</span>
              </button>
            ))}
          </div>
        ))}

      <Modal
        open={Boolean(dept)}
        onClose={() => setDept(null)}
        title={dept?.id ? "تعديل إدارة" : "إدارة جديدة"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!dept?.name?.trim()) return;
                  await save("jam_departments", {
                    ...(dept.id ? { id: dept.id } : {}),
                    name: dept.name.trim(),
                    parent_id: dept.parent_id ?? null,
                    sort_order: Number(dept.sort_order ?? 0),
                  });
                  setDept(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {dept?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = dept.id;
                    if (!id) return;
                    await remove("jam_departments", id);
                    setDept(null);
                  })
                }
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {dept && (
          <>
            <input
              className={jField}
              value={dept.name ?? ""}
              onChange={(e) => setDept({ ...dept, name: e.target.value })}
              placeholder="اسم الإدارة"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">تتبع</span>
              <select
                className={jField}
                value={dept.parent_id ?? ""}
                onChange={(e) => setDept({ ...dept, parent_id: e.target.value || null })}
              >
                <option value="">— إدارة رئيسة —</option>
                {departments
                  .filter((d) => !d.parent_id && d.id !== dept.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">الترتيب</span>
              <input
                type="number"
                className={jField + " mark"}
                value={dept.sort_order ?? 0}
                onChange={(e) => setDept({ ...dept, sort_order: Number(e.target.value) || 0 })}
              />
            </label>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(shift)}
        onClose={() => setShift(null)}
        title={shift?.id ? "تعديل وردية" : "وردية جديدة"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!shift?.name?.trim()) return;
                  await save("jam_shifts", {
                    ...(shift.id ? { id: shift.id } : {}),
                    name: shift.name.trim(),
                    start_time: shift.start_time ?? "08:00",
                    end_time: shift.end_time ?? "16:00",
                    late_after_minutes: Number(shift.late_after_minutes ?? 15),
                    early_leave_before_minutes: Number(shift.early_leave_before_minutes ?? 15),
                    work_days: shift.work_days ?? [],
                    is_default: Boolean(shift.is_default),
                  });
                  setShift(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {shift?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = shift.id;
                    if (!id) return;
                    await remove("jam_shifts", id);
                    setShift(null);
                  })
                }
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {shift && (
          <>
            <input
              className={jField}
              value={shift.name ?? ""}
              onChange={(e) => setShift({ ...shift, name: e.target.value })}
              placeholder="اسم الوردية"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">البداية</span>
                <input
                  type="time"
                  className={jField + " mark"}
                  value={shift.start_time ?? ""}
                  onChange={(e) => setShift({ ...shift, start_time: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">النهاية</span>
                <input
                  type="time"
                  className={jField + " mark"}
                  value={shift.end_time ?? ""}
                  onChange={(e) => setShift({ ...shift, end_time: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">يُحسب متأخّرًا بعد (دقيقة)</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={shift.late_after_minutes ?? 0}
                  onChange={(e) =>
                    setShift({ ...shift, late_after_minutes: Number(e.target.value) || 0 })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">خروج مبكّر قبل (دقيقة)</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={shift.early_leave_before_minutes ?? 0}
                  onChange={(e) =>
                    setShift({
                      ...shift,
                      early_leave_before_minutes: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">أيام العمل</span>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(i)}
                    className={
                      jOption((shift.work_days ?? []).includes(i)) + " px-3 py-1.5 text-xs"
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
              <span className="text-sm">الوردية الافتراضية</span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--j-brand)]"
                checked={Boolean(shift.is_default)}
                onChange={(e) => setShift({ ...shift, is_default: e.target.checked })}
              />
            </label>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(site)}
        onClose={() => setSite(null)}
        title={site?.id ? "تعديل موقع" : "موقع جديد"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!site?.name?.trim()) return;
                  await save("jam_sites", {
                    ...(site.id ? { id: site.id } : {}),
                    name: site.name.trim(),
                    lat: site.lat ?? null,
                    lng: site.lng ?? null,
                    radius_m: Number(site.radius_m ?? 150),
                    is_active: site.is_active ?? true,
                  });
                  setSite(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {site?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = site.id;
                    if (!id) return;
                    await remove("jam_sites", id);
                    setSite(null);
                  })
                }
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {site && (
          <>
            <input
              className={jField}
              value={site.name ?? ""}
              onChange={(e) => setSite({ ...site, name: e.target.value })}
              placeholder="اسم الموقع"
            />

            <MapPicker
              value={site.lat !== null && site.lat !== undefined && site.lng !== null && site.lng !== undefined ? { lat: site.lat, lng: site.lng } : null}
              onChange={(p) => setSite({ ...site, lat: p.lat, lng: p.lng })}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">نطاق القبول (متر)</span>
              <input
                type="number"
                className={jField + " mark"}
                value={site.radius_m ?? 150}
                onChange={(e) => setSite({ ...site, radius_m: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
              <span className="text-sm">مفعّل</span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--j-brand)]"
                checked={site.is_active ?? true}
                onChange={(e) => setSite({ ...site, is_active: e.target.checked })}
              />
            </label>
          </>
        )}
      </Modal>
    </div>
  );
}
