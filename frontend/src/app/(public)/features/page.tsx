"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SecuritySpotlight from "@/components/marketing/SecuritySpotlight";
import { cn } from "@/lib/utils";
import {
  Lock,
  MessageCircle,
  UserCircle,
  Users,
  Image as ImageIcon,
  Shield,
  Scale,
  Eye,
  Clock,
  Sparkles,
  ChevronRight,
  Server,
  Zap,
  Ban,
  FileText,
} from "lucide-react";

const tocItems = [
  { id: "encryption", label: "Encryption" },
  { id: "messaging", label: "Messaging" },
  { id: "identity", label: "Identity" },
  { id: "groups", label: "Groups" },
  { id: "media", label: "Media" },
  { id: "safety", label: "Safety" },
  { id: "moderation", label: "Moderation" },
  { id: "temporary-access", label: "Temp Access" },
  { id: "stealth", label: "Stealth" },
];

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] || "");
  useEffect(() => {
    const check = () => {
      const topTarget = 140;
      let closest = ids[0] || "";
      let closestDist = Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - topTarget);
        if (dist < closestDist) {
          closestDist = dist;
          closest = id;
        }
      }
      setActive(closest);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [ids]);
  return active;
}

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

function Section({ id, children, className }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn("scroll-mt-28", className)}
    >
      {children}
    </motion.div>
  );
}

interface SectionBadgeProps {
  icon?: React.ElementType;
  label: string;
}

function SectionBadge({ icon: Icon, label }: SectionBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
      {Icon && <Icon className="h-3 w-3 text-gold" />}
      <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
        {label}
      </span>
    </div>
  );
}

interface BulletListProps {
  items: string[];
  icon?: React.ElementType;
}

function BulletList({ items, icon: Icon }: BulletListProps) {
  return (
    <div className="mt-6 space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex items-center gap-3 text-sm text-muted-foreground"
        >
          {Icon ? (
            <Icon className="h-4 w-4 flex-shrink-0 text-gold" />
          ) : (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold/60" />
          )}
          <span>{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function FeaturesPage() {
  const sectionIds = useMemo(() => tocItems.map((t) => t.id), []);
  const activeSection = useActiveSection(sectionIds);

  return (
    <div className="relative overflow-x-clip pb-20 pt-24 md:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-124 bg-[radial-gradient(circle_at_50%_12%,rgba(202,138,4,0.08),transparent_50%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 border-b border-gold/10 pb-12 text-center md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold">
                Capability Matrix
              </span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-4 text-4xl font-bold sm:text-5xl md:text-6xl"
          >
            Features
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Encrypt. Connect. Control. A layered messaging stack where privacy is the foundation, not an afterthought.
          </motion.p>
        </div>

        <div className="lg:flex lg:gap-12 lg:items-start">
          {/* Desktop TOC */}
          <aside className="sticky top-28 hidden w-[200px] flex-shrink-0 lg:block">
            <nav className="space-y-0.5">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] transition-all duration-200",
                    activeSection === item.id
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full transition-colors duration-200",
                      activeSection === item.id ? "bg-gold" : "bg-transparent"
                    )}
                  />
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-24 md:space-y-28">
            {/* Mobile TOC */}
            <div className="overflow-x-auto pb-2 lg:hidden">
              <nav className="flex gap-2">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      "flex-shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] transition-all duration-200",
                      activeSection === item.id
                        ? "bg-gold text-black"
                        : "border border-gold/20 bg-gold/5 text-gold"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* 1. Encryption */}
            <Section id="encryption">
              <SecuritySpotlight
                badge="Encryption Layer"
                title="End-to-end encryption is part of the product story, not a hidden checkbox."
                description="anonimi uses conversation-level encryption so private chats and group rooms keep readable content on participant devices while the server handles transport, delivery, and coordination. Even moderators and super admins cannot open encrypted message content."
                ctaHref="/register"
                ctaLabel="Start encrypted chats"
                secondaryHref="/about"
                secondaryLabel="Read the philosophy"
              />
            </Section>

            {/* 2. Messaging */}
            <Section id="messaging">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                <div>
                  <SectionBadge icon={Zap} label="Core Messaging" />
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Real-time Messaging</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Fast delivery, read state, and reactions that stay in sync across every device. Messages arrive instantly without losing the privacy layer underneath.
                  </p>
                  <BulletList
                    items={[
                      "WebSocket connections for instant delivery",
                      "Optimistic updates for snappy UI",
                      "Offline queue for reliability",
                      "Encrypted content stays unreadable to admins",
                    ]}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Typing indicators", "Read receipts", "Reactions"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-gold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="overflow-hidden rounded-2xl border border-gold/10 bg-gold/[0.03] p-1"
                >
                  <div className="rounded-xl border border-gold/5 bg-card/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                        <MessageCircle className="h-6 w-6 text-gold" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-24 rounded-full bg-gold/20" />
                        <div className="h-2 w-32 rounded-full bg-gold/10" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 w-full rounded-full bg-gold/10" />
                      <div className="h-2 w-3/4 rounded-full bg-gold/10" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </Section>

            {/* 3. Identity */}
            <Section id="identity">
              <div className="grid items-center gap-10 rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="order-2 lg:order-1"
                >
                  <div className="rounded-xl border border-gold/10 bg-card/50 p-5">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                      Example AID
                    </p>
                    <div className="mt-3 rounded-lg border border-gold/15 bg-gold/5 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Your AID</p>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        anon_8x7k2m
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Share this instead of your email or phone number, then let encryption handle the rest.
                    </p>
                  </div>
                </motion.div>
                <div className="order-1 lg:order-2">
                  <SectionBadge icon={UserCircle} label="Identity Layer" />
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Privacy-First Identity</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Your AID is generated automatically so you can share a private identity without revealing personal contact data.
                  </p>
                  <BulletList
                    items={[
                      "No phone required for sign-up",
                      "Pseudonymous by default",
                      "Reveal personal info on your terms",
                    ]}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["No phone required", "Pseudonymous", "Reveal on your terms"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-gold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* 4. Groups */}
            <Section id="groups">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                <div>
                  <SectionBadge icon={Users} label="Collaboration" />
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Group Chats</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Build teams and communities with roles, nicknames, and join requests that keep groups organized.
                  </p>
                  <BulletList
                    items={[
                      "Assign admin and moderator roles",
                      "Set custom nicknames per group",
                      "Approve join requests before entry",
                    ]}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Role-based permissions", "Custom nicknames", "Join requests"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-gold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button className="btn-gold rounded-full px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]" asChild>
                      <Link href="/register">Start a group</Link>
                    </Button>
                    <Button variant="ghost" className="rounded-full border border-gold/20 px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-gold" asChild>
                      <Link href="/contact">Learn more</Link>
                    </Button>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-1"
                >
                  <div className="rounded-xl border border-gold/5 bg-card/50 p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gold" />
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">Team Sync</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {["Admin", "Moderator", "Member", "Member"].map((role, i) => (
                        <div key={role + i} className="flex items-center gap-2 rounded-lg border border-gold/10 bg-gold/5 px-3 py-2">
                          <div className="h-6 w-6 rounded-full bg-gold/20" />
                          <div>
                            <p className="text-xs font-medium text-foreground">User {i + 1}</p>
                            <p className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-gold">{role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </Section>

            {/* 5. Media */}
            <Section id="media">
              <div className="relative overflow-hidden rounded-2xl border border-gold/10 bg-gold/[0.03] py-12 md:py-16">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(202,138,4,0.06),transparent_50%)]" />
                <div className="relative grid items-center gap-10 px-6 md:px-10 lg:grid-cols-2 lg:gap-14">
                  <div>
                    <SectionBadge icon={ImageIcon} label="Media Layer" />
                    <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Media Sharing</h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                      Share images and files with clean previews and reliable delivery, even on busy threads.
                    </p>
                    <BulletList
                      items={[
                        "Fast uploads with progress indicators",
                        "Rich previews for images and documents",
                        "Reliable delivery on any connection",
                      ]}
                    />
                    <div className="mt-6 flex flex-wrap gap-2">
                      {["JPG", "PNG", "GIF", "MP4", "PDF", "ZIP"].map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-lg border border-gold/15 bg-gold/5 px-3 py-1.5 font-mono text-xs text-foreground"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                    className="rounded-xl border border-gold/10 bg-card/50 p-4"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="aspect-square rounded-lg bg-gold/10" />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </Section>

            {/* 6. Safety + 7. Moderation */}
            <Section id="safety">
              <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-8">
                <SectionBadge icon={Shield} label="Safety Controls" />
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Block & Report</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Decide who reaches you with requests, blocks, and reporting tools that keep your space calm.
                </p>
                <BulletList
                  items={[
                    "Block unwanted contacts instantly",
                    "Report violations to moderators",
                    "Control who can message you",
                  ]}
                />
              </div>
            </Section>

            <Section id="moderation">
              <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-8">
                <SectionBadge icon={Scale} label="Platform Layer" />
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Admin & Moderation</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A dedicated moderation layer keeps the platform safe without becoming a backdoor into private conversations.
                </p>
                <BulletList
                  items={[
                    "Real-time report queue",
                    "User bans and suspensions",
                    "Full activity audit logs",
                    "No admin message browser for encrypted chats",
                  ]}
                />
              </div>
            </Section>

            {/* 8. Privacy Promise */}
            <Section id="privacy-promise" className="mx-auto max-w-3xl text-center">
              <div className="rounded-2xl border border-gold/10 bg-gold/[0.03] p-8 md:p-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10"
                >
                  <Eye className="h-7 w-7 text-gold" />
                </motion.div>
                <SectionBadge label="Privacy Promise" />
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                  Not even our admin panel can read your encrypted chats.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Moderation still works through reports, account controls, and audit trails, but encrypted message bodies are not exposed to moderators, support staff, or super admins.
                </p>
              </div>
            </Section>

            {/* 9. Temporary Access */}
            <Section id="temporary-access">
              <div className="grid items-center gap-8 rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                <div>
                  <SectionBadge icon={Clock} label="Temporary Access" />
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Start now, decide later.</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Temporary Access unlocks a full 24-hour session without permanent commitment. Start a conversation immediately, then claim it only when you want to keep the history.
                  </p>
                  <BulletList
                    items={[
                      "Start chats instantly for new contacts",
                      "Keep control before committing an identity",
                      "Convert to a full account when it matters",
                    ]}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Session-only", "Claim to keep", "24h expiration"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-gold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button className="btn-gold rounded-full px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]" asChild>
                      <Link href="/temporary">Start temporary session</Link>
                    </Button>
                    <Button variant="ghost" className="rounded-full border border-gold/20 px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-gold" asChild>
                      <Link href="/register">Create account</Link>
                    </Button>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="rounded-xl border border-gold/10 bg-card/50 p-5"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">Temporary AID</p>
                  <div className="mt-3 rounded-lg border border-gold/15 bg-gold/5 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Your temporary identifier</p>
                    <p className="font-mono text-lg font-semibold text-foreground">temp_9f3xk2</p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Use this to chat now. Claim it within 24 hours to keep your history.
                  </p>
                </motion.div>
              </div>
            </Section>

            {/* 10. Stealth Mode */}
            <Section id="stealth">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="order-2 lg:order-1 rounded-xl border border-gold/10 bg-card/50 p-5"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">Example</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg border border-gold/15 bg-gold/5 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Stealth timer</p>
                      <p className="text-sm font-semibold text-foreground">5 minutes</p>
                    </div>
                    <div className="rounded-lg border border-gold/10 bg-card px-4 py-3">
                      <p className="text-xs text-muted-foreground">Message</p>
                      <p className="text-sm text-foreground">Gate code: 4903</p>
                    </div>
                  </div>
                </motion.div>
                <div className="order-1 lg:order-2">
                  <SectionBadge icon={Lock} label="Stealth Mode" />
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Control the trail, not the thread.</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Set a lifespan for each message so sensitive details fade away. Share quickly without leaving a long-term trail.
                  </p>
                  <BulletList
                    items={[
                      "Timed expiration per message",
                      "No history linger",
                      "Full conversation stays intact",
                    ]}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Timed expiration", "Per-message control", "No history linger"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-gold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button className="btn-gold rounded-full px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]" asChild>
                      <Link href="/register">Create account</Link>
                    </Button>
                    <Button variant="ghost" className="rounded-full border border-gold/20 px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] text-gold" asChild>
                      <Link href="/contact">Ask about stealth</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* CTA */}
            <Section className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Ready to try anonimi?
                </p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Start messaging privately today.
                </h2>
                <Button className="btn-gold mt-8 rounded-full px-6 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]" size="lg" asChild>
                  <Link href="/register">Get Started Free</Link>
                </Button>
              </motion.div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
