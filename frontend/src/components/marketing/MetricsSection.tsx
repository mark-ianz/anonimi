"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";

const metrics = [
  { value: "100%", label: "End-to-end encrypted conversations" },
  { value: "Zero", label: "Phone numbers or personal data required" },
  { value: "24h", label: "Temporary access without commitment" },
  { value: "No ads", label: "Zero tracking, always" },
];

export default function MetricsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3, margin: "-60px" });
  const isHeadingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden border-t border-white/5 bg-card/50 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/3 blur-[120px]" />
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
                By The Numbers
              </span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]"
          >
            Built different. It shows.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Real guarantees, not marketing speak.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
              className="glass-card flex h-full flex-col items-center rounded-2xl p-6 text-center"
            >
              <span className="font-display text-5xl font-bold text-gold text-nowrap">{metric.value}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
