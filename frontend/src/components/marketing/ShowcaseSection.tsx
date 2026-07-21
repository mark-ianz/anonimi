"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const image = imageRef.current;
      if (!image) return;

      gsap.to(image, {
        y: 40,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-24 md:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex rounded-full border border-border/70 bg-card px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              See It In Action
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl md:text-[2.8rem]">
              A messaging interface built for clarity.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
              Real-time conversations with identity-safe discovery, delivery states, and encryption indicators baked into every view.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-16 w-full">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
            <div ref={imageRef} className="relative w-full">
              <Image
                src="/images/stock/real-time-messaging-section-image.png"
                alt="anonimi real-time messaging interface preview"
                width={1920}
                height={1080}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/5" />
          </div>
        </div>
        <div className="pointer-events-none absolute -inset-x-24 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>
    </section>
  );
}
