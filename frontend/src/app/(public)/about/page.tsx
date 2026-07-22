"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldCheck, Sparkles, Users2, Orbit, Lock, Zap, Heart, Globe, ArrowRight, MessageCircle, Eye, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function Section({ children, className, delay = 0 }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
      <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
        {label}
      </span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_14%_12%,rgba(202,138,4,0.07),transparent_44%),radial-gradient(circle_at_86%_24%,rgba(202,138,4,0.05),transparent_45%)]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <Section className="border-b border-gold/10 pb-12">
          <Badge label="About anonimi" />
          <h1 className="mt-4 max-w-[20ch] text-4xl font-bold leading-[1.1] sm:text-5xl md:text-6xl">
            We build identity-safe conversations for real people.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            anonimi exists because private communication should not demand personal exposure. Our platform is designed around AIDs, end-to-end encrypted conversations, recovery-safe onboarding, and moderation controls that keep people in control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="btn-gold rounded-full px-5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]" size="lg" asChild>
              <Link href="/register" className="inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full border-gold/20 px-5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]" size="lg" asChild>
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>
        </Section>

        {/* Stats */}
        <Section delay={0.08} className="border-b border-gold/10 py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: "100%", label: "Privacy First" },
              { value: "0", label: "Data Sold" },
              { value: "E2E", label: "Encrypted" },
              { value: "24/7", label: "Moderation" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
                className="glass-card rounded-xl p-5 text-center"
              >
                <p className="text-3xl font-bold text-gold md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Security Philosophy */}
        <Section delay={0.1} className="mt-12">
          <div className="grid gap-6 rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <Badge label="Security Philosophy" />
              <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                Encryption should be understandable, not mystical.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                We care about making privacy legible. That means helping people understand identity boundaries, message lifetime, and exactly who cannot read a thread. Strong security is only useful when users can trust the behavior they see.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-xl border border-gold/10 bg-card/50 p-5">
                <p className="text-sm font-semibold text-foreground">What we optimize for</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Private identity before connection",
                    "End-to-end encrypted conversations by default",
                    "Message content unavailable to admins and moderators",
                    "Clear recovery paths when things go wrong",
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
                      className="flex items-center gap-3"
                    >
                      <ShieldCheck className="h-4 w-4 flex-shrink-0 text-gold" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gold/10 bg-card/50 p-5">
                <p className="text-sm font-semibold text-foreground">What we avoid</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Phone-number-first identity requirements",
                    "Security claims that only live in footnotes",
                    "Fragile flows that punish ordinary mistakes",
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-gold/30 text-[0.55rem] text-gold">x</span>
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Plain-language privacy */}
        <Section delay={0.12} className="mt-8">
          <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-7">
            <Badge label="Plain-language privacy" />
            <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
              We can run the service without reading your encrypted messages.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              That includes moderators and super admins. Admin tools can handle reports, bans, support, and audit logs, but they do not expose the contents of end-to-end encrypted conversations.
            </p>
          </div>
        </Section>

        {/* Mission & Difference */}
        <Section delay={0.14} className="mt-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                <ShieldCheck className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Our Mission</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Deliver a secure, forgiving messaging experience where identity is protected by default and users are never trapped by brittle account flows.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                We believe privacy is a right, not a premium feature. Everyone deserves the ability to communicate without surveillance or fear.
              </p>
            </div>
            <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                <Sparkles className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">What Makes Us Different</h2>
              <div className="mt-4 space-y-3">
                {[
                  "AID-first discovery with generated identifiers",
                  "Email-only onboarding with optional username",
                  "Recoverable verification flow with resend support",
                  "User safety controls with block, report, and moderation",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold/60" />
                    <span className="text-sm text-muted-foreground md:text-base">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* How It Works */}
        <Section delay={0.16} className="mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold md:text-3xl">How anonimi Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              A simple, secure flow designed to protect your identity from the start.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: 1,
                icon: Shield,
                color: "text-gold border-gold/20 bg-gold/10",
                title: "Create Your AID",
                desc: "Sign up with just an email. We generate a unique anonymous identifier (AID) that protects your real identity.",
              },
              {
                step: 2,
                icon: MessageCircle,
                color: "text-gold border-gold/20 bg-gold/10",
                title: "Connect Securely",
                desc: "Share your AID to connect with others. All messages are end-to-end encrypted by default.",
              },
              {
                step: 3,
                icon: Eye,
                color: "text-gold border-gold/20 bg-gold/10",
                title: "Stay in Control",
                desc: "Use stealth mode, temporary access, and moderation tools to control your privacy at every step.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                  className="glass-card relative rounded-xl p-6"
                >
                  <div className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">
                    {item.step}
                  </div>
                  <div className={`mt-2 flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* Core Values */}
        <Section delay={0.18} className="mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold md:text-3xl">Our Core Values</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              These principles guide every decision we make, from product design to how we interact with our community.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lock, title: "Privacy by Design", desc: "Security is built into the foundation, not bolted on as an afterthought." },
              { icon: Zap, title: "Simplicity First", desc: "Complex features made accessible through intuitive, clean interfaces." },
              { icon: Heart, title: "User Trust", desc: "Every feature is reviewed for clarity, failure recovery, and user confidence." },
              { icon: Globe, title: "Open Standards", desc: "We build on proven protocols and contribute back to the community." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
                  className="glass-card group rounded-xl border border-gold/10 p-5 transition-all hover:border-gold/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* Team & Contact */}
        <Section delay={0.2} className="mt-16 border-t border-gold/10 pt-12">
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-gold/10 bg-card/50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-background/45">
                <Users2 className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">The Team</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                We are designers and engineers focused on privacy UX, real-time systems, and resilient account architecture. Every major flow is reviewed for clarity, failure recovery, and user trust, including how we keep admin access away from encrypted content.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Our team brings experience from leading tech companies, with a shared belief that communication tools should empower users without compromising their identity.
              </p>
            </div>
            <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                <Orbit className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Talk to Us</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Questions, ideas, or feedback are welcome. We read every message and respond thoughtfully.
              </p>
              <div className="mt-5">
                <Button className="btn-gold rounded-full px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]" asChild>
                  <Link href="/contact" className="inline-flex items-center gap-2">
                    Open Contact Page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Design Principle */}
        <Section delay={0.22} className="mt-16 border-t border-gold/10 pt-12">
          <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-8 md:p-10">
            <Badge label="Philosophy" />
            <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Design Principle</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Identity should reduce attack surface, not create onboarding friction. anonimi combines private aliases with recovery-friendly verification so secure communication stays usable.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              We obsess over the details that matter: clear error messages, graceful recovery paths, and interfaces that respect your time and attention. Security should feel effortless.
            </p>
          </div>
        </Section>

        {/* CTA */}
        <Section delay={0.24} className="mt-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <ShieldCheck className="h-8 w-8 text-gold" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold md:text-3xl">Ready to experience privacy-first messaging?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of users who trust anonimi for secure, identity-safe conversations.
          </p>
          <div className="mt-8 inline-block">
            <Button className="btn-gold rounded-full px-6 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]" size="lg" asChild>
              <Link href="/register" className="inline-flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
