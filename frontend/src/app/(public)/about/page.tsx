import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Sparkles, Users2, Orbit } from "lucide-react";

export const metadata: Metadata = {
  title: "About EchoID",
  description: "Learn about the EchoID platform and our mission.",
};

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_14%_12%,rgba(13,57,82,0.16),transparent_44%),radial-gradient(circle_at_86%_24%,rgba(58,117,133,0.15),transparent_45%)]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <section className="pb-10 border-b border-border/50">
          <p className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            About EchoID
          </p>
          <h1 className="mt-4 max-w-[18ch] text-4xl font-display font-bold leading-[0.95] sm:text-5xl">
            We build identity-safe conversations for real people.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            EchoID exists because private communication should not demand personal exposure. Our platform is designed around aliases, recovery-safe onboarding, and moderation controls that keep people in control.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <article>
            <div className="h-11 w-11 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Deliver a secure, forgiving messaging experience where identity is protected by default and users are never trapped by brittle account flows.
            </p>
          </article>

          <article>
            <div className="h-11 w-11 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">What Makes Us Different</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              <li>Alias-first discovery with generated EchoIDs</li>
              <li>Email-only onboarding with optional username</li>
              <li>Recoverable verification flow with resend support</li>
              <li>User safety controls with block, report, and moderation tooling</li>
            </ul>
          </article>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-8 border-t border-border/45 pt-8 md:grid-cols-[1fr_0.8fr] md:gap-10">
          <article>
            <div className="h-11 w-11 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">The Team</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              We are designers and engineers focused on privacy UX, real-time systems, and resilient account architecture. Every major flow is reviewed for clarity, failure recovery, and user trust.
            </p>
          </article>

          <article>
            <div className="h-11 w-11 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
              <Orbit className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Talk to Us</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Questions, ideas, or feedback are welcome.
            </p>
            <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
              Open contact page
            </Link>
          </article>
        </section>

        <section className="mt-10 border-t border-border/45 pt-8">
          <h3 className="text-2xl font-semibold">Design Principle</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Identity should reduce attack surface, not create onboarding friction. EchoID combines private aliases with recovery-friendly verification so secure communication stays usable.
          </p>
        </section>
      </div>
    </div>
  );
}
