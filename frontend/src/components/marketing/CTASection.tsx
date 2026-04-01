import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="rounded-[1.75rem] border border-border/75 bg-card/65 px-6 py-12 sm:px-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Build With anonimi
            </p>
            <h2 className="mt-4 text-3xl leading-[1.04] font-semibold sm:text-4xl md:text-[2.8rem]">
              Ready to move to private-first messaging?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Start free, claim your identity, and launch secure conversations in minutes.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-11 rounded-full px-7 text-sm font-semibold" asChild>
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-sm font-semibold" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
