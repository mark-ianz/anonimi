"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

function LiveCounter() {
  const [count, setCount] = useState(2847);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const digits = String(count).split("");

  return (
    <div className="inline-flex items-center gap-1">
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-white/40 mr-1">
        Claimed today
      </span>
      {digits.map((d, i) => (
        <motion.span
          key={`${d}-${i}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="inline-flex h-6 w-5 items-center justify-center rounded bg-white/10 font-mono text-xs font-bold text-white"
        >
          {d}
        </motion.span>
      ))}
    </div>
  );
}

export default function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useTransform(mouseX, [-300, 300], [-20, 20]);
  const bgY = useTransform(mouseY, [-300, 300], [-20, 20]);

  function handleMouse(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouse}
      className="relative w-full overflow-hidden bg-[#0a0a0b] py-24 dark md:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: bgX, y: bgY }}
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="h-full w-full rounded-full bg-gradient-to-br from-gold/15 via-gold/8 to-transparent blur-[100px]" />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(202,138,4,0.06)_0%,transparent_70%)]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
              Start With anonimi
            </span>
          </div>

          <h2 className="mt-5 text-balance text-3xl leading-[1.04] font-bold text-white sm:text-4xl md:text-[2.8rem]">
            Ready to switch to{" "}
            <span className="gold-text-shimmer">AID-first messaging</span>
            ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Start free, claim your AID, and launch secure conversations in minutes.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="btn-gold inline-flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
            >
              Get your AID
              <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="glass-card inline-flex h-12 items-center rounded-xl border border-white/10 px-7 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Learn More
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <LiveCounter />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
