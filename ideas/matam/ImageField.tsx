"use client";

import { useRef, useState } from "react";

type Signature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
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

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await up.json()) as { secure_url?: string; error?: { message: string } };
  if (!up.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "فشل الرفع");
  }
  return data.secure_url;
}

/**
 * حقل صورة: يرفع الملف إلى Cloudinary ويعيد رابطه.
 * ويقبل لصق رابط جاهز أيضًا — فمن عنده صورة مستضافة لا يُجبر على الرفع.
 */
export function ImageField({
  value,
  onChange,
  folder = "matam",
  label = "الصورة",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadToCloudinary(file, folder));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-m-dim">{label}</span>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-m-line bg-m-raised text-m-faint transition-colors hover:border-m-accent/50 disabled:opacity-60"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V5M8.5 8.5 12 5l3.5 3.5" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          )}

          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-black/45 text-[11px] font-medium text-white">
              جارٍ الرفع…
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="rounded-lg bg-m-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {value ? "استبدل" : "ارفع صورة"}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-lg border border-m-line px-3 py-1.5 text-xs text-m-dim"
              >
                احذف
              </button>
            )}

            <button
              type="button"
              onClick={() => setTyping((t) => !t)}
              className="rounded-lg px-2 py-1.5 text-xs text-m-faint underline-offset-2 hover:underline"
            >
              أو رابط
            </button>
          </div>

          {typing && (
            <input
              dir="ltr"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value || null)}
              placeholder="https://…"
              className="mark w-full rounded-lg border border-m-line bg-m-surface px-2.5 py-1.5 text-xs outline-none focus:border-m-accent/50"
            />
          )}

          {error && <p className="text-[11px] text-m-danger">{error}</p>}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
}
