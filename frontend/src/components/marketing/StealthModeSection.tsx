"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Eye, Trash2, Shield, ArrowRight, Sparkles, Timer } from "lucide-react";

function DecomposingMessage() {
  const [phase, setPhase] = useState<"typing" | "visible" | "decomposing" | "gone">("typing");
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = "Meeting point changed. Use the side entrance.";

  useEffect(() => {
    if (phase === "typing") {
      if (visibleChars < fullText.length) {
        const t = setTimeout(() => setVisibleChars((v) => v + 1), 40);
        return () => clearTimeout(t);
      } else {
        setPhase("visible");
      }
    }
  }, [phase, visibleChars]);

  useEffect(() => {
    if (phase === "visible") {
      const t = setTimeout(() => setPhase("decomposing"), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "decomposing") {
      const t = setTimeout(() => setPhase("gone"), 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "gone") {
      const t = setTimeout(() => { setPhase("typing"); setVisibleChars(0); }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="relative min-h-[100px]">
      <AnimatePresence mode="wait">
        {phase === "typing" && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-4 py-3"
          >
            <p className="font-mono text-xs text-foreground/70">{fullText.slice(0, visibleChars)}</p>
            {visibleChars < fullText.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="h-3.5 w-1 bg-gold/60" />
            )}
          </motion.div>
        )}

        {phase === "visible" && (
          <motion.div key="visible" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
            className="rounded-2xl rounded-bl-sm border border-gold/20 bg-gold/5 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/90">{fullText}</p>
              <Timer className="ml-3 h-3.5 w-3.5 flex-shrink-0 text-gold animate-pulse" />
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gold/10">
              <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 2, ease: "linear" }} className="h-full rounded-full bg-gold/60" />
            </div>
          </motion.div>
        )}

        {phase === "decomposing" && (
          <motion.div key="decomposing" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-wrap gap-1 rounded-2xl rounded-bl-sm border border-red-500/10 bg-red-500/5 px-4 py-3"
          >
            {fullText.split("").map((char, i) => (
              <motion.span key={i}
                animate={{ opacity: 0, y: -20 - Math.random() * 30, x: (Math.random() - 0.5) * 40, scale: 0 }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: [0.25, 0.4, 0.25, 1] }}
                className="inline-block font-mono text-xs text-red-400/70"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.div>
        )}

        {phase === "gone" && (
          <motion.div key="gone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-3"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground/40">Message expired</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StealthModeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 bottom-0 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 md:gap-16 lg:grid-cols-2">
          <div ref={contentRef}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-cyan-300">Stealth Mode</span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-5 max-w-[18ch] text-3xl font-bold leading-[1.04] sm:text-4xl md:text-[2.8rem]"
            >
              Keep sensitive conversations on a timer.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              Set a lifespan for each message. Share time-sensitive details knowing they disappear on schedule — no history, no trace.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-6 flex flex-wrap items-center gap-2"
            >
              {["Timed expiration", "Per-message control", "No history linger"].map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-cyan-400/80">
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
              <Link href="/features#stealth-mode"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-cyan-600 px-7 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                See stealth mode
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register"
                className="glass-card inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5"
              >
                Create account
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-6 space-y-2"
            >
              {[
                { icon: Eye, text: "Pick a timer per message" },
                { icon: Trash2, text: "Share what matters, then let it fade" },
                { icon: Shield, text: "Keep the thread, not the trail" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-cyan-500" />
                  <span className="text-muted-foreground">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-cyan-400/80">
                  Message decomposing in 3... 2... 1...
                </span>
              </div>
              <DecomposingMessage />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
