"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is EchoID?",
    answer: "EchoID is a privacy-first messaging platform that gives you a unique identity without requiring phone numbers or personal information. Your EchoID is generated uniquely for you, allowing you to communicate securely and anonymously.",
  },
  {
    question: "How do I get started?",
    answer: "Simply create a free account using your email. You'll instantly receive your unique EchoID that you can share with friends to start chatting. No phone number or personal information required.",
  },
  {
    question: "Is my data private?",
    answer: "Absolutely. We believe in privacy by design. Your messages are encrypted, and we never share your personal data with third parties. You control your identity and who can contact you.",
  },
  {
    question: "Can I change my EchoID?",
    answer: "Your EchoID is unique and cannot be changed. This helps maintain trust and accountability in the platform. You can update your username once and your profile picture anytime.",
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
