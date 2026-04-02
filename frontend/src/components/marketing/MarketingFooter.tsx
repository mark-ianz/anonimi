import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

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
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-background">
                <Image
                  src="/images/icon/anonimi-logo-no-bg.png"
                  alt="anonimi"
                  width={22}
                  height={22}
                  className="h-5 w-5"
                />
              </div>
              <span className="font-logo text-xl font-semibold">
                anonimi
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Private messaging, reimagined. A secure, real-time chat platform with privacy-first identity.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Product</h4>
            <nav className="mt-4 flex flex-col gap-2">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Legal</h4>
            <nav className="mt-4 flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} anonimi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
