import HeroSection from "@/components/marketing/HeroSection";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import CTASection from "@/components/marketing/CTASection";
import HowItWorksStep from "@/components/marketing/HowItWorksStep";
import { UserPlus, Share2, MessageCircle } from "lucide-react";
import Link from "next/link";

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

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-12 border-l border-border/70 pl-5 md:mb-14 md:pl-6">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Start In Minutes
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-[1.02] font-semibold sm:text-4xl md:text-[2.8rem]">
              A quiet setup flow designed for focus.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Create your identity, share it once, then talk privately across every device.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {steps.map((step, index) => (
              <HowItWorksStep
                key={step.title}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      <FeatureGrid />

      <section className="relative py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(245,158,11,0.12),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(245,158,11,0.08),transparent_45%)]" />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-12 md:mb-14">
            <p className="inline-flex rounded-full border border-border/70 bg-card/70 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Temporary Access
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl leading-[0.98] font-semibold sm:text-4xl md:text-[2.9rem]">
              Start instantly, keep it when it matters.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Temporary Access gives you a full 24-hour session without commitment. The benefit: you can jump into a chat right away,
              then convert to a permanent account the moment you decide the conversation is worth keeping.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-background to-background p-7 shadow-soft">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/15 blur-2xl" />
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h3 className="text-2xl font-semibold">Fast entry, zero friction.</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Use it when you need an immediate line of communication. Keep control by claiming only when you are sure.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-200">
                  <span className="rounded-full border border-amber-500/45 bg-amber-500/15 px-3 py-1">Session-only</span>
                  <span className="rounded-full border border-amber-500/45 bg-amber-500/15 px-3 py-1">Claim to keep</span>
                  <span className="rounded-full border border-amber-500/45 bg-amber-500/15 px-3 py-1">24h expiration</span>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <Link
                    href="/temporary"
                    className="inline-flex h-10 items-center rounded-full bg-amber-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-amber-600/90"
                  >
                    Start temporary session
                  </Link>
                  <Link
                    href="/features#temporary-access"
                    className="inline-flex h-10 items-center rounded-full border border-amber-500/40 px-5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-200"
                  >
                    Learn how it works
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-5">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-amber-800/80">
                    Benefit
                  </p>
                  <h4 className="mt-3 text-lg font-semibold">Move fast without losing your option to stay.</h4>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Perfect for first-time contacts, one-off collaborations, or trial conversations that may become long-term.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-5">
                  <p className="text-xs font-semibold text-foreground">Best for</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>Fast intros with new partners</li>
                    <li>Short-lived project rooms</li>
                    <li>Trial chats before claiming</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(6,182,212,0.12),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(6,182,212,0.08),transparent_45%)]" />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-12 md:mb-14">
            <p className="inline-flex rounded-full border border-border/70 bg-card/70 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Stealth Mode
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl leading-[0.98] font-semibold sm:text-4xl md:text-[2.9rem]">
              Keep sensitive conversations on a timer.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Stealth Mode lets you set a lifespan for each message. The benefit: you can share time-sensitive updates or
              confidential details knowing they disappear on schedule.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-background to-background p-7 shadow-soft">
            <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl" />
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-5">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-cyan-700/80">
                  Benefit
                </p>
                <h4 className="mt-3 text-lg font-semibold">Share fast, reduce exposure.</h4>
                <p className="mt-3 text-sm text-muted-foreground">
                  Best for temporary access codes, quick location drops, and sensitive collaboration moments.
                </p>
                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span>Pick a timer per message</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span>Share what matters, then let it fade</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span>Keep the thread, not the trail</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Control the trail, not the conversation.</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Set timers per message and keep chats clear of lingering sensitive details while staying in the same thread.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                  <span className="rounded-full border border-cyan-500/45 bg-cyan-500/15 px-3 py-1">Timed expiration</span>
                  <span className="rounded-full border border-cyan-500/45 bg-cyan-500/15 px-3 py-1">Per-message control</span>
                  <span className="rounded-full border border-cyan-500/45 bg-cyan-500/15 px-3 py-1">No history linger</span>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <Link
                    href="/features#stealth-mode"
                    className="inline-flex h-10 items-center rounded-full bg-cyan-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-cyan-600/90"
                  >
                    See stealth mode
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center rounded-full border border-cyan-500/40 px-5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-500/10"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
