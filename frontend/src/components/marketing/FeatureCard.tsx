import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div 
      className={cn(
        "group p-6 rounded-2xl border border-border/50 bg-background/50 hover:bg-background hover:border-primary/20 transition-all duration-300"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
