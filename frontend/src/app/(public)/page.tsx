import HeroSection from "@/components/marketing/HeroSection";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import CTASection from "@/components/marketing/CTASection";
import HowItWorksStep from "@/components/marketing/HowItWorksStep";
import { UserPlus, Share2, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up and get your EchoID",
    description: "Create a free account and receive your unique EchoID instantly. No phone number required.",
  },
  {
    icon: Share2,
    title: "Share your ID with friends",
    description: "Share your EchoID with anyone you want to chat with. It's that simple.",
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
      
      {/* How It Works Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
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
