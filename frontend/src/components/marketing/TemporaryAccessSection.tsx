"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Clock, ArrowRight, Sparkles } from "lucide-react";

function CountdownRing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = useTransform(
    scrollYProgress,
    [0, 1],
    [circumference * 0.05, circumference * 0.95]
  );

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <svg className="h-48 w-48 -rotate-90 sm:h-56 sm:w-56" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold/8" />
        <motion.circle
          cx="60" cy="60" r="56"
          fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" className="text-gold"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="font-display text-4xl font-bold text-foreground sm:text-5xl"
        >
          24
        </motion.span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
          hours
        </span>
      </div>
    </div>
  );
}

export default function TemporaryAccessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[350px] w-[350px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 md:gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex justify-center"
          >
            <CountdownRing />
          </motion.div>

          <div ref={contentRef}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  Temporary Access
                </span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-5 max-w-[18ch] text-3xl font-bold leading-[1.04] sm:text-4xl md:text-[2.8rem]"
            >
              Start instantly, keep it when it matters.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              Temporary Access gives you a full 24-hour session without commitment. Convert to a permanent account the moment you decide the conversation is worth keeping.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-6 flex flex-wrap items-center gap-2"
            >
              {["Session-only", "Claim to keep", "24h expiration"].map((tag) => (
                <span key={tag} className="rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-amber-400/80">
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/temporary"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-amber-600 px-7 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                Start temporary session
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features#temporary-access"
                className="glass-card inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5"
              >
                How it works
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-8"
            >
              <div className="glass-card rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Move fast without losing your option to stay.
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Perfect for first-time contacts, one-off collaborations, or trial conversations that may become long-term.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
