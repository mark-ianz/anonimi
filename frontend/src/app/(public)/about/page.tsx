import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Sparkles, Users2, Orbit, Lock, Zap, Heart, Globe, ArrowRight, MessageCircle, Eye, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnimatedSection,
  AnimatedText,
  AnimatedElement,
  AnimatedCard,
  AnimatedBadge,
  AnimatedList,
  AnimatedListItem,
  AnimatedButton,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/AnimatedSection";

export const metadata: Metadata = {
  title: "About anonimi",
  description: "Learn about the anonimi platform and our mission to create identity-safe conversations.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_14%_12%,rgba(13,57,82,0.16),transparent_44%),radial-gradient(circle_at_86%_24%,rgba(58,117,133,0.15),transparent_45%)]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <AnimatedSection className="pb-12 border-b border-border/50">
          <AnimatedBadge className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            About anonimi
          </AnimatedBadge>
          <AnimatedText delay={0.1}>
            <h1 className="mt-4 max-w-[20ch] text-4xl font-bold leading-[1.1] sm:text-5xl md:text-6xl">
              We build identity-safe conversations for real people.
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              anonimi exists because private communication should not demand personal exposure. Our platform is designed around AIDs, end-to-end encrypted conversations, recovery-safe onboarding, and moderation controls that keep people in control.
            </p>
          </AnimatedText>
          <AnimatedElement delay={0.3} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register" className="inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/features">Explore Features</Link>
            </Button>
          </AnimatedElement>
        </AnimatedSection>

        {/* Stats Section */}
        <AnimatedSection delay={0.1} className="py-12 border-b border-border/50">
          <StaggerContainer className="grid grid-cols-2 gap-6 md:grid-cols-4" staggerDelay={0.1}>
            <StaggerItem>
              <div className="rounded-xl border border-border/40 bg-card/30 p-5 text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">100%</p>
                <p className="mt-1 text-sm text-muted-foreground">Privacy First</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-xl border border-border/40 bg-card/30 p-5 text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">0</p>
                <p className="mt-1 text-sm text-muted-foreground">Data Sold</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-xl border border-border/40 bg-card/30 p-5 text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">E2E</p>
                <p className="mt-1 text-sm text-muted-foreground">Encrypted</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-xl border border-border/40 bg-card/30 p-5 text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">24/7</p>
                <p className="mt-1 text-sm text-muted-foreground">Moderation</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </AnimatedSection>

        <AnimatedSection delay={0.12} className="mt-12">
          <div className="grid gap-6 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-background to-background p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <AnimatedBadge className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                Security Philosophy
              </AnimatedBadge>
              <AnimatedText delay={0.08}>
                <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                  Encryption should be understandable, not mystical.
                </h2>
              </AnimatedText>
              <AnimatedText delay={0.12}>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  We care about making privacy legible. That means helping people understand identity boundaries, message lifetime, and exactly who cannot read a thread. Strong security is only useful when users can trust the behavior they see.
                </p>
              </AnimatedText>
            </div>
            <div className="grid gap-4">
              <AnimatedCard delay={0.16} className="rounded-2xl border border-border/60 bg-background/70 p-5">
                <p className="text-sm font-semibold text-foreground">What we optimize for</p>
                <AnimatedList className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <AnimatedListItem>Private identity before connection</AnimatedListItem>
                  <AnimatedListItem>End-to-end encrypted conversations by default</AnimatedListItem>
                  <AnimatedListItem>Message content unavailable to admins and moderators</AnimatedListItem>
                  <AnimatedListItem>Clear recovery paths when things go wrong</AnimatedListItem>
                </AnimatedList>
              </AnimatedCard>
              <AnimatedCard delay={0.2} className="rounded-2xl border border-border/60 bg-background/70 p-5">
                <p className="text-sm font-semibold text-foreground">What we avoid</p>
                <AnimatedList className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <AnimatedListItem>Phone-number-first identity requirements</AnimatedListItem>
                  <AnimatedListItem>Security claims that only live in footnotes</AnimatedListItem>
                  <AnimatedListItem>Fragile flows that punish ordinary mistakes</AnimatedListItem>
                </AnimatedList>
              </AnimatedCard>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.14} className="mt-8">
          <div className="rounded-[1.75rem] border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-background to-background p-6 md:p-7">
            <AnimatedBadge className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
              Plain-language privacy
            </AnimatedBadge>
            <AnimatedText delay={0.08}>
              <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
                We can run the service without reading your encrypted messages.
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.12}>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                That includes moderators and super admins. Admin tools can handle reports, bans, support, and audit logs, but they do not expose the contents of end-to-end encrypted conversations.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* Mission & Difference Section */}
        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <AnimatedCard delay={0}>
            <article className="h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
              <AnimatedElement delay={0.05}>
                <div className="h-12 w-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
              </AnimatedElement>
              <AnimatedText delay={0.1}>
                <h2 className="mt-5 text-2xl font-semibold">Our Mission</h2>
              </AnimatedText>
              <AnimatedText delay={0.15}>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Deliver a secure, forgiving messaging experience where identity is protected by default and users are never trapped by brittle account flows.
                </p>
              </AnimatedText>
              <AnimatedText delay={0.2}>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  We believe privacy is a right, not a premium feature. Everyone deserves the ability to communicate without surveillance or fear.
                </p>
              </AnimatedText>
            </article>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <article className="h-full rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background p-6">
              <AnimatedElement delay={0.15}>
                <div className="h-12 w-12 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
              </AnimatedElement>
              <AnimatedText delay={0.2}>
                <h2 className="mt-5 text-2xl font-semibold">What Makes Us Different</h2>
              </AnimatedText>
              <AnimatedList className="mt-4 space-y-3" staggerDelay={0.08}>
                <AnimatedListItem className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground md:text-base">AID-first discovery with generated identifiers</span>
                </AnimatedListItem>
                <AnimatedListItem className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground md:text-base">Email-only onboarding with optional username</span>
                </AnimatedListItem>
                <AnimatedListItem className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground md:text-base">Recoverable verification flow with resend support</span>
                </AnimatedListItem>
                <AnimatedListItem className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground md:text-base">User safety controls with block, report, and moderation</span>
                </AnimatedListItem>
              </AnimatedList>
            </article>
          </AnimatedCard>
        </section>

        {/* How It Works Section */}
        <AnimatedSection delay={0.1} className="mt-16">
          <AnimatedText>
            <h2 className="text-center text-2xl font-semibold md:text-3xl">How anonimi Works</h2>
          </AnimatedText>
          <AnimatedText delay={0.1}>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
              A simple, secure flow designed to protect your identity from the start.
            </p>
          </AnimatedText>
        </AnimatedSection>

        <StaggerContainer className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3" staggerDelay={0.12}>
          <StaggerItem>
            <div className="relative rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
              <div className="mt-2 h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="mt-4 font-semibold">Create Your AID</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign up with just an email. We generate a unique anonymous identifier (AID) that protects your real identity.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="relative rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </div>
              <div className="mt-2 h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="mt-4 font-semibold">Connect Securely</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Share your AID to connect with others. All messages are end-to-end encrypted by default.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="relative rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </div>
              <div className="mt-2 h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-violet-500" />
              </div>
              <h3 className="mt-4 font-semibold">Stay in Control</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use stealth mode, temporary access, and moderation tools to control your privacy at every step.
              </p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Values Section */}
        <AnimatedSection delay={0.1} className="mt-16">
          <AnimatedText>
            <h2 className="text-center text-2xl font-semibold md:text-3xl">Our Core Values</h2>
          </AnimatedText>
          <AnimatedText delay={0.1}>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
              These principles guide every decision we make, from product design to how we interact with our community.
            </p>
          </AnimatedText>
        </AnimatedSection>

        <StaggerContainer className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
          <StaggerItem>
            <div className="group h-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10">
              <div className="h-10 w-10 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="mt-4 font-semibold">Privacy by Design</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Security is built into the foundation, not bolted on as an afterthought.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group h-full rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10">
              <div className="h-10 w-10 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="mt-4 font-semibold">Simplicity First</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Complex features made accessible through intuitive, clean interfaces.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group h-full rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10">
              <div className="h-10 w-10 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <h3 className="mt-4 font-semibold">User Trust</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every feature is reviewed for clarity, failure recovery, and user confidence.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group h-full rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10">
              <div className="h-10 w-10 rounded-lg border border-violet-500/30 bg-violet-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-violet-500" />
              </div>
              <h3 className="mt-4 font-semibold">Open Standards</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We build on proven protocols and contribute back to the community.
              </p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Team & Contact Section */}
        <section className="mt-16 grid grid-cols-1 gap-8 border-t border-border/45 pt-12 md:grid-cols-[1fr_0.8fr] md:gap-10">
          <AnimatedCard delay={0}>
            <article className="h-full rounded-2xl border border-border/60 bg-card/50 p-6">
              <AnimatedElement delay={0.05}>
                <div className="h-12 w-12 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                  <Users2 className="h-6 w-6 text-primary" />
                </div>
              </AnimatedElement>
              <AnimatedText delay={0.1}>
                <h2 className="mt-5 text-2xl font-semibold">The Team</h2>
              </AnimatedText>
              <AnimatedText delay={0.15}>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  We are designers and engineers focused on privacy UX, real-time systems, and resilient account architecture. Every major flow is reviewed for clarity, failure recovery, and user trust, including how we keep admin access away from encrypted content.
                </p>
              </AnimatedText>
              <AnimatedText delay={0.2}>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Our team brings experience from leading tech companies, with a shared belief that communication tools should empower users without compromising their identity.
                </p>
              </AnimatedText>
            </article>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <article className="h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
              <AnimatedElement delay={0.15}>
                <div className="h-12 w-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <Orbit className="h-6 w-6 text-primary" />
                </div>
              </AnimatedElement>
              <AnimatedText delay={0.2}>
                <h2 className="mt-5 text-2xl font-semibold">Talk to Us</h2>
              </AnimatedText>
              <AnimatedText delay={0.25}>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Questions, ideas, or feedback are welcome. We read every message and respond thoughtfully.
                </p>
              </AnimatedText>
              <AnimatedButton delay={0.3} className="mt-5">
                <Button asChild>
                  <Link href="/contact" className="inline-flex items-center gap-2">
                    Open Contact Page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </AnimatedButton>
            </article>
          </AnimatedCard>
        </section>

        {/* Design Principle Section */}
        <AnimatedSection delay={0.1} className="mt-16 border-t border-border/45 pt-12">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-background p-8 md:p-10">
            <AnimatedBadge className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
              Philosophy
            </AnimatedBadge>
            <AnimatedText delay={0.1}>
              <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Design Principle</h2>
            </AnimatedText>
            <AnimatedText delay={0.15}>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Identity should reduce attack surface, not create onboarding friction. anonimi combines private aliases with recovery-friendly verification so secure communication stays usable.
              </p>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                We obsess over the details that matter: clear error messages, graceful recovery paths, and interfaces that respect your time and attention. Security should feel effortless.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection delay={0.15} className="mt-20 text-center">
          <AnimatedElement direction="scale">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </AnimatedElement>
          <AnimatedText delay={0.1}>
            <h2 className="mt-6 text-2xl font-semibold md:text-3xl">Ready to experience privacy-first messaging?</h2>
          </AnimatedText>
          <AnimatedText delay={0.15}>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of users who trust anonimi for secure, identity-safe conversations.
            </p>
          </AnimatedText>
          <AnimatedButton delay={0.2} className="mt-8 inline-block">
            <Button size="lg" asChild>
              <Link href="/register" className="inline-flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </AnimatedButton>
        </AnimatedSection>
      </div>
    </div>
  );
}
