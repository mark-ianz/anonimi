import { LucideIcon } from "lucide-react";

interface HowItWorksStepProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function HowItWorksStep({ number, icon: Icon, title, description }: HowItWorksStepProps) {
  return (
    <article className="group rounded-2xl border border-border/70 bg-card/55 p-6 transition-colors duration-300 hover:bg-card/88 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
        <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Step {number}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl leading-tight font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
