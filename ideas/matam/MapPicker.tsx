"use client";

import { useEffect, useRef, useState } from "react";

type Point = { lat: number; lng: number };

const ZOOM = 16;
const TILE = 256;

/** تحويل بين الإحداثيات ومربّعات الخريطة — إسقاط مركاتور المعياري */
const lngToX = (lng: number, z: number) => ((lng + 180) / 360) * Math.pow(2, z);
const latToY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z);
};
const xToLng = (x: number, z: number) => (x / Math.pow(2, z)) * 360 - 180;
const yToLat = (y: number, z: number) => {
  const n = Math.PI - 2 * Math.PI * (y / Math.pow(2, z));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

/**
 * منتقي موقع على خريطة OpenStreetMap.
 * بلا مكتبة خرائط ولا مفتاح خدمة: المربّعات صور عامة، والسحب حساب
 * إحداثيات بسيط. الدبّوس ثابت في المركز والخريطة تتحرّك تحته —
 * أدقّ على الجوال من سحب دبّوس صغير بالإصبع.
 */
export function MapPicker({
  value,
  onChange,
  height = 220,
  fallback,
}: {
  value: Point | null;
  onChange: (p: Point) => void;
  height?: number;
  /** من أين تبدأ الخريطة إن لم يكن للعميل موقع محفوظ — موقع المطعم أولى */
  fallback?: Point | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<Point>(
    value ?? fallback ?? { lat: 24.7136, lng: 46.6753 },
  );
  const [size, setSize] = useState({ w: 320, h: height });
  const drag = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = lngToX(center.lng, ZOOM) * TILE;
  const cy = latToY(center.lat, ZOOM) * TILE;

  const cols: { key: string; url: string; left: number; top: number }[] = [];
  const x0 = Math.floor((cx - size.w / 2) / TILE);
  const x1 = Math.floor((cx + size.w / 2) / TILE);
  const y0 = Math.floor((cy - size.h / 2) / TILE);
  const y1 = Math.floor((cy + size.h / 2) / TILE);

  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      cols.push({
        key: `${x}:${y}`,
        url: `https://tile.openstreetmap.org/${ZOOM}/${((x % Math.pow(2, ZOOM)) + Math.pow(2, ZOOM)) % Math.pow(2, ZOOM)}/${y}.png`,
        left: x * TILE - (cx - size.w / 2),
        top: y * TILE - (cy - size.h / 2),
      });

  const commit = (p: Point) => {
    setCenter(p);
    onChange(p);
  };

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, lat: center.lat, lng: center.lng };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const bx = lngToX(d.lng, ZOOM) * TILE - dx;
    const by = latToY(d.lat, ZOOM) * TILE - dy;
    setCenter({ lat: yToLat(by / TILE, ZOOM), lng: xToLng(bx / TILE, ZOOM) });
  };

  const onUp = () => {
    if (drag.current) {
      drag.current = null;
      onChange(center);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        commit({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={box}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ height }}
        className="relative touch-none overflow-hidden rounded-2xl border border-m-line bg-m-raised"
      >
        {cols.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={t.url}
            alt=""
            draggable={false}
            width={TILE}
            height={TILE}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ left: t.left, top: t.top }}
          />
        ))}

        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-2xl drop-shadow"
          style={{ color: "var(--m-accent)" }}
        >
          <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
        </span>

        <button
          type="button"
          onClick={locate}
          className="absolute bottom-2 end-2 rounded-lg bg-m-surface px-2.5 py-1.5 text-[11px] font-medium shadow-m-sm"
        >
          {locating ? "…" : "موقعي"}
        </button>
      </div>

      <p className="mark text-center text-[11px] text-m-faint" dir="ltr">
        {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
      </p>
      <p className="text-center text-[11px] text-m-faint">
        اسحب الخريطة حتى يقع الدبّوس على موقعك
      </p>
    </div>
  );
}
