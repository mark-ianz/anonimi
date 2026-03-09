import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact EchoID",
  description: "Get in touch with the EchoID team.",
};

export default function ContactPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-display font-bold">
            Get in Touch
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div>
            <h2 className="text-2xl font-semibold">Send us a message</h2>
            <p className="mt-4 text-muted-foreground">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            <ContactForm />
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold">Contact Information</h2>
              <p className="mt-4 text-muted-foreground">
                Prefer to reach out directly? Here's how you can contact us.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">support@echoid.app</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-muted-foreground">San Francisco, CA</p>
              </div>
            </div>

            <div className="pt-8 border-t border-border/50">
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
