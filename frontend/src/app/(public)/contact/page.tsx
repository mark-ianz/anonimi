import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact anonimi",
  description: "Get in touch with the anonimi team.",
};

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden pb-20 pt-24 md:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-[radial-gradient(circle_at_18%_15%,rgba(16,55,82,0.16),transparent_44%),radial-gradient(circle_at_84%_24%,rgba(53,109,127,0.14),transparent_45%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-border/50 pb-10 text-center md:mb-16">
          <p className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            Contact
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 max-w-6xl mx-auto">
          <div>
            <h2 className="text-2xl font-semibold">Send us a message</h2>
            <p className="mt-4 text-muted-foreground">
              Tell us what you need help with. If it is account-specific, include your AID.
            </p>
            <ContactForm />
          </div>

          <div className="space-y-6 border-l border-border/45 pl-0 lg:pl-8">
            <div>
              <h2 className="text-2xl font-semibold">Contact Information</h2>
              <p className="mt-4 text-muted-foreground">
                Prefer to reach out directly? Here's how you can contact us.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-border/60 bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">support@anonimi.app</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-border/60 bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-muted-foreground">San Francisco, CA</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/45">
              <h3 className="font-medium">Support Hours</h3>
              <p className="text-muted-foreground mt-2">
                Monday - Friday: 9am - 6pm PST<br />
                Saturday - Sunday: Closed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
