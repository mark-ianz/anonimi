"use client";

import { motion } from "framer-motion";
import { Lock, Server, MessageCircle, Sparkles } from "lucide-react";

interface FlowStep {
  icon: typeof Lock;
  title: string;
  subtitle: string;
}

const steps: FlowStep[] = [
  { icon: Lock, title: "Encrypt", subtitle: "Locked on your device" },
  { icon: Server, title: "Route", subtitle: "Server relays blind" },
  { icon: MessageCircle, title: "Deliver", subtitle: "Decrypted on theirs" },
];

export default function MessageFlowSection() {
  return (
    <section className="relative w-full overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                Message Flow
              </span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]"
          >
            Three steps. Zero exposure.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-pretty text-base text-muted-foreground"
          >
            Encrypt on send, route without reading, decrypt on arrival. The server never sees your content.
          </motion.p>
        </div>

        <div className="relative hidden md:flex">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            return (
              <div key={stepItem.title} className="contents">
                <div className="flex flex-1 justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: 0.15 * (index + 1), ease: [0.25, 0.4, 0.25, 1] }}
                    className="relative z-10 flex flex-col items-center"
                  >
                    <div className="flex h-18 w-18 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.07] sm:h-20 sm:w-20">
                      <Icon className="h-7 w-7 text-gold sm:h-8 sm:w-8" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-base font-bold text-foreground sm:text-lg">{stepItem.title}</p>
                      <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground/50">
                        {stepItem.subtitle}
                      </p>
                    </div>
                  </motion.div>
                </div>
                {index < steps.length - 1 && (
                  <div className="relative mx-2 w-12 flex-shrink-0 self-center sm:w-16">
                    <div className="h-px w-full bg-gradient-to-r from-gold/30 via-gold/10 to-gold/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 md:hidden">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            return (
              <motion.div
                key={stepItem.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: 0.08 * index, ease: [0.25, 0.4, 0.25, 1] }}
                className="glass-card flex items-center gap-4 rounded-xl p-4"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{stepItem.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stepItem.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
