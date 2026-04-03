"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get("phone_number");

    if (phoneNumber && phoneNumber.toString().trim().length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const subject = formData.get("subject") as string;
      const message = formData.get("message") as string;

      await api.post("/contact", {
        name,
        email,
        subject,
        message,
      });

      setIsLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 border-t border-border/50 pt-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full border border-border/60 bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-xl font-semibold">Message sent!</h3>
        <p className="mt-2 text-muted-foreground">
          Thank you for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        <Button 
          className="mt-6 p-5 cursor-pointer" 
          variant="outline" 
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        type="text"
        name="phone_number"
        id="phone_number"
        className="absolute -left-[9999px] top-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input 
            id="name" 
            name="name"
            className="flex h-11 w-full rounded-xl border border-input/80 bg-background/65 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="John Doe" 
            required 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input 
            id="email" 
            name="email"
            type="email" 
            className="flex h-11 w-full rounded-xl border border-input/80 bg-background/65 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="john@example.com" 
            required 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
        <input 
          id="subject" 
          name="subject"
          className="flex h-11 w-full rounded-xl border border-input/80 bg-background/65 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="How can we help?" 
          required 
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea 
          id="message" 
          name="message"
          className="flex min-h-35 w-full rounded-xl border border-input/80 bg-background/65 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tell us more about your inquiry..." 
          required 
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button type="submit" className="cursor-pointer p-5 w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}