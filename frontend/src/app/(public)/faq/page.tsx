import type { Metadata } from "next";
import FAQAccordion from "@/components/marketing/FAQAccordion";
import ScrollToHash from "@/components/marketing/ScrollToHash";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AnimatedSection,
  AnimatedText,
  AnimatedBadge,
  AnimatedElement,
  AnimatedButton,
} from "@/components/marketing/AnimatedSection";
import { MessageCircle, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about anonimi.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <ScrollToHash />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-[radial-gradient(circle_at_16%_14%,rgba(18,58,87,0.15),transparent_44%),radial-gradient(circle_at_84%_26%,rgba(57,114,129,0.14),transparent_45%)]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <AnimatedSection className="mb-12 border-b border-border/50 pb-10 text-center md:mb-14">
          <AnimatedBadge className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            Help Center
          </AnimatedBadge>
          <AnimatedText delay={0.1}>
            <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold">
              Frequently Asked Questions
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.15}>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Clear answers about identity, privacy, and messaging behavior.
            </p>
          </AnimatedText>
        </AnimatedSection>

        {/* Quick Links */}
        <AnimatedSection delay={0.1} className="mb-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <AnimatedElement delay={0.15} className="group">
              <a
                href="#getting-started"
                className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                  <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">Getting Started</p>
                  <p className="text-xs text-muted-foreground">3 questions</p>
                </div>
              </a>
            </AnimatedElement>
            <AnimatedElement delay={0.2} className="group">
              <a
                href="#identity-privacy"
                className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 transition-all hover:bg-violet-500/10 hover:border-violet-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-medium">Identity & Privacy</p>
                  <p className="text-xs text-muted-foreground">4 questions</p>
                </div>
              </a>
            </AnimatedElement>
            <AnimatedElement delay={0.25} className="group">
              <a
                href="#features"
                className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Features</p>
                  <p className="text-xs text-muted-foreground">4 questions</p>
                </div>
              </a>
            </AnimatedElement>
          </div>
        </AnimatedSection>

        {/* FAQ Accordion */}
        <FAQAccordion />

        {/* Contact Section */}
        <AnimatedSection delay={0.1} className="mt-16">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-background p-8 text-center md:p-12">
            <AnimatedElement delay={0.15}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
            </AnimatedElement>
            <AnimatedText delay={0.2}>
              <h2 className="text-2xl font-bold md:text-3xl">
                Still have questions?
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.25}>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Can&apos;t find the answer you&apos;re looking for? Our support team is here to help you with any questions.
              </p>
            </AnimatedText>
            <AnimatedButton delay={0.3} className="mt-6 inline-block">
              <Button size="lg" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </AnimatedButton>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
