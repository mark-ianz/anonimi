import type { Metadata } from "next";
import FAQAccordion from "@/components/marketing/FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ — EchoID",
  description: "Frequently asked questions about EchoID.",
};

export default function FAQPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-display font-bold">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Everything you need to know about EchoID
          </p>
        </div>

        <FAQAccordion />
      </div>
    </div>
  );
}
