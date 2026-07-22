"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FAQAccordion from "@/components/marketing/FAQAccordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircle, FileText, Sparkles } from "lucide-react";

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function FAQPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-[radial-gradient(circle_at_50%_12%,rgba(202,138,4,0.07),transparent_50%)]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <Section>
          <div className="mb-12 border-b border-gold/10 pb-10 text-center md:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                Help Center
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Clear answers about identity, privacy, and messaging behavior.
            </p>
          </div>
        </Section>

        {/* Quick Links */}
        <Section delay={0.08}>
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            {[
              { href: "#getting-started", icon: Sparkles, label: "Getting Started", count: "3 questions" },
              { href: "#identity-privacy", icon: FileText, label: "Identity & Privacy", count: "4 questions" },
              { href: "#features", icon: MessageCircle, label: "Features", count: "4 questions" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
                  className="glass-card group flex items-center gap-3 rounded-xl border border-gold/10 p-4 transition-all hover:border-gold/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.count}</p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </Section>

        {/* FAQ Accordion */}
        <Section delay={0.12}>
          <FAQAccordion />
        </Section>

        {/* Contact */}
        <Section delay={0.16}>
          <div className="mt-16 rounded-2xl border border-gold/10 bg-gold/[0.03] p-8 text-center md:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <MessageCircle className="h-7 w-7 text-gold" />
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">Still have questions?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help you with any questions.
            </p>
            <div className="mt-6 inline-block">
              <Button className="btn-gold rounded-full px-6 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]" size="lg" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
