import { TYPE_CLASS, TYPE_LABELS } from "@/lib/pokemon/catalog";
import { cn } from "@/lib/utils";

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TYPE_CLASS[type] ?? "bg-pk-muted text-pk-ink",
      )}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}
