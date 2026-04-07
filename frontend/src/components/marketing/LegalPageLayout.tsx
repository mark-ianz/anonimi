import Link from "next/link";
import type { ReactNode } from "react";

interface LegalHighlight {
  eyebrow: string;
  title: string;
  description: string;
}

interface LegalSection {
  id: string;
  number: string;
  title: string;
  body: ReactNode;
}

interface LegalPageLayoutProps {
  badge: string;
  title: string;
  description: string;
  updatedAt: string;
  accentClassName: string;
  dotClassName: string;
  panelClassName: string;
  highlight: LegalHighlight;
  quickFacts: string[];
  relatedLink: {
    href: string;
    label: string;
  };
  sections: LegalSection[];
}

export default function LegalPageLayout({
  badge,
  title,
  description,
  updatedAt,
  accentClassName,
  dotClassName,
  panelClassName,
  highlight,
  quickFacts,
  relatedLink,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div className="relative pb-20 pt-24 md:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent)]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="border-b border-border/60 pb-8">
          <div className="max-w-3xl">
            <p className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] ${accentClassName}`}>
              {badge}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              {title}
            </h1>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground sm:text-[0.95rem]">
              <p>Published: {updatedAt}</p>
              <p>
                Related document:{" "}
                <Link
                  href={relatedLink.href}
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                >
                  {relatedLink.label}
                </Link>
              </p>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="min-w-0">
            <div className={`rounded-3xl border p-6 md:p-7 ${panelClassName}`}>
              <p className={`font-mono text-[0.64rem] uppercase tracking-[0.14em] ${accentClassName}`}>
                {highlight.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold leading-tight">{highlight.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {highlight.description}
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {quickFacts.map((fact) => (
                  <div
                    key={fact}
                    className="rounded-2xl border border-border/55 bg-background/78 p-4"
                  >
                    <span className={`mb-3 block h-2.5 w-2.5 rounded-full ${dotClassName}`} />
                    <p className="text-sm leading-relaxed text-muted-foreground">{fact}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 max-w-3xl space-y-10">
              {sections.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-28 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {section.number}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-[2rem]">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[0.98rem] leading-8 text-muted-foreground">
                    {section.body}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
