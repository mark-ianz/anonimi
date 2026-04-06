"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  MessageCircle,
  Shield,
  Users,
  Zap,
  Bell,
  Image as ImageIcon,
  KeyRound,
} from "lucide-react";

type IconName =
  | "MessageCircle"
  | "Shield"
  | "Users"
  | "Zap"
  | "Bell"
  | "ImageIcon"
  | "KeyRound";

const iconMap = {
  MessageCircle,
  Shield,
  Users,
  Zap,
  Bell,
  ImageIcon,
  KeyRound,
};

interface FeatureCardProps {
  iconName: IconName;
  title: string;
  description: string;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  className?: string;
  index: number;
  isInView: boolean;
}

function FeatureCard({
  iconName,
  title,
  description,
  size = "medium",
  className,
  index,
  isInView,
}: FeatureCardProps) {
  const Icon = iconMap[iconName];
  const isLarge = size === "large";
  const isTall = size === "tall";
  const isWide = size === "wide";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 30, scale: 0.95 }
      }
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card",
        isLarge && "p-7",
        isTall && "p-6",
        isWide && "p-6",
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        <div
          className={cn(
            "mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15",
            isLarge && "mb-5 h-12 w-12",
            isTall && "mb-5 h-11 w-11"
          )}
        >
          <Icon className={cn("h-5 w-5", (isLarge || isTall) && "h-6 w-6")} />
        </div>

        <h3
          className={cn(
            "mb-2 text-base font-semibold text-foreground",
            isLarge && "mb-3 text-xl",
            isTall && "mb-3 text-lg",
            isWide && "text-lg"
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            isLarge && "text-base",
            isTall && "text-[0.9rem]"
          )}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

const features: {
  iconName: IconName;
  title: string;
  description: string;
  size: "small" | "medium" | "large" | "wide" | "tall";
}[] = [
  {
    iconName: "MessageCircle",
    title: "Real-time Messaging",
    description:
      "Instant delivery with typing indicators and read receipts. Conversations stay fluid across all your devices with seamless sync.",
    size: "large",
  },
  {
    iconName: "Shield",
    title: "Privacy-First Identity",
    description:
      "Your AID is generated for you with email-only signup. No phone required, no tracking, just secure communication.",
    size: "tall",
  },
  {
    iconName: "Users",
    title: "Group Chats",
    description:
      "Create groups with roles, nicknames, and rich settings. Perfect for teams, friends, and communities of any size.",
    size: "medium",
  },
  {
    iconName: "Zap",
    title: "Low-Latency Sync",
    description:
      "Built for real-time delivery and quick catch-up across devices.",
    size: "medium",
  },
  {
    iconName: "Bell",
    title: "Smart Notifications",
    description:
      "Customize your notification preferences per chat. Stay informed without being overwhelmed by noise.",
    size: "wide",
  },
  {
    iconName: "ImageIcon",
    title: "Media Resilience",
    description:
      "Reliable media delivery with previews and automatic retries even on flaky networks.",
    size: "medium",
  },
  {
    iconName: "KeyRound",
    title: "Conversation Keys",
    description:
      "End-to-end encrypted rooms with conversation-level keys built for private messaging flows.",
    size: "medium",
  },
];

export default function FeatureGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, {
    once: false,
    amount: 0.2,
    margin: "-50px",
  });

  return (
    <section className="relative py-20 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-88 bg-[radial-gradient(circle_at_20%_18%,rgba(23,62,86,0.14),transparent_45%),radial-gradient(circle_at_88%_30%,rgba(46,113,128,0.14),transparent_48%)]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 md:mb-14">
          <p className="inline-flex rounded-full border border-border/70 bg-card/70 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Feature Set
          </p>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-4xl md:text-[2.95rem]">
            Private messaging layers, composed like a system.
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            A bento layout built around identity safety, speed, and control—not
            decorative filler.
          </p>
        </div>

        {/* Bento Grid - 7 cards */}
        <div
          ref={gridRef}
          className="grid auto-rows-[minmax(160px,auto)] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6"
        >
          {/* Large - Real-time Messaging (2x2) */}
          <div className="col-span-2 row-span-2">
            <FeatureCard
              iconName={features[0].iconName}
              title={features[0].title}
              description={features[0].description}
              size="large"
              className="h-full"
              index={0}
              isInView={isInView}
            />
          </div>

          {/* Tall - Privacy-First Identity (1x2) */}
          <div className="col-span-2 row-span-2 lg:col-span-2">
            <FeatureCard
              iconName={features[1].iconName}
              title={features[1].title}
              description={features[1].description}
              size="tall"
              className="h-full"
              index={1}
              isInView={isInView}
            />
          </div>

          {/* Medium - Group Chats */}
          <div className="col-span-2 lg:col-span-2">
            <FeatureCard
              iconName={features[2].iconName}
              title={features[2].title}
              description={features[2].description}
              size="medium"
              className="h-full"
              index={2}
              isInView={isInView}
            />
          </div>

          {/* Medium - Low-Latency Sync */}
          <div className="col-span-2 lg:col-span-2">
            <FeatureCard
              iconName={features[3].iconName}
              title={features[3].title}
              description={features[3].description}
              size="medium"
              className="h-full"
              index={3}
              isInView={isInView}
            />
          </div>

          {/* Wide - Smart Notifications */}
          <div className="col-span-2 lg:col-span-3">
            <FeatureCard
              iconName={features[4].iconName}
              title={features[4].title}
              description={features[4].description}
              size="wide"
              className="h-full"
              index={4}
              isInView={isInView}
            />
          </div>

          {/* Medium - Media Resilience */}
          <div className="col-span-2 lg:col-span-2">
            <FeatureCard
              iconName={features[5].iconName}
              title={features[5].title}
              description={features[5].description}
              size="medium"
              className="h-full"
              index={5}
              isInView={isInView}
            />
          </div>

          {/* Medium - Audit Logs */}
          <div className="col-span-2 lg:col-span-1">
            <FeatureCard
              iconName={features[6].iconName}
              title={features[6].title}
              description={features[6].description}
              size="medium"
              className="h-full"
              index={6}
              isInView={isInView}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
