"use client";

import { useEffect, useState } from "react";
import type { PopupAd } from "../matam/types";
import { MSheet, mGhost } from "../matam/ui";

const SEEN_KEY = "matam.seenAds";

function seen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * الإعلان المنبثق يظهر مرة واحدة لكل جهاز.
 * إظهاره في كل فتحة يزعج الزبون ويفقده أثره — فنتذكّر ما رآه.
 */
export function PopupAds({ ads }: { ads: PopupAd[] }) {
  const [ad, setAd] = useState<PopupAd | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const active = ads.filter((a) => a.is_active && a.image_urls.length);
    if (!active.length) return;
    const unseen = active.find((a) => !seen().includes(a.id));
    if (!unseen) return;
    const t = setTimeout(() => setAd(unseen), 700);
    return () => clearTimeout(t);
  }, [ads]);

  useEffect(() => {
    if (!ad?.auto_scroll || ad.image_urls.length < 2) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % ad.image_urls.length),
      Math.max(2, ad.auto_scroll_seconds) * 1000,
    );
    return () => clearInterval(id);
  }, [ad]);

  const close = () => {
    if (ad) {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen(), ad.id]));
      } catch {
        /* لا بأس */
      }
    }
    setAd(null);
    setSlide(0);
  };

  if (!ad) return null;

  return (
    <MSheet
      open
      onClose={close}
      title={ad.caption ?? undefined}
      footer={
        ad.external_url ? (
          <a
            href={ad.external_url}
            target="_blank"
            rel="noreferrer"
            onClick={close}
            className={`${mGhost} block w-full text-center`}
          >
            اعرف المزيد
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image_urls[slide]}
          alt=""
          className="w-full rounded-2xl object-cover"
        />

        {ad.image_urls.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {ad.image_urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`صورة ${i + 1}`}
                className={`size-1.5 rounded-full transition-colors ${
                  i === slide ? "bg-m-accent" : "bg-m-line"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </MSheet>
  );
}
