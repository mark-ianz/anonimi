import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

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
              <span className="font-logo text-xl font-semibold">anonimi</span>
            </Link>

            <div className="mt-4 max-w-md">
              <p className="text-base font-medium leading-relaxed text-foreground/92 sm:text-[1.02rem]">
                Private conversations with a clearer boundary between
                <span className="text-primary"> identity</span>,
                <span className="text-foreground"> access</span>, and
                <span className="text-primary"> trust</span>.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Real-time messaging built around private AIDs, end-to-end encryption,
                and the promise that your messages stay yours.
              </p>
            </div>

            <div className="mt-6">
              <a
                href="https://github.com/mark-ianz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Product
            </h4>
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
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Legal
            </h4>
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Copyright {new Date().getFullYear()} anonimi. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70">Built with privacy in mind</p>
        </div>
      </div>
    </footer>
  );
}
