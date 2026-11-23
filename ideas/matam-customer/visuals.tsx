"use client";

/** صورة بمساحة محجوزة — الصورة عنصر أساسي لا زينة */
export function Photo({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  if (!src)
    return (
      <div className={`grid shrink-0 place-items-center bg-m-raised text-m-faint ${className}`}>
        <svg
          viewBox="0 0 24 24"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path
            d="M3 17.5 8.5 12l3.5 3.5L15.5 12 21 17.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8" r="1.6" />
        </svg>
      </div>
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={`shrink-0 object-cover ${className}`} />
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-m-sm"
      style={{ backgroundColor: tone }}
    >
      {children}
    </span>
  );
}

export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-m-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 3 3" strokeLinecap="round" />
      </svg>
      <input
        className="w-full rounded-2xl border border-m-line bg-m-surface py-3 pe-10 ps-4 text-sm shadow-m-sm outline-none transition-shadow placeholder:text-m-faint focus:shadow-m"
        placeholder="ابحث عن طبق"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
