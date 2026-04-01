import HeroSection from "@/components/marketing/HeroSection";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import CTASection from "@/components/marketing/CTASection";
import HowItWorksStep from "@/components/marketing/HowItWorksStep";
import { UserPlus, Share2, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up and get your anonimi",
    description: "Create a free account with email and receive your anonimi instantly. Username is optional and auto-generated if you skip it.",
  },
  {
    icon: Share2,
    title: "Share your ID with friends",
    description: "Share your anonimi with anyone you want to chat with. It's that simple.",
  },
  {
    icon: MessageCircle,
    title: "Start messaging instantly",
    description: "Enjoy secure, real-time messaging with end-to-end encryption and no delays.",
  },
];

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-12 border-l border-border/70 pl-5 md:mb-14 md:pl-6">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Start In Minutes
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-[1.02] font-semibold sm:text-4xl md:text-[2.8rem]">
              A quiet setup flow designed for focus.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Create your identity, share it once, then talk privately across every device.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {steps.map((step, index) => (
              <HowItWorksStep
                key={step.title}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      <FeatureGrid />
      <CTASection />
    </>
  );
}
