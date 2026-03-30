import { MessageCircle, Shield, Users, Zap, Lock, Bell } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Instant message delivery with typing indicators and read receipts. Experience conversations that flow naturally.",
  },
  {
    icon: Shield,
    title: "Privacy-First Identity",
    description: "Your EchoID is uniquely generated — no phone numbers or personal info required. Stay anonymous while chatting.",
  },
  {
    icon: Users,
    title: "Group Chats",
    description: "Create groups with roles, nicknames, and rich settings. Perfect for teams, friends, and communities.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "Your messages are secured with industry-standard encryption. Only you and your recipients can read them.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for sub-millisecond message delivery. No lag, no waiting.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Customize your notification preferences. Stay informed without being overwhelmed.",
  },
];

export default function FeatureGrid() {
  const [coreFeature, ...secondaryFeatures] = features;

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 border-l border-border/70 pl-5 md:mb-14 md:pl-6">
          <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Feature Set
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl leading-[1.02] font-semibold sm:text-4xl md:text-[2.8rem]">
            The essentials for modern private chat.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            No clutter. Just dependable messaging primitives with strong defaults.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <div className="md:col-span-7">
            <FeatureCard
              icon={coreFeature.icon}
              title={coreFeature.title}
              description={coreFeature.description}
              delay={0}
              emphasized
              size="feature"
            />
          </div>

          <div className="grid gap-4 md:col-span-5">
            {secondaryFeatures.slice(0, 2).map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={(index + 1) * 90}
                size="compact"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-3 md:gap-5">
            {secondaryFeatures.slice(2).map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={(index + 3) * 90}
                emphasized={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
