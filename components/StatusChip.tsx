import { STATUS, type Status } from "@/ideas";

export function StatusChip({ status }: { status: Status }) {
  const { label, color, tint } = STATUS[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: tint, color }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
