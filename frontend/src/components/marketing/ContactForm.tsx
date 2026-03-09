"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="p-6 border border-border/50 rounded-lg text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-xl font-semibold">Message sent!</h3>
        <p className="mt-2 text-muted-foreground">
          Thank you for reaching out. We'll get back to you as soon as possible.
        </p>
        <Button 
          className="mt-6" 
          variant="outline" 
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-6 border border-border/50 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input 
            id="name" 
            name="name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="How can we help?" 
          required 
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea 
          id="message" 
          name="message"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tell us more about your inquiry..." 
          required 
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
