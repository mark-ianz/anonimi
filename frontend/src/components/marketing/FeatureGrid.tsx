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
    description: "Your anonimi is uniquely generated — no phone numbers or personal info required. Stay anonymous while chatting.",
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
    <section className="relative py-20 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-88 bg-[radial-gradient(circle_at_20%_18%,rgba(23,62,86,0.14),transparent_45%),radial-gradient(circle_at_88%_30%,rgba(46,113,128,0.14),transparent_48%)]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 md:mb-14">
          <p className="inline-flex rounded-full border border-border/70 bg-card/70 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Feature Set
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl leading-[0.98] font-semibold sm:text-4xl md:text-[2.95rem]">
            Private chat primitives, composed like a system.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            A bento layout built around identity safety, speed, and control, not decorative filler.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <div className="md:col-span-8">
            <FeatureCard
              icon={coreFeature.icon}
              title={coreFeature.title}
              description={coreFeature.description}
              delay={0}
              emphasized
              size="feature"
            />
          </div>

          <div className="grid gap-4 md:col-span-4">
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

          <div className="grid grid-cols-1 gap-4 md:col-span-7 md:grid-cols-2 md:gap-5">
            {secondaryFeatures.slice(2, 4).map((feature, index) => (
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

          <div className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft md:col-span-5 md:p-7">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">Design Principle</p>
            <h3 className="mt-3 text-2xl leading-tight font-semibold">Every identity interaction needs a recovery path.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              anonimi now includes verification resume, resend with cooldown, and explicit pending-account continuation from login.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-border/65 bg-background/70 p-3">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground">Recovery</p>
                <p className="mt-1 font-medium">Resume + resend</p>
              </div>
              <div className="rounded-2xl border border-border/65 bg-background/70 p-3">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground">Routing</p>
                <p className="mt-1 font-medium">Guarded verify flow</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-2 md:gap-5">
            {secondaryFeatures.slice(4).map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={(index + 7) * 90}
                size="compact"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
