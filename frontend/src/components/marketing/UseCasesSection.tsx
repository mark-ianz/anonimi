"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Newspaper, Users,Lock, Sparkles } from "lucide-react";

const useCases = [
  {
    icon: Newspaper,
    title: "Journalists & Whistleblowers",
    description: "Communicate with sources without exposing personal contact data. AID-based discovery means no phone number, no metadata trail.",
  },
  {
    icon: Users,
    title: "Remote Teams",
    description: "Create encrypted group rooms with conversation-level keys. Roles, nicknames, and message requests keep team communication secure.",
  },
  {
    icon: Lock,
    title: "Privacy-Conscious Individuals",
    description: "Full E2EE with stealth timers and temporary accounts. Your conversations stay yours — no tracking, no data mining.",
  },
];

export default function UseCasesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const isHeadingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-gold/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div ref={headingRef} className="mx-auto mb-14 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                Who it's for
              </span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]"
          >
            Built for the people who need it most.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Privacy isn't a feature — it's the foundation. Here's who we built it for.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {useCases.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                className="group cursor-pointer"
              >
                <div className="glass-card h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
