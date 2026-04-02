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
        "scroll-animate group relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-soft",
        isFeature && "p-8 md:p-10",
        !isFeature && !isCompact && "p-6 md:p-7",
        isCompact && "p-5 md:p-6",
        emphasized && "border-primary/45"
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards"
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_6%_10%,rgba(42,108,130,0.12),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(34,79,115,0.1),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-2xl border border-border/70 bg-background/80 transition-transform duration-300 group-hover:-translate-y-0.5",
          isFeature ? "h-13 w-13" : "h-11 w-11"
        )}
      >
        <Icon className={cn("text-foreground", isFeature ? "h-5 w-5" : "h-4 w-4")} />
      </div>

      <h3
        className={cn(
          "relative z-10 mt-4 leading-tight font-semibold",
          isFeature && "max-w-[20ch] text-2xl md:text-[1.8rem]",
          !isFeature && !isCompact && "text-xl",
          isCompact && "text-lg"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "relative z-10 mt-2 leading-relaxed text-muted-foreground",
          isFeature ? "max-w-xl text-[0.95rem]" : "text-sm"
        )}
      >
        {description}
      </p>
    </article>
  );
}
