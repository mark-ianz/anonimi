"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSection from "@/components/marketing/HeroSection";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import DifferenceSection from "@/components/marketing/DifferenceSection";
import CTASection from "@/components/marketing/CTASection";
import HowItWorksStep from "@/components/marketing/HowItWorksStep";
import SecuritySpotlight from "@/components/marketing/SecuritySpotlight";
import MessageFlowSection from "@/components/marketing/MessageFlowSection";
import MetricsSection from "@/components/marketing/MetricsSection";
import TemporaryAccessSection from "@/components/marketing/TemporaryAccessSection";
import StealthModeSection from "@/components/marketing/StealthModeSection";
import FAQSection from "@/components/marketing/FAQSection";
import { UserPlus, Share2, MessageCircle, Sparkles } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create an account, get your AID",
    description: "Sign up with email and receive your AID instantly. Usernames stay optional and auto-generated when skipped.",
  },
  {
    icon: Share2,
    title: "Share your AID or accept requests",
    description: "Share your AID with people you trust, or use message requests to stay in control of new contacts.",
  },
  {
    icon: MessageCircle,
    title: "Start messaging right away",
    description: "Jump into real-time conversations with delivery, typing, and read state built in.",
  },
];

function ChapterDivider() {
  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="h-px w-full max-w-xl bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      <div className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-gold/10 bg-background">
        <div className="h-1.5 w-1.5 rounded-full bg-gold/40" />
      </div>
    </div>
  );
}

function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ scaleX, opacity }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-gold/60 via-gold to-gold/60"
    />
  );
}

export default function LandingPage() {
  const chapter1Ref = useRef<HTMLDivElement>(null);
  const chapter2Ref = useRef<HTMLDivElement>(null);
  const chapter3Ref = useRef<HTMLDivElement>(null);
  const chapter4Ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <ProgressBar />

      {/* CHAPTER 1: Identity — Hero + how it works + use cases */}
      <div ref={chapter1Ref}>
        <HeroSection />

        <section className="relative w-full overflow-hidden py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-gold/3 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                <Sparkles className="h-3 w-3 text-gold" />
                <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                  Start In Minutes
                </span>
              </div>
              <h2 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]">
                A quiet setup flow designed for focus.
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Create your identity, share it once, then talk privately across every device.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-0 right-0 top-[72px] hidden h-px md:block">
                <div className="h-full w-full bg-gradient-to-r from-gold/5 via-gold/15 to-gold/5" />
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                  className="h-full origin-left bg-gradient-to-r from-gold via-gold/40 to-transparent"
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
                {steps.map((step, index) => (
                  <HowItWorksStep
                    key={step.title}
                    number={index + 1}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <ChapterDivider />

      {/* CHAPTER 2: The Flow — Use cases + message flow + features */}
      <div ref={chapter2Ref}>
        <MessageFlowSection />
        <FeatureGrid />
      </div>

      <ChapterDivider />

      {/* CHAPTER 3: The Modes — Temp access + stealth + difference + security */}
      <div ref={chapter3Ref}>
        <TemporaryAccessSection />
        <StealthModeSection />
        <DifferenceSection />
        <SecuritySpotlight />
      </div>

      <ChapterDivider />

      {/* CHAPTER 4: The Proof — Metrics + FAQ + CTA */}
      <div ref={chapter4Ref}>
        <MetricsSection />

        <section className="relative w-full py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-gold/3 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                <Sparkles className="h-3 w-3 text-gold" />
                <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                  FAQ
                </span>
              </div>
              <h2 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-[2.8rem]">
                Questions, answered.
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Everything you need to know about anonimi.
              </p>
            </div>

            <FAQSection />
          </div>
        </section>

        <CTASection />
      </div>
    </>
  );
}
