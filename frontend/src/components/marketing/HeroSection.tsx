import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 md:pt-32 lg:pb-20 lg:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-116 bg-[radial-gradient(circle_at_12%_6%,rgba(12,39,60,0.09),transparent_40%),radial-gradient(circle_at_90%_18%,rgba(32,121,136,0.1),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.64),transparent)]" />

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 border-y border-border/70 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] md:gap-12 md:py-14">
          <div className="animate-reveal-up">
            <p className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-foreground/88">
              AID-First Messaging
            </p>

            <h1 className="mt-6 max-w-[14ch] text-4xl leading-[0.95] font-semibold sm:text-5xl md:text-6xl">
              Private identity, clean conversations.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              anonimi gives every user a private AID instead of exposing personal contact data.
              Share it once, keep control with requests, and keep messaging focused.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-11 rounded-full px-7 text-sm font-semibold" asChild>
                <Link href="/register">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/80 bg-background/70 px-7 text-sm font-semibold"
                asChild
              >
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-3">
              <p>Encrypted transport</p>
              <p>AID-only discovery</p>
              <p>Verification resume</p>
            </div>
          </div>

          <div className="animate-reveal-up [animation-delay:140ms]">
            <div className="rounded-[1.5rem] border border-border/75 bg-card/70 p-5 shadow-soft">
              <div className="rounded-2xl border border-border/65 bg-background/85 p-5">
                <div className="mb-5 flex items-center justify-between border-b border-border/55 pb-3">
                  <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Message Preview
                  </p>
                  <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.06em] text-foreground/85">12 ms</p>
                </div>
                <div className="space-y-3">
                  <div className="max-w-[82%] rounded-2xl rounded-bl-sm border border-border/65 bg-card px-4 py-3 text-sm leading-relaxed text-foreground animate-drift">
                    Need a secure group room for tonight&apos;s drop?
                  </div>
                  <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                    Created. Invite link expires in 10 minutes.
                  </div>
                  <div className="max-w-[82%] rounded-2xl rounded-bl-sm border border-border/65 bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
                    Perfect. Sending anonimi now.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
