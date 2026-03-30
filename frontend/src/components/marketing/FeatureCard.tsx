import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  emphasized?: boolean;
  size?: "feature" | "default" | "compact";
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  emphasized = false,
  size = "default",
}: FeatureCardProps) {
  const isFeature = size === "feature";
  const isCompact = size === "compact";

  return (
    <article
      className={cn(
        "group animate-reveal-up rounded-2xl border border-border/70 bg-card/60 transition-all duration-300 hover:border-border hover:bg-card/90",
        isFeature && "p-8 md:p-9",
        !isFeature && !isCompact && "p-6",
        isCompact && "p-5",
        emphasized && "border-primary/35"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border/70 bg-background transition-transform duration-300 group-hover:-translate-y-0.5",
          isFeature ? "h-12 w-12" : "h-10 w-10"
        )}
      >
        <Icon className={cn("text-foreground", isFeature ? "h-5 w-5" : "h-4 w-4")} />
      </div>

      <h3
        className={cn(
          "mt-4 leading-tight font-semibold",
          isFeature && "max-w-[20ch] text-2xl md:text-[1.8rem]",
          !isFeature && !isCompact && "text-xl",
          isCompact && "text-lg"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "mt-2 leading-relaxed text-muted-foreground",
          isFeature ? "max-w-xl text-[0.95rem]" : "text-sm"
        )}
      >
        {description}
      </p>
    </article>
  );
}
