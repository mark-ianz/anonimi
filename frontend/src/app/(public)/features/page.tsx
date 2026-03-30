import type { Metadata } from "next";
import { MessageCircle, Shield, Users, Zap, Lock, Bell, Settings, Image } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "EchoID Features",
  description: "Explore EchoID's messaging, groups, privacy, and moderation features.",
};

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Experience lightning-fast message delivery with instant notifications. See when your messages are sent, delivered, and read with read receipts.",
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
    description: "Your EchoID is generated uniquely with email-only signup, optional usernames, and no phone requirement at registration.",
    details: [
      "Unique generated IDs",
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
      "Block users",
      "Report violations",
      "Message requests",
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
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-display font-bold">
            Features
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for modern, secure communication
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col lg:flex-row gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl sm:text-3xl font-display font-bold">
                  {feature.title}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="aspect-square max-w-md mx-auto rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center">
                  <feature.icon className="w-24 h-24 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-2xl font-semibold">Ready to try EchoID?</h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of users who have already discovered a better way to communicate.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
