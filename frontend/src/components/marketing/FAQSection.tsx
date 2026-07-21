"use client";

import { useState, useRef } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const faqs = [
  {
    question: "What is anonimi?",
    answer:
      "anonimi is a privacy-first messaging platform that gives you a unique AID without requiring phone numbers or personal data. Your AID is generated for you so you can chat without exposing contact info.",
  },
  {
    question: "What is an AID?",
    answer:
      "An AID (Anonymous Identity) is your unique identifier on anonimi. It's a randomly generated string that lets others find and message you without needing your phone number, email, or real name.",
  },
  {
    question: "What is a temporary account?",
    answer:
      "Temporary accounts let you start a 24-hour session without email or password. You can claim the account later to keep your conversations by adding an email and password.",
  },
  {
    question: "How does Stealth Mode work?",
    answer:
      "Stealth Mode lets you set a timer per message. When the timer expires, the message content is no longer available and the conversation shows an expired placeholder.",
  },
];

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.4, 0.25, 1] }}
      className={`glass-card rounded-xl transition-all duration-300 ${
        isOpen ? "border-gold/20 shadow-glow/50" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="pr-4 text-sm font-bold leading-snug md:text-base">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            isOpen ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"
          }`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="border-t border-gold/10 px-5 pb-5 pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                {faq.answer}
              </p>
              <Link
                href="/faq"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold transition-colors hover:text-gold-light"
              >
                Read more
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <FAQItem
          key={faq.question}
          faq={faq}
          index={index}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}

      <div className="mt-8 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-light"
        >
          View all FAQ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
