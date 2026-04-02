import { cn } from "@/lib/utils";

interface TemporaryAccountBadgeProps {
  className?: string;
  label?: string;
}

export default function TemporaryAccountBadge({
  className,
  label = "Temporary",
}: TemporaryAccountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300",
        className
      )}
    >
      {label}
    </span>
  );
}
