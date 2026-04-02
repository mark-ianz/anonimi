import type { Metadata } from "next";
import Image from "next/image";
import { MessageCircle, Shield, Users, Zap, Lock, Bell, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollToHash from "@/components/marketing/ScrollToHash";

export const metadata: Metadata = {
  title: "anonimi Features",
  description: "Explore anonimi's messaging, groups, privacy, and moderation features.",
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
          <h1 className="mt-4 text-4xl font-display font-bold sm:text-5xl md:text-6xl">
            Features
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Built as a layered messaging stack: identity, transport, control, and moderation.
          </p>
        </div>

        <div className="space-y-14 md:space-y-16">
          <section className="grid items-center gap-8 border-b border-border/45 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="h-14 w-14 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-display font-bold">Real-time Messaging</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Fast delivery, read state, and reactions that stay in sync across every device.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-foreground/80">
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Typing indicators</span>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Read receipts</span>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Reactions</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
              <Image
                src="/images/stock/real-time-messaging-section-image.png"
                alt="Real-time messaging preview"
                width={720}
                height={720}
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/10 via-transparent to-transparent" />
            </div>
          </section>

          <section className="grid items-center gap-8 border-b border-border/45 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
              <Image
                src="/images/stock/privacy-first-identity-no-bg-2.png"
                alt="Privacy-first identity"
                width={720}
                height={720}
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-bl from-background/30 via-transparent to-transparent" />
            </div>
            <div>
              <div className="h-14 w-14 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-display font-bold">Privacy-First Identity</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Your AID is generated automatically so you can share a private identity without revealing personal contact data.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>Unique generated AID</li>
                <li>Email-only signup</li>
                <li>Optional usernames</li>
              </ul>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.4rem] border border-border/60 bg-gradient-to-br from-muted/60 via-background to-background p-8 shadow-soft">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="h-14 w-14 rounded-full border border-border/60 bg-background/50 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h2 className="mt-6 text-3xl font-display font-bold">Group Chats</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Build teams and communities with roles, nicknames, and join requests that keep groups organized.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Role-based permissions",
                    "Custom nicknames",
                    "Join requests",
                    "Rich group settings",
                  ].map((label) => (
                    <div key={label} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground/80">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
                <Image
                  src="/images/stock/group-chat-image.png"
                  alt="Group chat preview"
                  width={640}
                  height={640}
                  className="h-full w-full rounded-[1.5rem] object-cover"
                />
              </div>
            </div>
          </section>

          <section className="grid items-center gap-8 border-b border-border/45 pb-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="h-14 w-14 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-display font-bold">Media Sharing</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Share images and files with clean previews and reliable delivery, even on busy threads.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-foreground/80">
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Image sharing</span>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">File attachments</span>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Preview support</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
              <Image
                src="/images/stock/sending-media-image.png"
                alt="Sending media preview"
                width={700}
                height={700}
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
            </div>
          </section>

          <section className="grid items-center gap-8 border-b border-border/45 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
              <Image
                src="/images/stock/blocking-image.png"
                alt="Safety controls preview"
                width={720}
                height={720}
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
            </div>
            <div>
              <div className="h-14 w-14 rounded-full border border-border/60 bg-background/45 flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-display font-bold">Block & Report System</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Decide who reaches you with requests, blocks, and reporting tools that keep your space calm.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Message requests",
                  "Block users",
                  "Report violations",
                  "Privacy controls",
                ].map((label) => (
                  <div key={label} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground/80">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.4rem] border border-border/60 bg-gradient-to-br from-muted/50 via-background to-background p-8 shadow-soft">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="h-14 w-14 rounded-full border border-border/60 bg-background/50 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h2 className="mt-6 text-3xl font-display font-bold">Admin & Moderation</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  A dedicated moderation layer keeps the platform safe without slowing down the experience.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-foreground/80">
                  <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Report queue</span>
                  <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">User bans</span>
                  <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">Activity logs</span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-soft">
                <Image
                  src="/images/stock/admin.png"
                  alt="Moderation overview"
                  width={640}
                  height={640}
                  className="h-full w-full rounded-[1.5rem] object-cover"
                />
              </div>
            </div>
          </section>
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
              <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/group-chat-image.png"
                  alt="Temporary access preview"
                  width={520}
                  height={360}
                  className="h-40 w-full rounded-xl object-cover"
                />
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
              <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-500/20 bg-card/70 p-2">
                <Image
                  src="/images/stock/sending-media-image.png"
                  alt="Stealth mode preview"
                  width={540}
                  height={360}
                  className="h-40 w-full rounded-xl object-cover"
                />
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
