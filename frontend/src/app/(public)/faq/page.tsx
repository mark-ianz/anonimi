import type { Metadata } from "next";
import FAQAccordion from "@/components/marketing/FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ — anonimi",
  description: "Frequently asked questions about anonimi.",
};

export default function FAQPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-[radial-gradient(circle_at_16%_14%,rgba(18,58,87,0.15),transparent_44%),radial-gradient(circle_at_84%_26%,rgba(57,114,129,0.14),transparent_45%)]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-border/50 pb-10 text-center md:mb-14">
          <p className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            Help Center
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Clear answers about identity, privacy, and messaging behavior.
          </p>
        </div>

        <FAQAccordion />
      </div>
    </div>
  );
}
