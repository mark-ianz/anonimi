import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react";

interface SecuritySpotlightProps {
  badge?: string;
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

const pillars = [
  {
    icon: ShieldCheck,
    title: "End-to-end encrypted",
    description: "Messages are encrypted before they leave the sender and only decrypted on participant devices.",
  },
  {
    icon: KeyRound,
    title: "Per-conversation keys",
    description: "Private chats and group threads keep their own keys so access stays scoped to the right room.",
  },
  {
    icon: Lock,
    title: "Identity-safe by design",
    description: "Your AID is the thing you share, not your personal contact details.",
  },
];

export default function SecuritySpotlight({
  badge = "Security Layer",
  title = "End-to-end encryption that feels built in, not bolted on.",
  description = "anonimi keeps encryption visible where it matters and quiet where it should be. Private identity, per-conversation keys, and controlled access all work together so sensitive conversations stay readable only to the people inside them.",
  ctaHref = "/features#end-to-end-encryption",
  ctaLabel = "See encryption details",
  secondaryHref = "/register",
  secondaryLabel = "Create account",
}: SecuritySpotlightProps) {
  return (
    <section
      id="end-to-end-encryption"
      className="relative scroll-mt-28 py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_24%,rgba(16,185,129,0.12),transparent_36%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.12),transparent_34%)]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/75 bg-card/65 shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-border/60 p-7 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {badge}
              </p>

              <h2 className="mt-5 max-w-[16ch] text-3xl font-semibold leading-[1.02] sm:text-4xl md:text-[2.9rem]">
                {title}
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {description}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {pillars.map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={`rounded-2xl border border-border/60 bg-background/70 p-4 ${index === 2 ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            <div className="p-7 sm:p-8">
              <div className="rounded-[1.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-5">
                <div className="flex items-center justify-between border-b border-border/55 pb-3">
                  <div>
                    <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Encrypted thread
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Room key active
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
                    <Sparkles className="h-3 w-3" />
                    E2EE on
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-background/85 px-4 py-3">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                      sender payload
                    </p>
                    <p className="mt-2 break-all font-mono text-xs leading-relaxed text-foreground/75">
                      a9kX2fLm81Qb...7qYg4m2R
                    </p>
                  </div>

                  <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-emerald-700/80 dark:text-emerald-200/80">
                      recipient view
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      Meeting point changed. Use the side entrance.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                      message metadata
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Encrypted before send</li>
                      <li>Versioned conversation key</li>
                      <li>Readable only to members</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                      trust boundary
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Server routes the payload</li>
                      <li>Clients hold the readable state</li>
                      <li>New members don&apos;t inherit old history</li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-11 rounded-full px-6 text-sm font-semibold" asChild>
                  <Link href={ctaHref}>
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-border/80 bg-background/70 px-6 text-sm font-semibold"
                  asChild
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
