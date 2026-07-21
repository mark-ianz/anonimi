"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MessageCircle,
  Shield,
  Zap,
  Bell,
  KeyRound,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Instant delivery with typing indicators and read receipts. Conversations stay fluid across all your devices with seamless sync.",
  },
  {
    icon: Shield,
    title: "Privacy-First Identity",
    description: "Your AID is generated for you with email-only signup. No phone required, no tracking, just secure communication.",
  },
  {
    icon: KeyRound,
    title: "Conversation Keys",
    description: "End-to-end encrypted rooms with conversation-level keys. Each room gets its own key — no master key, no backdoor.",
  },
  {
    icon: Zap,
    title: "Low-Latency Sync",
    description: "Built for real-time delivery. Messages arrive in milliseconds, not seconds. Optimized for flaky networks.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Customize notification preferences per chat. Stay informed without being overwhelmed by noise.",
  },
];

export default function FeatureGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1, margin: "-80px" });
  const isHeadingInView = useInView(headingRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[300px] w-[300px] rounded-full bg-gold/3 blur-[100px]" />
        <div className="absolute right-0 bottom-1/3 h-[250px] w-[250px] rounded-full bg-gold/2 blur-[80px]" />
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
                Features
              </span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]"
          >
            Everything you need, nothing you don't.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Five core features. No bloat. Just secure, private messaging.
          </motion.p>
        </div>

        <div className="space-y-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                className="group cursor-pointer"
              >
                <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow/30 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
                      <Icon className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
