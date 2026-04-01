import type { Metadata } from "next";
import { MessageCircle, Shield, Users, Zap, Lock, Bell, Image } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
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
                <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_16%_18%,rgba(44,106,130,0.22),transparent_42%),radial-gradient(circle_at_84%_82%,rgba(18,52,91,0.24),transparent_45%),linear-gradient(165deg,rgba(255,255,255,0.64),rgba(255,255,255,0.2))]">
                  <div className="absolute inset-3 rounded-[1.2rem] border border-white/25" />
                  <feature.icon className="relative z-10 w-24 h-24 text-foreground/50" />
                </div>
              </div>
            </div>
          ))}
        </div>

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
