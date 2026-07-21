"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SplitSectionProps {
  badge: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  reverse?: boolean;
  tags?: string[];
  color?: "amber" | "cyan" | "emerald" | "primary";
  children?: React.ReactNode;
  badgeBorder?: string;
  badgeBg?: string;
  badgeText?: string;
  tagBorder?: string;
  tagBg?: string;
  tagText?: string;
  ctaBg?: string;
  ctaHoverBg?: string;
}

export default function SplitSection({
  badge,
  title,
  description,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  imageSrc,
  imageAlt = "",
  reverse = false,
  tags,
  children,
  badgeBorder = "border-primary/30",
  badgeBg = "bg-primary/12",
  badgeText = "text-primary",
  tagBorder = "border-primary/25",
  tagBg = "bg-primary/8",
  tagText = "text-primary",
  ctaBg = "bg-primary",
  ctaHoverBg = "hover:bg-primary/90",
}: SplitSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const content = contentRef.current;
      const visual = visualRef.current;
      if (!content || !visual) return;

      gsap.fromTo(
        content,
        { opacity: 0, x: reverse ? 30 : -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        visual,
        { opacity: 0, x: reverse ? -30 : 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative w-full py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div
          className={`grid items-center gap-12 md:gap-16 ${
            reverse ? "lg:grid-flow-dense" : ""
          } lg:grid-cols-2`}
        >
          <div className={reverse ? "lg:col-start-2" : ""}>
            <div ref={contentRef}>
              <p
                className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] ${badgeBorder} ${badgeBg} ${badgeText}`}
              >
                {badge}
              </p>

              <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-[1.04] sm:text-4xl md:text-[2.8rem]">
                {title}
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {description}
              </p>

              {children && <div className="mt-8">{children}</div>}

              {tags && tags.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-3 py-1 ${tagBorder} ${tagBg} ${tagText}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  className={`inline-flex h-11 items-center rounded-lg ${ctaBg} ${ctaHoverBg} px-6 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated`}
                >
                  {ctaLabel}
                </Link>
                {secondaryHref && secondaryLabel && (
                  <Link
                    href={secondaryHref}
                    className="inline-flex h-11 items-center rounded-lg border border-border/80 bg-background/70 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className={reverse ? "lg:col-start-1" : ""}>
            <div ref={visualRef}>
              {children ? (
                children
              ) : imageSrc ? (
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
