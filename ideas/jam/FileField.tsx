"use client";

import { useRef, useState } from "react";

type Signature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export type Uploaded = { url: string; name: string; bytes: number };

/**
 * رفع ملف إلى Cloudinary بنوع `auto` لا `image`،
 * فمستندات الجمعية pdf وword لا صور، والـ`auto` يقبل الصنفين.
 */
export async function uploadFile(file: File, folder = "jam"): Promise<Uploaded> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) {
    const { error } = (await res.json()) as { error?: string };
    throw new Error(error ?? "تعذّر تجهيز الرفع");
  }
  const sig = (await res.json()) as Signature;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const up = await fetch("https://api.cloudinary.com/v1_1/" + sig.cloudName + "/auto/upload", {
    method: "POST",
    body: form,
  });
  const data = (await up.json()) as {
    secure_url?: string;
    bytes?: number;
    error?: { message: string };
  };
  if (!up.ok || !data.secure_url) throw new Error(data.error?.message ?? "فشل الرفع");

  return { url: data.secure_url, name: file.name, bytes: data.bytes ?? file.size };
}

export const fileSize = (bytes: number | null) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return Math.round(kb) + " ك.ب";
  return (kb / 1024).toFixed(1) + " م.ب";
};

/** حقل ملف واحد: رابط محفوظ أو رفع جديد */
export function FileField({
  value,
  onChange,
  label = "الملف",
  folder = "jam",
}: {
  value: string | null;
  onChange: (f: Uploaded | null) => void;
  label?: string;
  folder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadFile(file, folder));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-j-dim">{label}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-lg border border-j-line bg-j-surface px-3 py-2 text-xs text-j-text disabled:opacity-50"
        >
          {busy ? "جارٍ الرفع…" : value ? "استبدل" : "ارفع ملفًا"}
        </button>

        {value && (
          <>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-xs text-j-brand underline-offset-2 hover:underline"
              dir="ltr"
            >
              {value.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="shrink-0 text-xs text-j-danger"
            >
              احذف
            </button>
          </>
        )}
      </div>

      {error && <p className="text-[11px] text-j-danger">{error}</p>}

      <input ref={input} type="file" hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}

/** حقل مرفقات متعدّدة — يُستخدم في الطلبات والبريد */
export function Attachments({
  value,
  onChange,
  folder = "jam",
}: {
  value: { url: string; name: string }[];
  onChange: (list: { url: string; name: string }[]) => void;
  folder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const done = await Promise.all([...files].map((f) => uploadFile(f, folder)));
      onChange([...value, ...done.map((d) => ({ url: d.url, name: d.name }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-j-dim">المرفقات ({value.length})</span>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-lg border border-j-line bg-j-surface px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? "جارٍ الرفع…" : "+ أضف"}
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {value.map((a, i) => (
            <div
              key={a.url + i}
              className="flex items-center gap-2 rounded-lg bg-j-raised px-3 py-2"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-xs text-j-brand"
              >
                {a.name}
              </a>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="shrink-0 text-xs text-j-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[11px] text-j-danger">{error}</p>}

      <input ref={input} type="file" multiple hidden onChange={(e) => void add(e.target.files)} />
    </div>
  );
}
