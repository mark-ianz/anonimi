import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[oklch(0.55_0.15_250)]/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Secure real-time messaging</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight">
            Private messaging,
            <span className="block mt-2 bg-gradient-to-r from-primary to-[oklch(0.55_0.15_250)] bg-clip-text text-transparent">
              reimagined
            </span>
          </h1>

          <p className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience secure, real-time communication with privacy-first identity. 
            Your conversations, your rules — end-to-end encrypted and always under your control.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <Link href="/features">
                Learn More
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Privacy-first identity</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Real-time messaging</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Preview */}
        <div className="mt-20 relative">
          <div className="rounded-2xl border border-border/50 bg-background/50 p-2 shadow-2xl">
            <div className="rounded-xl bg-muted overflow-hidden aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[oklch(0.55_0.15_250)]/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.15_250)] flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-display font-bold text-white">E</span>
                  </div>
                  <p className="mt-4 text-muted-foreground">EchoID Chat Interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
