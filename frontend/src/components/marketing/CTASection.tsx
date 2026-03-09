import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-[ok.55_0lch(0.15_250)] overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative px-8 py-16 lg:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Join thousands of users who have already discovered a better way to communicate. 
              Sign up for free today.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-base px-8 h-12"
                asChild
              >
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 h-12 border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
