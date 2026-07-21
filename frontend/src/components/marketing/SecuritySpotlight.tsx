"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

const hexChars = "0123456789abcdef";
function randomHex(length: number) {
  return Array.from({ length }, () => hexChars[Math.floor(Math.random() * 16)]).join("");
}

function AnimatedKeyStream() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const steps = [
      "> Initializing E2EE handshake...",
      `> Session key: ${randomHex(16)}`,
      `> Exchange payload: ${randomHex(24)}`,
      "> Peer verified: aid_8F3kP29",
      `> Derived key: ${randomHex(32)}`,
      "> Secure channel established.",
      "> Encrypted payload: ready",
      "> Room key: active [E2EE]",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setLines((prev) => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLines([]);
          i = 0;
        }, 3000);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => (
        <motion.p
          key={`${line}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="font-mono text-[0.6rem] leading-relaxed tracking-wide text-emerald-400/80 sm:text-[0.65rem]"
        >
          {line}
        </motion.p>
      ))}
      {lines.length < 8 && lines.length > 0 && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block h-3 w-1.5 bg-emerald-400/60"
        />
      )}
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-[0.5rem] text-gold/20"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -40],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut",
          }}
        >
          {randomHex(6)}
        </motion.div>
      ))}
    </div>
  );
}

interface SecuritySpotlightProps {
  badge?: string;
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export default function SecuritySpotlight({
  badge = "Proof, Not Promise",
  title = "Highlight end-to-end encryption where trust decisions happen.",
  description = "The strongest part of anonimi is not just private identity. It is the combination of AID-first discovery, conversation-level encryption, and history boundaries that help people understand who can read what and when.",
  ctaHref = "/features#end-to-end-encryption",
  ctaLabel = "See encryption details",
  secondaryHref = "/about",
  secondaryLabel = "Why we built it",
}: SecuritySpotlightProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const isContentInView = useInView(contentRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      id="end-to-end-encryption"
      className="relative w-full scroll-mt-28 overflow-hidden border-y border-white/5 bg-[#0a0a0b] py-20 dark md:py-28"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-emerald-500/3 blur-[120px]" />
      </div>

      <FloatingParticles />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div ref={contentRef} className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isContentInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                {badge}
              </span>
            </div>

            <h2 className="mt-5 max-w-prose text-3xl font-bold leading-[1.04] text-white sm:text-4xl md:text-[2.8rem]">
              {title}
            </h2>

            <p className="mt-5 max-w-prose text-base leading-relaxed text-white/60 md:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={ctaHref}
                className="btn-gold inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryHref}
                className="glass-card inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                {secondaryLabel}
              </Link>
            </div>
          </motion.div>

          {/* Right: Terminal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isContentInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="glass-card overflow-hidden rounded-2xl border-emerald-500/10">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/3 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400/60" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                </div>
                <div className="ml-3 flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-emerald-400/60" />
                  <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Key Exchange — anonimi/vault
                  </span>
                </div>
              </div>

              {/* Terminal body */}
              <div className="min-h-[240px] bg-black/40 p-4 sm:p-5">
                {isInView ? <AnimatedKeyStream /> : null}
              </div>

              {/* Metadata footer */}
              <div className="grid gap-px bg-white/5 sm:grid-cols-2">
                <div className="bg-black/20 p-4">
                  <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/30">
                    message metadata
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-white/50">
                    <li>Encrypted before send</li>
                    <li>Versioned conversation key</li>
                    <li>Readable only to members</li>
                  </ul>
                </div>
                <div className="bg-black/20 p-4">
                  <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/30">
                    trust boundary
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-white/50">
                    <li>Server routes the payload</li>
                    <li>Clients hold the readable state</li>
                    <li>New members don&apos;t inherit old history</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
