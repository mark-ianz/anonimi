import type { Metadata } from "next";
import { MessageCircle, Shield, Users, Zap, Lock, Bell, Image } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollToHash from "@/components/marketing/ScrollToHash";

export const metadata: Metadata = {
  title: "anonimi Features",
  description: "Explore anonimi's messaging, groups, privacy, and moderation features.",
};

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Fast delivery with read state, typing indicators, and responsive sync across devices.",
    details: [
      "Instant message delivery",
      "Typing indicators",
      "Read receipts",
      "Message reactions",
    ],
  },
  {
    icon: Shield,
    title: "Privacy-First Identity",
    description: "Your AID is generated with email-only signup, optional usernames, and no phone requirement at registration.",
    details: [
      "Unique generated AID",
      "No phone number required",
      "Optional auto-generated username",
      "Public profile options",
      "Custom display names",
    ],
  },
  {
    icon: Users,
    title: "Group Chats",
    description: "Create groups with roles, nicknames, and rich settings. Perfect for teams, friends, and communities.",
    details: [
      "Role-based permissions",
      "Custom nicknames",
      "Group settings",
      "Join requests",
    ],
  },
  {
    icon: Image,
    title: "Media Sharing",
    description: "Share images, files, and more directly in your conversations.",
    details: [
      "Image sharing",
      "File attachments",
      "Preview support",
      "Media compression",
    ],
  },
  {
    icon: Lock,
    title: "Block & Report System",
    description: "Full control over who can contact you. Block users and report inappropriate behavior.",
    details: [
      "Message requests",
      "Block users",
      "Report violations",
      "Privacy settings",
    ],
  },
  {
    icon: Zap,
    title: "Admin & Moderation",
    description: "Platform integrity is our priority. Comprehensive moderation tools keep the community safe.",
    details: [
      "Report queue",
      "User banning",
      "Content moderation",
      "Activity logs",
    ],
  },
];

const mockKinds = [
  "chat",
  "identity",
  "group",
  "media",
  "safety",
  "admin",
] as const;
type MockKind = (typeof mockKinds)[number];

function FeatureMock({ kind }: { kind: MockKind }) {
  if (kind === "identity") {
    return (
      <div className="relative z-10 w-full px-6 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
              Identity card
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">AID: aid_7F2•KQ</p>
          </div>
          <div className="h-9 w-9 rounded-full border border-border/60 bg-card/80" />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">Username</p>
            <p className="mt-1 font-semibold text-foreground">silent.orbit</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">Verification</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-border/60 bg-background px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                Email
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-primary">
                Resume Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "group") {
    return (
      <div className="relative z-10 w-full px-6 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
              Group room
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">Studio Dispatch</p>
          </div>
          <span className="rounded-full border border-border/60 bg-background px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
            12 members
          </span>
        </div>
        <div className="space-y-3">
          {[
            "Owner · aid_2S9",
            "Admin · aid_8L4",
            "Member · aid_5J1",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
              <span className="text-foreground">{label}</span>
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">Active</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "media") {
    return (
      <div className="relative z-10 w-full px-6 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            Media drop
          </p>
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">3 files</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl border border-border/60 bg-card/80" />
          <div className="h-24 rounded-2xl border border-border/60 bg-card/80" />
          <div className="col-span-2 h-24 rounded-2xl border border-border/60 bg-card/80" />
        </div>
      </div>
    );
  }

  if (kind === "safety") {
    return (
      <div className="relative z-10 w-full px-6 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            Safety controls
          </p>
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">Live</span>
        </div>
        <div className="space-y-3">
          {[
            "Message requests",
            "Block user",
            "Report",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
              <span className="text-foreground">{label}</span>
              <span className="h-4 w-8 rounded-full bg-primary/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "admin") {
    return (
      <div className="relative z-10 w-full px-6 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            Moderation queue
          </p>
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">Priority</span>
        </div>
        <div className="space-y-3">
          {[
            "Harassment · aid_3K7",
            "Spam · aid_0Q2",
            "Impersonation · aid_9V5",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
              <span className="text-foreground">{label}</span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-primary">
                Review
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full px-6 py-6">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            Live thread
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">AID: aid_•••9Q</p>
        </div>
        <div className="h-9 w-9 rounded-full border border-border/60 bg-card/80" />
      </div>
      <div className="space-y-3">
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-border/65 bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
          Need a private room for tonight? Invite link expires fast.
        </div>
        <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
          Created. Request approved. Sending you the AID now.
        </div>
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-border/65 bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
          Perfect. See you inside anonimi.
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-primary/40" />
        <div className="h-2 w-2 rounded-full bg-primary/25" />
        <div className="h-2 w-2 rounded-full bg-primary/15" />
        <span className="ml-auto text-[0.62rem] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          typing
        </span>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <ScrollToHash />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_8%_16%,rgba(12,55,80,0.14),transparent_42%),radial-gradient(circle_at_92%_20%,rgba(36,107,124,0.14),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 border-b border-border/55 pb-10 text-center md:mb-20">
          <p className="inline-flex rounded-full border border-border/70 bg-card/75 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            Capability Matrix
          </p>
          <h1 className="mt-4 text-4xl font-display font-bold sm:text-5xl md:text-6xl">
            Features
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Built as a layered messaging stack: identity, transport, control, and moderation.
          </p>
        </div>

        <div className="space-y-12 md:space-y-14">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="grid items-center gap-7 border-b border-border/45 pb-10 md:pb-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10"
            >
              <div>
                <div className="h-14 w-14 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl font-display font-bold sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  {feature.description}
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-foreground/90">
                      <div className="w-5 h-5 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full">
                <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-soft">
                  <div className="absolute inset-4 rounded-[1.3rem] border border-border/60 bg-background/80" />
                  <FeatureMock kind={mockKinds[index]} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <section id="temporary-access" className="mt-20 scroll-mt-28">
          <div className="grid gap-8 rounded-[2.2rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                Temporary Access
              </p>
              <h2 className="mt-4 text-3xl font-display font-bold sm:text-4xl">Start now, decide later.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Temporary Access unlocks a full 24-hour session without permanent commitment. The benefit is speed: start a
                conversation immediately, then claim it only when you want to keep the history.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">Session-only</span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">Claim to keep</span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">24h expiration</span>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/temporary"
                  className="inline-flex h-10 items-center rounded-full bg-amber-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-amber-600/90"
                >
                  Start temporary session
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-full border border-amber-500/40 px-5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-200"
                >
                  Create account
                </Link>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
                <p className="text-xs font-semibold text-foreground">Why it helps</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Start chats instantly for new contacts.</li>
                  <li>Keep control before committing an identity.</li>
                  <li>Convert to a full account when it matters.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-5">
                <p className="text-xs font-semibold text-foreground">Example</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-amber-700">Temporary Session</p>
                    <p className="mt-2 font-semibold text-foreground">temp_q7n2</p>
                    <p className="text-xs text-muted-foreground">Expires in 23:54:12</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can chat immediately and claim later if the conversation becomes long-term.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="stealth-mode" className="mt-16 scroll-mt-28">
          <div className="grid gap-8 rounded-[2.2rem] border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5">
              <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                Stealth Mode
              </p>
              <h2 className="mt-4 text-2xl font-display font-bold sm:text-3xl">Control the trail, not the thread.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Set a lifespan for each message so sensitive details fade away. The benefit is confidence: share quickly without
                leaving a long-term trail.
              </p>
              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>Timed expiration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>Per-message control</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>No history linger</span>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-cyan-500/20 bg-background/70 p-4">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-cyan-700">Example</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Stealth timer</p>
                    <p className="text-sm font-semibold text-foreground">5 minutes</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/15 bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Message</p>
                    <p className="text-sm text-foreground">Gate code: 4903</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-display font-bold sm:text-4xl">Stealth Mode keeps sensitive updates temporary.</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Use it for access codes, quick location drops, or time-boxed updates. Messages disappear on schedule while the
                conversation stays intact.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">Timed expiration</span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">Per-message control</span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">No history linger</span>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-full bg-cyan-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-cyan-600/90"
                >
                  Create account
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center rounded-full border border-cyan-500/40 px-5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-500/10 dark:text-cyan-200"
                >
                  Ask about stealth
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold">Ready to try anonimi?</h2>
          <p className="mt-4 text-muted-foreground">
            Join early adopters who want private-first messaging built around AID.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
