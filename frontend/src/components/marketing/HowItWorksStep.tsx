import { LucideIcon } from "lucide-react";

interface HowItWorksStepProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function HowItWorksStep({ number, icon: Icon, title, description }: HowItWorksStepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
          {number}
        </div>
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
