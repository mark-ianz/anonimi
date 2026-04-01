"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is anonimi?",
    answer: "anonimi is a privacy-first messaging platform that gives you a unique AID without requiring phone numbers or personal data. Your AID is generated for you so you can chat without exposing contact info.",
  },
  {
    question: "How do I get started?",
    answer: "Create a free account with email. You will instantly receive your AID to share with people you trust, or you can accept message requests when you are ready.",
  },
  {
    question: "Is my data private?",
    answer: "Yes. We use encrypted transport and never require phone numbers at signup. You control your identity and who can contact you with requests, block, and report tools.",
  },
  {
    question: "Can I change my AID?",
    answer: "Your AID is unique and stays stable so people can reliably find you. You can update your profile details and username in settings.",
  },
  {
    question: "How do group chats work?",
    answer: "You can create groups with friends, family, or colleagues. Groups support multiple roles (owner, admin, member), custom nicknames, and various settings to manage who can send messages or add new members.",
  },
  {
    question: "How do I block or report a user?",
    answer: "You can block any user by visiting their profile and clicking the block button. This will prevent them from contacting you. If you encounter behavior that violates our terms, please use the report feature so our moderation team can investigate.",
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border/55 border-y border-border/55">
      {faqs.map((faq, index) => (
        <div 
          key={index} 
          className="overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between py-5 text-left font-medium transition-colors hover:text-primary"
          >
            <span className="text-base md:text-lg">{faq.question}</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              openIndex === index && "rotate-180"
            )} />
          </button>
          {openIndex === index && (
            <div className="pb-5 pr-10 text-sm leading-relaxed text-muted-foreground md:text-base">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
