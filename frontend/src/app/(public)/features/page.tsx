import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollToHash from "@/components/marketing/ScrollToHash";
import SecuritySpotlight from "@/components/marketing/SecuritySpotlight";
import {
  AnimatedSection,
  AnimatedText,
  AnimatedElement,
  AnimatedImage,
  AnimatedBadge,
  AnimatedList,
  AnimatedListItem,
  AnimatedCard,
  AnimatedButton,
} from "@/components/marketing/AnimatedSection";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore anonimi's messaging, groups, privacy, and moderation features.",
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <ScrollToHash />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_8%_16%,rgba(12,55,80,0.14),transparent_42%),radial-gradient(circle_at_92%_20%,rgba(36,107,124,0.14),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-16 border-b border-border/55 pb-10 text-center md:mb-20">
          <AnimatedElement delay={0}>
            <p className="inline-flex rounded-full border border-border/70 bg-card/75 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              Capability Matrix
            </p>
          </AnimatedElement>
          <AnimatedText delay={0.1}>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl md:text-6xl">
              Features
            </h1>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Built as a layered messaging stack: identity, transport, control,
              and moderation.
            </p>
          </AnimatedText>
        </AnimatedSection>

        <div className="space-y-24 md:space-y-32">
          <AnimatedSection direction="up">
            <SecuritySpotlight
              badge="Encryption Layer"
              title="End-to-end encryption is part of the product story, not a hidden checkbox."
              description="anonimi uses conversation-level encryption so private chats and group rooms keep readable content on participant devices while the server handles transport, delivery, and coordination. Even moderators and super admins cannot open encrypted message content."
              ctaHref="/register"
              ctaLabel="Start encrypted chats"
              secondaryHref="/about"
              secondaryLabel="Read the philosophy"
            />
          </AnimatedSection>

          {/* Real-time Messaging - OPEN LAYOUT (no container box) */}
          <AnimatedSection direction="up">
            <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <AnimatedElement delay={0.05}>
                  <p className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                    Core Messaging
                  </p>
                </AnimatedElement>
                <AnimatedText delay={0.1}>
                  <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                    Real-time Messaging
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.15}>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                    Fast delivery, read state, and reactions that stay in sync
                    across every device. Messages arrive instantly without losing the privacy layer underneath.
                  </p>
                </AnimatedText>
                <AnimatedElement delay={0.2} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  <AnimatedBadge delay={0.25} className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                    Typing indicators
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.3} className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                    Read receipts
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.35} className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                    Reactions
                  </AnimatedBadge>
                </AnimatedElement>
                <AnimatedList className="mt-8 space-y-3 text-muted-foreground" staggerDelay={0.06}>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>WebSocket connections for instant delivery</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Optimistic updates for snappy UI</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Offline queue for reliability</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Encrypted content stays unreadable to admins</span>
                    </div>
                  </AnimatedListItem>
                </AnimatedList>
              </div>
              <AnimatedImage delay={0.2} className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
                <Image
                  src="/images/stock/real-time-messaging-section-image.png"
                  alt="Real-time messaging preview"
                  width={720}
                  height={720}
                  className="w-full rounded-2xl object-cover"
                />
              </AnimatedImage>
            </section>
          </AnimatedSection>

          {/* Privacy-First Identity - BOXED CARD LAYOUT */}
          <AnimatedSection direction="up">
            <section className="rounded-[2.4rem] border border-violet-500/25 bg-gradient-to-br from-violet-500/8 via-background to-background p-8 md:p-12 shadow-soft">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
                <AnimatedImage delay={0.1} className="order-2 lg:order-1 overflow-hidden rounded-2xl">
                  <Image
                    src="/images/stock/privacy-first-identity-no-bg-2.png"
                    alt="Privacy-first identity"
                    width={720}
                    height={520}
                    className="w-full rounded-xl object-contain"
                  />
                </AnimatedImage>
                <div className="order-1 lg:order-2">
                  <AnimatedElement delay={0.05}>
                    <p className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">
                      Identity Layer
                    </p>
                  </AnimatedElement>
                  <AnimatedText delay={0.1}>
                    <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                      Privacy-First Identity
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.15}>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                      Your AID is generated automatically so you can share a private
                      identity without revealing personal contact data.
                    </p>
                  </AnimatedText>
                  <AnimatedElement delay={0.2} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-violet-800 dark:text-violet-200">
                    <AnimatedBadge delay={0.25} className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                      No phone required
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.3} className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                      Pseudonymous by default
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.35} className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                      Reveal on your terms
                    </AnimatedBadge>
                  </AnimatedElement>
                  <AnimatedCard delay={0.3} className="mt-8 rounded-xl border border-violet-500/20 bg-background/70 p-5">
                    <p className="text-xs font-mono uppercase tracking-wide text-violet-700 dark:text-violet-200">
                      Example AID
                    </p>
                    <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Your AID</p>
                      <p className="text-lg font-semibold font-mono text-foreground">
                        anon_8x7k2m
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Share this instead of your email or phone number, then let encryption handle the message layer.
                    </p>
                  </AnimatedCard>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Group Chats - OPEN LAYOUT with accent cards */}
          <AnimatedSection direction="up">
            <section id="group-chats" className="scroll-mt-28">
              <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                <div>
                  <AnimatedElement delay={0.05}>
                    <p className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-blue-700 dark:text-blue-200">
                      Collaboration
                    </p>
                  </AnimatedElement>
                  <AnimatedText delay={0.1}>
                    <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                      Group Chats
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.15}>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                      Build teams and communities with roles, nicknames, and join
                      requests that keep groups organized.
                    </p>
                  </AnimatedText>
                  <AnimatedElement delay={0.2} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                    <AnimatedBadge delay={0.25} className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                      Role-based permissions
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.3} className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                      Custom nicknames
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.35} className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                      Join requests
                    </AnimatedBadge>
                  </AnimatedElement>
                  <AnimatedElement delay={0.25} className="mt-8 flex flex-wrap items-center gap-3">
                    <AnimatedButton>
                      <Link
                        href="/register"
                        className="inline-flex h-11 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-blue-600/90"
                      >
                        Start a group
                      </Link>
                    </AnimatedButton>
                    <AnimatedButton delay={0.05}>
                      <Link
                        href="/contact"
                        className="inline-flex h-11 items-center rounded-full border border-blue-500/40 px-6 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/10 dark:text-blue-200"
                      >
                        Learn more
                      </Link>
                    </AnimatedButton>
                  </AnimatedElement>

                  <div className="grid gap-4 mt-10 sm:grid-cols-2">
                    <AnimatedCard delay={0.3} className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5">
                      <p className="text-sm font-semibold text-foreground">
                        Group features
                      </p>
                      <AnimatedList className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <AnimatedListItem>Assign admin and moderator roles</AnimatedListItem>
                        <AnimatedListItem>Set custom nicknames per group</AnimatedListItem>
                        <AnimatedListItem>Approve join requests before entry</AnimatedListItem>
                      </AnimatedList>
                    </AnimatedCard>
                    <AnimatedCard delay={0.35} className="rounded-2xl border border-border/50 bg-card/50 p-5">
                      <p className="text-sm font-semibold text-foreground">
                        Rich settings
                      </p>
                      <AnimatedList className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <AnimatedListItem>Group descriptions</AnimatedListItem>
                        <AnimatedListItem>Member limits</AnimatedListItem>
                        <AnimatedListItem>Invite links</AnimatedListItem>
                      </AnimatedList>
                    </AnimatedCard>
                  </div>
                </div>
                <AnimatedImage delay={0.2} className="sticky top-28 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-3">
                  <Image
                    src="/images/stock/group-chat-image.png"
                    alt="Group chat preview"
                    width={720}
                    height={720}
                    className="w-full rounded-2xl object-contain"
                  />
                </AnimatedImage>
              </div>
            </section>
          </AnimatedSection>

          {/* Media Sharing - FULL WIDTH BANNER style */}
          <AnimatedSection direction="up">
            <section className="relative overflow-hidden rounded-[2.4rem] bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent py-16 md:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,63,94,0.1),transparent_50%)]" />
              <div className="relative grid items-center gap-12 px-8 md:px-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <AnimatedElement delay={0.05}>
                    <p className="inline-flex rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rose-700 dark:text-rose-200">
                      Media Layer
                    </p>
                  </AnimatedElement>
                  <AnimatedText delay={0.1}>
                    <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                      Media Sharing
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.15}>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                      Share images and files with clean previews and reliable
                      delivery, even on busy threads. Rich media that loads fast and looks great.
                    </p>
                  </AnimatedText>
                  <AnimatedElement delay={0.2} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
                    <AnimatedBadge delay={0.25} className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                      Fast uploads
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.3} className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                      Rich previews
                    </AnimatedBadge>
                    <AnimatedBadge delay={0.35} className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                      Reliable delivery
                    </AnimatedBadge>
                  </AnimatedElement>
                  <AnimatedElement delay={0.3} className="mt-10 flex flex-wrap gap-2">
                    {["JPG", "PNG", "GIF", "PDF", "DOC", "MP4", "MP3"].map((format, i) => (
                      <AnimatedBadge
                        key={format}
                        delay={0.32 + i * 0.04}
                        className="rounded-lg border border-rose-500/25 bg-background/80 px-3 py-1.5 text-xs font-mono text-foreground"
                      >
                        {format}
                      </AnimatedBadge>
                    ))}
                  </AnimatedElement>
                  <div className="mt-10 grid grid-cols-2 gap-6">
                    <AnimatedElement delay={0.4}>
                      <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">5MB</p>
                      <p className="text-sm text-muted-foreground">Max file size</p>
                    </AnimatedElement>
                    <AnimatedElement delay={0.45}>
                      <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{"<"}2s</p>
                      <p className="text-sm text-muted-foreground">Upload speed</p>
                    </AnimatedElement>
                  </div>
                </div>
                <AnimatedImage delay={0.2} className="rounded-2xl border border-rose-500/20 bg-card/70 p-2">
                  <Image
                    src="/images/stock/sending-media-image.png"
                    alt="Sending media preview"
                    width={720}
                    height={520}
                    className="w-full rounded-xl object-contain"
                  />
                </AnimatedImage>
              </div>
            </section>
          </AnimatedSection>

          {/* Block & Report + Admin - SPLIT TWO-COLUMN CARDS */}
          <AnimatedSection direction="up">
            <section className="grid gap-8 lg:grid-cols-2">
              {/* Block & Report */}
              <AnimatedCard delay={0.1} className="rounded-[2rem] border border-orange-500/25 bg-gradient-to-br from-orange-500/8 to-transparent p-8">
                <AnimatedElement delay={0.15}>
                  <p className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-orange-700 dark:text-orange-200">
                    Safety Controls
                  </p>
                </AnimatedElement>
                <AnimatedText delay={0.2}>
                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                    Block & Report
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.25}>
                  <p className="mt-4 text-muted-foreground">
                    Decide who reaches you with requests, blocks, and reporting
                    tools that keep your space calm.
                  </p>
                </AnimatedText>
                <AnimatedList className="mt-6 space-y-3 text-sm text-muted-foreground" staggerDelay={0.06}>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Block unwanted contacts instantly</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Report violations to moderators</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Control who can message you</span>
                    </div>
                  </AnimatedListItem>
                </AnimatedList>
                <AnimatedImage delay={0.35} className="mt-6 overflow-hidden rounded-xl">
                  <Image
                    src="/images/stock/blocking-image.png"
                    alt="Safety controls preview"
                    width={400}
                    height={300}
                    className="w-full rounded-xl object-cover"
                  />
                </AnimatedImage>
              </AnimatedCard>

              {/* Admin & Moderation */}
              <AnimatedCard delay={0.15} className="rounded-[2rem] border border-slate-500/25 bg-gradient-to-br from-slate-500/8 to-transparent p-8">
                <AnimatedElement delay={0.2}>
                  <p className="inline-flex rounded-full border border-slate-500/30 bg-slate-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                    Platform Layer
                  </p>
                </AnimatedElement>
                <AnimatedText delay={0.25}>
                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                    Admin & Moderation
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.3}>
                  <p className="mt-4 text-muted-foreground">
                    A dedicated moderation layer keeps the platform safe without
                    becoming a backdoor into private conversations.
                  </p>
                </AnimatedText>
                <AnimatedList className="mt-6 space-y-3 text-sm text-muted-foreground" staggerDelay={0.06}>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      <span>Real-time report queue</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      <span>User bans and suspensions</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      <span>Full activity audit logs</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      <span>No admin message browser for encrypted chats</span>
                    </div>
                  </AnimatedListItem>
                </AnimatedList>
                <AnimatedImage delay={0.4} className="mt-6 overflow-hidden rounded-xl">
                  <Image
                    src="/images/stock/admin.png"
                    alt="Moderation overview"
                    width={400}
                    height={300}
                    className="w-full rounded-xl object-cover"
                  />
                </AnimatedImage>
              </AnimatedCard>
            </section>
          </AnimatedSection>

          <AnimatedSection direction="up">
            <section className="rounded-[2rem] border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-background to-background p-8 md:p-10">
              <AnimatedElement delay={0.05}>
                <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                  Privacy Promise
                </p>
              </AnimatedElement>
              <AnimatedText delay={0.1}>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Not even our admin panel can read your encrypted chats.
                </h2>
              </AnimatedText>
              <AnimatedText delay={0.15}>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  Moderation still works through reports, account controls, and audit trails, but encrypted message bodies are not exposed to moderators, support staff, or super admins.
                </p>
              </AnimatedText>
            </section>
          </AnimatedSection>
        </div>

        {/* Temporary Access Section - BOXED HERO CARD */}
        <AnimatedSection delay={0.1} direction="up" className="mt-24 md:mt-32">
          <section id="temporary-access" className="scroll-mt-28">
            <div className="grid gap-8 rounded-[2.2rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <AnimatedElement delay={0.05}>
                  <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                    Temporary Access
                  </p>
                </AnimatedElement>
                <AnimatedText delay={0.1}>
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                    Start now, decide later.
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.15}>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Temporary Access unlocks a full 24-hour session without
                    permanent commitment. The benefit is speed: start a conversation
                    immediately, then claim it only when you want to keep the
                    history.
                  </p>
                </AnimatedText>
                <AnimatedElement delay={0.2} className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                  <AnimatedBadge delay={0.25} className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                    Session-only
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.3} className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                    Claim to keep
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.35} className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                    24h expiration
                  </AnimatedBadge>
                </AnimatedElement>
                <AnimatedElement delay={0.25} className="mt-7 flex flex-wrap items-center gap-3">
                  <AnimatedButton>
                    <Link
                      href="/temporary"
                      className="inline-flex h-10 items-center rounded-full bg-amber-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-amber-600/90"
                    >
                      Start temporary session
                    </Link>
                  </AnimatedButton>
                  <AnimatedButton delay={0.05}>
                    <Link
                      href="/register"
                      className="inline-flex h-10 items-center rounded-full border border-amber-500/40 px-5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-200"
                    >
                      Create account
                    </Link>
                  </AnimatedButton>
                </AnimatedElement>

                <div className="grid gap-4 mt-4">
                  <AnimatedCard delay={0.3} className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
                    <p className="text-xs font-semibold text-foreground">
                      Why it helps
                    </p>
                    <AnimatedList className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <AnimatedListItem>Start chats instantly for new contacts.</AnimatedListItem>
                      <AnimatedListItem>Keep control before committing an identity.</AnimatedListItem>
                      <AnimatedListItem>Convert to a full account when it matters.</AnimatedListItem>
                    </AnimatedList>
                  </AnimatedCard>
                  <AnimatedCard delay={0.35} className="rounded-2xl border border-amber-500/20 bg-background/70 p-5">
                    <p className="text-xs font-semibold text-foreground">
                      Example
                    </p>
                    <AnimatedElement delay={0.4} className="mt-3 space-y-3 text-sm">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          Temporary AID
                        </p>
                        <p className="text-base font-mono font-semibold mt-1">
                          temp_9f3xk2
                        </p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Use this to chat now. Claim it within 24 hours to keep your history.
                      </p>
                    </AnimatedElement>
                  </AnimatedCard>
                </div>
              </div>
              <AnimatedImage delay={0.2} className="flex flex-col justify-center rounded-2xl border border-amber-500/20 bg-card/70 p-2">
                <Image
                  src="/images/features/temporary-account-conversation-preview.png"
                  alt="Temporary access preview"
                  width={720}
                  height={720}
                  className="w-full rounded-xl object-contain"
                />
                <AnimatedElement delay={0.35}>
                  <p className="mt-2 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-200/80">
                    Temporary conversation
                  </p>
                </AnimatedElement>
              </AnimatedImage>
            </div>
          </section>
        </AnimatedSection>

        {/* Stealth Mode Section - OPEN LAYOUT */}
        <AnimatedSection delay={0.1} direction="up" className="mt-16">
          <section id="stealth-mode" className="scroll-mt-28">
            <div className="grid gap-8 rounded-[2.2rem] from-cyan-500/10 via-background to-background  lg:grid-cols-[0.9fr_1.1fr]">
              <AnimatedCard delay={0.05} className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5">
                <AnimatedElement delay={0.1}>
                  <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                    Stealth Mode
                  </p>
                </AnimatedElement>
                <AnimatedText delay={0.15}>
                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                    Control the trail, not the thread.
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.2}>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Set a lifespan for each message so sensitive details fade away.
                    The benefit is confidence: share quickly without leaving a
                    long-term trail.
                  </p>
                </AnimatedText>
                <AnimatedList className="mt-5 space-y-3 text-sm text-muted-foreground" staggerDelay={0.06}>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span>Timed expiration</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span>Per-message control</span>
                    </div>
                  </AnimatedListItem>
                  <AnimatedListItem>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span>No history linger</span>
                    </div>
                  </AnimatedListItem>
                </AnimatedList>
                <AnimatedElement delay={0.35} className="mt-5 rounded-xl border border-cyan-500/20 bg-background/70 p-4">
                  <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
                    Example
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <AnimatedElement delay={0.4}>
                      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          Stealth timer
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          5 minutes
                        </p>
                      </div>
                    </AnimatedElement>
                    <AnimatedElement delay={0.45}>
                      <div className="rounded-lg border border-cyan-500/15 bg-background px-3 py-2">
                        <p className="text-xs text-muted-foreground">Message</p>
                        <p className="text-sm text-foreground">Gate code: 4903</p>
                      </div>
                    </AnimatedElement>
                  </div>
                </AnimatedElement>
              </AnimatedCard>
              <div>
                <AnimatedText delay={0.1}>
                  <h3 className="text-3xl font-bold sm:text-4xl">
                    Stealth Mode keeps sensitive updates temporary.
                  </h3>
                </AnimatedText>
                <AnimatedText delay={0.15}>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Use it for access codes, quick location drops, or time-boxed
                    updates. Messages disappear on schedule while the conversation
                    stays intact.
                  </p>
                </AnimatedText>
                <AnimatedElement delay={0.2} className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
                  <AnimatedBadge delay={0.25} className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                    Timed expiration
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.3} className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                    Per-message control
                  </AnimatedBadge>
                  <AnimatedBadge delay={0.35} className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                    No history linger
                  </AnimatedBadge>
                </AnimatedElement>
                <AnimatedElement delay={0.25} className="mt-7 flex flex-wrap items-center gap-3">
                  <AnimatedButton>
                    <Link
                      href="/register"
                      className="inline-flex h-10 items-center rounded-full bg-cyan-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-cyan-600/90"
                    >
                      Create account
                    </Link>
                  </AnimatedButton>
                  <AnimatedButton delay={0.05}>
                    <Link
                      href="/contact"
                      className="inline-flex h-10 items-center rounded-full border border-cyan-500/40 px-5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-500/10 dark:text-cyan-200"
                    >
                      Ask about stealth
                    </Link>
                  </AnimatedButton>
                </AnimatedElement>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <AnimatedImage delay={0.3} className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2">
                    <Image
                      src="/images/features/stealth-setup-preview.png"
                      alt="Stealth timer setup"
                      width={520}
                      height={360}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <AnimatedElement delay={0.45}>
                      <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                        Set the timer
                      </p>
                    </AnimatedElement>
                  </AnimatedImage>
                  <AnimatedImage delay={0.35} className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2">
                    <Image
                      src="/images/features/stealth-preview.png"
                      alt="Stealth message preview with countdown"
                      width={520}
                      height={360}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <AnimatedElement delay={0.5}>
                      <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                        Countdown preview
                      </p>
                    </AnimatedElement>
                  </AnimatedImage>
                  <AnimatedImage delay={0.4} className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2 sm:col-span-2">
                    <Image
                      src="/images/features/stealthy-message-preview.png"
                      alt="Expired stealth message preview"
                      width={820}
                      height={420}
                      className="h-44 w-full rounded-xl object-cover"
                    />
                    <AnimatedElement delay={0.55}>
                      <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                        Message expired
                      </p>
                    </AnimatedElement>
                  </AnimatedImage>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection delay={0.15} direction="up" className="mt-24 text-center md:mt-32">
          <AnimatedElement delay={0.1}>
            <p className="text-sm font-medium text-muted-foreground">
              Ready to try anonimi?
            </p>
          </AnimatedElement>
          <AnimatedText delay={0.15}>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Start messaging privately today.
            </h2>
          </AnimatedText>
          <AnimatedButton delay={0.2}>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </AnimatedButton>
        </AnimatedSection>
      </div>
    </div>
  );
}
