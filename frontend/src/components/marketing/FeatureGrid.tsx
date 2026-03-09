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
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Everything you need to chat
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern communication. Simple, secure, and built for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
