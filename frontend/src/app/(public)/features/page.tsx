import type { Metadata } from "next";
import Image from "next/image";
import {
  MessageCircle,
  Shield,
  Users,
  Lock,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollToHash from "@/components/marketing/ScrollToHash";

export const metadata: Metadata = {
  title: "anonimi Features",
  description:
    "Explore anonimi's messaging, groups, privacy, and moderation features.",
};

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
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl md:text-6xl">
            Features
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Built as a layered messaging stack: identity, transport, control,
            and moderation.
          </p>
        </div>

        <div className="space-y-16 md:space-y-20">
          {/* Real-time Messaging - Enhanced with gradient card style */}
          <section className="grid gap-8 rounded-[2.4rem] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                Core Messaging
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Real-time Messaging
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Fast delivery, read state, and reactions that stay in sync
                across every device. Messages arrive instantly with end-to-end reliability.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                  Typing indicators
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                  Read receipts
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
                  Reactions
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Why it matters
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>Instant delivery across all devices</li>
                    <li>Know when messages are read</li>
                    <li>React without typing</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-background/70 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Technical
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>WebSocket connections</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Optimistic updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Offline queue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/70 p-2">
              <Image
                src="/images/stock/real-time-messaging-section-image.png"
                alt="Real-time messaging preview"
                width={720}
                height={720}
                className="h-full w-full rounded-xl object-cover"
              />
              <p className="mt-2 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-200/80">
                Live conversation
              </p>
            </div>
          </section>

          {/* Privacy-First Identity - Enhanced with gradient card style */}
          <section className="grid gap-8 rounded-[2.4rem] border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5">
              <p className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">
                Identity Layer
              </p>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Your identity, your control.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Your AID is generated automatically so you can share a private
                identity without revealing personal contact data.
              </p>
              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span>Unique generated AID</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span>Email-only signup</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span>Optional usernames</span>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-violet-500/20 bg-background/70 p-4">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">
                  Example AID
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Your AID</p>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      anon_8x7k2m
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this instead of your email or phone number.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold sm:text-4xl">
                Privacy-First Identity
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Share your AID confidently knowing your personal information stays private. Control what others see and when.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-violet-800 dark:text-violet-200">
                <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                  No phone required
                </span>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                  Pseudonymous by default
                </span>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1">
                  Reveal on your terms
                </span>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/privacy-first-identity-no-bg-2.png"
                  alt="Privacy-first identity"
                  width={720}
                  height={420}
                  className="h-56 w-full rounded-xl object-cover"
                />
                <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-700/80 dark:text-violet-200/80">
                  Protected identity
                </p>
              </div>
            </div>
          </section>

          {/* Group Chats - Enhanced to match top sections */}
          <section id="group-chats" className="scroll-mt-28">
            <div className="grid gap-8 rounded-[2.2rem] border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-blue-700 dark:text-blue-200">
                  Collaboration
                </p>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Group Chats
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Build teams and communities with roles, nicknames, and join
                  requests that keep groups organized.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                    Role-based permissions
                  </span>
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                    Custom nicknames
                  </span>
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                    Join requests
                  </span>
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center rounded-full bg-blue-600 px-5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-blue-600/90"
                  >
                    Start a group
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 items-center rounded-full border border-blue-500/40 px-5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-500/10 dark:text-blue-200"
                  >
                    Learn more
                  </Link>
                </div>

                <div className="grid gap-4 mt-6">
                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5">
                    <p className="text-xs font-semibold text-foreground">
                      Group features
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Assign admin and moderator roles</li>
                      <li>Set custom nicknames per group</li>
                      <li>Approve join requests before entry</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-blue-500/20 bg-background/70 p-5">
                    <p className="text-xs font-semibold text-foreground">
                      Rich settings
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Group descriptions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Member limits</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Invite links</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-blue-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/group-chat-image.png"
                  alt="Group chat preview"
                  width={720}
                  height={720}
                  className="w-full rounded-xl object-contain"
                />
                <p className="mt-2 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue-700/80 dark:text-blue-200/80">
                  Team conversation
                </p>
              </div>
            </div>
          </section>

          {/* Media Sharing - Enhanced */}
          <section className="grid gap-8 rounded-[2.4rem] border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5">
                <p className="inline-flex rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rose-700 dark:text-rose-200">
                  Media Layer
                </p>
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                  Share moments instantly.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Share images and files with clean previews and reliable
                  delivery, even on busy threads.
                </p>
                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Image sharing with compression</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>File attachments up to 5MB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Inline preview support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Download to device</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-background/70 p-4">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-rose-700 dark:text-rose-200">
                  Supported formats
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["JPG", "PNG", "GIF", "PDF", "DOC", "MP4", "MP3"].map((format) => (
                    <span
                      key={format}
                      className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-xs font-mono text-foreground"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-rose-700 dark:text-rose-200">
                  Performance
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">5MB</p>
                    <p className="text-xs text-muted-foreground">Max file size</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{"<"}2s</p>
                    <p className="text-xs text-muted-foreground">Upload speed</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold sm:text-4xl">
                Media Sharing
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Rich media previews that load fast and look great. Share photos, documents, and files without leaving the conversation.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
                <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                  Fast uploads
                </span>
                <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                  Rich previews
                </span>
                <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1">
                  Reliable delivery
                </span>
              </div>
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/sending-media-image.png"
                  alt="Sending media preview"
                  width={720}
                  height={420}
                  className="w-full rounded-xl object-contain"
                />
                <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-rose-700/80 dark:text-rose-200/80">
                  Sharing photos
                </p>
              </div>
            </div>
          </section>

          {/* Block & Report - Enhanced */}
          <section className="grid gap-8 rounded-[2.4rem] border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-orange-700 dark:text-orange-200">
                Safety Controls
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Block & Report System
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Decide who reaches you with requests, blocks, and reporting
                tools that keep your space calm.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-orange-800 dark:text-orange-200">
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1">
                  Message requests
                </span>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1">
                  Block users
                </span>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1">
                  Report violations
                </span>
              </div>
              <div className="grid gap-4 mt-6">
                <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Protection features
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>Block unwanted contacts instantly</li>
                    <li>Report violations to moderators</li>
                    <li>Control who can message you</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-orange-500/20 bg-background/70 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Privacy controls
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Message request filtering</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Block without notification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Anonymous reporting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-card/70 p-2">
              <Image
                src="/images/stock/blocking-image.png"
                alt="Safety controls preview"
                width={720}
                height={720}
                className="h-full w-full rounded-xl object-cover"
              />
              <p className="mt-2 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-orange-700/80 dark:text-orange-200/80">
                Block controls
              </p>
            </div>
          </section>

          {/* Admin & Moderation - Enhanced */}
          <section className="grid gap-8 rounded-[2.4rem] border border-slate-500/25 bg-gradient-to-br from-slate-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-500/25 bg-slate-500/10 p-5">
              <p className="inline-flex rounded-full border border-slate-500/30 bg-slate-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                Platform Layer
              </p>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Keep the platform safe.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A dedicated moderation layer keeps the platform safe without
                slowing down the experience.
              </p>
              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Report queue</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>User bans</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Activity logs</span>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-slate-500/20 bg-background/70 p-4">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                  Admin tools
                </p>
                <div className="mt-3 space-y-2">
                  {["Dashboard", "Audit logs", "User management"].map((tool) => (
                    <div
                      key={tool}
                      className="rounded-lg border border-slate-500/25 bg-slate-500/10 px-3 py-2 text-sm text-foreground"
                    >
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold sm:text-4xl">
                Admin & Moderation
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Comprehensive tools for platform administrators to maintain community standards and handle issues efficiently.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="rounded-full border border-slate-500/40 bg-slate-500/15 px-3 py-1">
                  Real-time monitoring
                </span>
                <span className="rounded-full border border-slate-500/40 bg-slate-500/15 px-3 py-1">
                  Quick actions
                </span>
                <span className="rounded-full border border-slate-500/40 bg-slate-500/15 px-3 py-1">
                  Full audit trail
                </span>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/admin.png"
                  alt="Moderation overview"
                  width={720}
                  height={420}
                  className="h-56 w-full rounded-xl object-cover"
                />
                <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-700/80 dark:text-slate-200/80">
                  Admin dashboard
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Temporary Access Section - Kept as-is per user feedback */}
        <section id="temporary-access" className="mt-20 scroll-mt-28">
          <div className="grid gap-8 rounded-[2.2rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                Temporary Access
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Start now, decide later.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Temporary Access unlocks a full 24-hour session without
                permanent commitment. The benefit is speed: start a conversation
                immediately, then claim it only when you want to keep the
                history.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                  Session-only
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                  Claim to keep
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                  24h expiration
                </span>
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

              <div className="grid gap-4 mt-4">
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Why it helps
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>Start chats instantly for new contacts.</li>
                    <li>Keep control before committing an identity.</li>
                    <li>Convert to a full account when it matters.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-5">
                  <p className="text-xs font-semibold text-foreground">
                    Example
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
                        Temporary Session
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        temp_q7n2
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires in 23:54:12
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can chat immediately and claim later if the
                      conversation becomes long-term.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-card/70 p-2">
              <Image
                src="/images/features/temporary-account-conversation-preview.png"
                alt="Temporary account conversation preview"
                width={720}
                height={420}
                className="w-full rounded-xl object-cover"
              />
              <p className="mt-2 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-200/80">
                Temporary conversation
              </p>
            </div>
          </div>
        </section>

        {/* Stealth Mode Section - Kept as-is per user feedback */}
        <section id="stealth-mode" className="mt-16 scroll-mt-28">
          <div className="grid gap-8 rounded-[2.2rem] border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-background to-background p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5">
              <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                Stealth Mode
              </p>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Control the trail, not the thread.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Set a lifespan for each message so sensitive details fade away.
                The benefit is confidence: share quickly without leaving a
                long-term trail.
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
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
                  Example
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Stealth timer
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      5 minutes
                    </p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/15 bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Message</p>
                    <p className="text-sm text-foreground">Gate code: 4903</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold sm:text-4xl">
                Stealth Mode keeps sensitive updates temporary.
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Use it for access codes, quick location drops, or time-boxed
                updates. Messages disappear on schedule while the conversation
                stays intact.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                  Timed expiration
                </span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                  Per-message control
                </span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1">
                  No history linger
                </span>
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
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2">
                  <Image
                    src="/images/features/stealth-setup-preview.png"
                    alt="Stealth timer setup"
                    width={520}
                    height={360}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                    Set the timer
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2">
                  <Image
                    src="/images/features/stealth-preview.png"
                    alt="Stealth message preview with countdown"
                    width={520}
                    height={360}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                    Countdown preview
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2 sm:col-span-2">
                  <Image
                    src="/images/features/stealthy-message-preview.png"
                    alt="Expired stealth message preview"
                    width={820}
                    height={420}
                    className="h-44 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-700/80 dark:text-cyan-200/80">
                    Message expired
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold">Ready to try anonimi?</h2>
          <p className="mt-4 text-muted-foreground">
            Join early adopters who want private-first messaging built around
            AID.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
