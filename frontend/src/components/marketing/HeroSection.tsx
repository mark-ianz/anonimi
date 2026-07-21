"use client";

import { HeroSection as Hero } from "@/components/ui/hero-section";

export default function HeroSection() {
  return (
    <Hero
      badge={{
        text: "Privacy-first messaging",
        action: {
          text: "Learn more",
          href: "/features",
        },
      }}
      title="Private identity, clean conversations."
      description="Every user gets a private AID — no phone number, no email exposure. Share it once, control who reaches you, and keep every message locked with end-to-end encryption."
      actions={[
        {
          text: "Get Your AID",
          href: "/register",
          variant: "default",
        },
        {
          text: "Explore Features",
          href: "/features",
          variant: "glow",
        },
      ]}
      image={{
        src: "/images/stock/laptop.png",
        alt: "anonimi messaging dashboard preview",
      }}
    />
  );
}
