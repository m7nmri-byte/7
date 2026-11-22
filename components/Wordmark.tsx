import Link from "next/link";

export function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <Link
      href="/"
      aria-label="m7nmi"
      className={`latin inline-block font-light tracking-[0.2em] text-paper transition-colors hover:text-gold ${
        size === "lg" ? "text-5xl sm:text-7xl" : "text-base"
      }`}
    >
      m7nmi
    </Link>
  );
}
