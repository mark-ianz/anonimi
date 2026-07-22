"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/marketing/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="fixed left-4 right-4 top-4 z-50"
    >
      <div className="rounded-2xl border border-gold/10 bg-background/20 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 transition-colors duration-300 group-hover:bg-gold/20">
                <Image
                  src="/images/icon/anonimi-logo-no-bg.png"
                  alt="anonimi"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  priority
                />
              </div>
              <span className="font-logo text-base font-bold text-foreground tracking-tight">
                anonimi
              </span>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative font-mono text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100">
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                className="btn-gold h-8 rounded-full px-3.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em] shadow-soft transition-all duration-200 hover:opacity-90 hover:shadow-glow"
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
              <ThemeToggle />
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-muted sm:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-2 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl sm:hidden"
          >
            <nav className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2.5 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-border/60 pt-3">
                <Button
                  variant="ghost"
                  className="h-9 flex-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]"
                  asChild
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  className="btn-gold h-9 flex-1 rounded-full font-mono text-[0.65rem] font-medium uppercase tracking-[0.08em]"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
