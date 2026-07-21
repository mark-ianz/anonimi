"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface HowItWorksStepProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast: boolean;
}

export default function HowItWorksStep({ number, icon: Icon, title, description, isLast }: HowItWorksStepProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });

  return (
    <div ref={cardRef} className="relative flex gap-6 md:flex-col md:gap-4">
      {/* Watermark number */}
      <div className="pointer-events-none absolute -left-4 -top-6 select-none md:left-auto md:right-4">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="font-display text-[5rem] font-bold leading-none text-gold/8 sm:text-[7rem] md:text-[8rem]"
        >
          {String(number).padStart(2, "0")}
        </motion.span>
      </div>

      {/* Mobile: vertical line */}
      {!isLast && (
        <div className="absolute left-[17px] top-10 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-gold/30 via-gold/10 to-transparent md:hidden" />
      )}

      {/* Icon + Number column (mobile) */}
      <div className="relative z-10 flex flex-col items-center md:hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 100 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-gold/10"
        >
          <Icon className="h-4 w-4 text-gold" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 md:text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          className="glass-card rounded-xl p-5 md:p-6 h-full"
        >
          {/* Desktop: show icon at top */}
          <div className="hidden md:mb-4 md:flex md:justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 100 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10"
            >
              <Icon className="h-5 w-5 text-gold" />
            </motion.div>
          </div>

          <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
