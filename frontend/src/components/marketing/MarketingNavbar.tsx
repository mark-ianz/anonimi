"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 bg-card transition-colors duration-300 group-hover:bg-muted">
              <MessageCircle className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-[0.01em]">
              anonimi
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:after:scale-x-100">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" className="h-9 rounded-full px-4 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]" asChild>
            <Link href="/features" className="lg:hidden">Features</Link>
          </Button>
          <Button variant="ghost" className="h-9 rounded-full px-4 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          <Button className="h-9 rounded-full px-4 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 transition-colors hover:bg-muted sm:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/60 px-5 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-2 font-mono text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
              <Button variant="ghost" className="h-9 flex-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="h-9 flex-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em]" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
