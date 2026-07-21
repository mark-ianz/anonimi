"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function MarketingFooter() {
  const [showMantra, setShowMantra] = useState(false);

  return (
    <footer className="relative border-t border-white/5 bg-card/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/3 h-[200px] w-[300px] rounded-full bg-gold/3 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2">
            <div
              onMouseEnter={() => setShowMantra(true)}
              onMouseLeave={() => setShowMantra(false)}
              className="relative"
            >
              <Link href="/" className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10">
                  <Image
                    src="/images/icon/anonimi-logo-no-bg.png"
                    alt="anonimi"
                    width={22}
                    height={22}
                    className="h-5 w-5"
                  />
                </div>
                <span className="font-logo text-xl font-bold text-foreground">
                  anonimi
                </span>
              </Link>
              <AnimatePresence>
                {showMantra && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                    className="absolute -bottom-5 left-0 font-mono text-[0.5rem] uppercase tracking-[0.15em] text-gold/60"
                  >
                    Your identity, your data, your terms
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 max-w-md">
              <p className="text-base font-medium leading-relaxed text-foreground/92 sm:text-[1.02rem]">
                Private conversations with a clearer boundary between
                <span className="text-gold"> identity</span>,
                <span className="text-foreground"> access</span>, and
                <span className="text-gold"> trust</span>.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Real-time messaging built around private AIDs, end-to-end encryption,
                and the promise that your messages stay yours.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://github.com/mark-ianz"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:text-foreground"
              >
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
              <div className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3 py-2">
                <Shield className="h-3.5 w-3.5 text-gold" />
                <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-gold">
                  Privacy Score: 95/100
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Product
            </h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Legal
            </h4>
            <nav className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Copyright {new Date().getFullYear()} anonimi. All rights reserved.
          </p>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground/50">
            Built with privacy in mind
          </p>
        </div>
      </div>
    </footer>
  );
}
