import { STATUS, type Status } from "@/ideas";

export function StatusChip({ status }: { status: Status }) {
  const { label, color } = STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-mist"
      title={label}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
