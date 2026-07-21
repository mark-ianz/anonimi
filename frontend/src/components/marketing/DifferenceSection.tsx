"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, Database, ShieldCheck, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Smartphone,
    title: "No Phone Number Needed",
    description: "Sign up with just email. Your AID is your identity — no phone number to expose, leak, or sell.",
  },
  {
    icon: Database,
    title: "No Data Mining",
    description: "We don't read, analyze, or sell your messages. Conversation content is encrypted before it leaves your device.",
  },
  {
    icon: ShieldCheck,
    title: "E2EE by Default",
    description: "Every conversation gets its own encryption key. No master key, no backdoor, no exceptions.",
  },
];

export default function DifferenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const isHeadingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden border-t border-white/5 bg-card/30 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-gold/3 blur-[120px]" />
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
                The Difference
              </span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]"
          >
            Privacy isn't a setting. It's the starting point.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Most messaging apps offer privacy as an afterthought. We built anonimi the other way around.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
                className="group cursor-pointer"
              >
                <div className="glass-card h-full rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-glow/50">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                    <Icon className="h-7 w-7 text-gold" />
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
