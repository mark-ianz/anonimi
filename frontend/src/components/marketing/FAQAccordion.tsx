"use client";

import { useState, useRef } from "react";
import { ChevronDown, Sparkles, Shield, MessageCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useInView } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sparkles,
    faqs: [
      {
        question: "What is anonimi?",
        answer:
          "anonimi is a privacy-first messaging platform that gives you a unique AID without requiring phone numbers or personal data. Your AID is generated for you so you can chat without exposing contact info.",
      },
      {
        question: "How do I get started?",
        answer:
          "Create a free account with email. You will instantly receive your AID to share with people you trust, or you can accept message requests when you are ready.",
      },
      {
        question: "Is anonimi free to use?",
        answer:
          "Yes, anonimi is completely free to use. We offer all core messaging features at no cost, including unlimited messages, group chats, and privacy features.",
      },
    ],
  },
  {
    id: "identity-privacy",
    title: "Identity & Privacy",
    icon: Shield,
    faqs: [
      {
        question: "What is an AID?",
        answer:
          "An AID (Anonymous Identity) is your unique identifier on anonimi. It's a randomly generated string that lets others find and message you without needing your phone number, email, or real name.",
      },
      {
        question: "Can I change my AID?",
        answer:
          "Your AID is unique and stays stable so people can reliably find you. You can update your profile details and username in settings, but the AID itself remains permanent.",
      },
      {
        question: "Is my data private?",
        answer:
          "Yes. We use encrypted transport and never require phone numbers at signup. You control your identity and who can contact you with requests, block, and report tools.",
      },
      {
        question: "Does anonimi sell my data?",
        answer:
          "No. We never sell your data to third parties. Your privacy is our priority, and we only collect the minimum data necessary to provide the service.",
      },
    ],
  },
  {
    id: "features",
    title: "Features",
    icon: MessageCircle,
    faqs: [
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
      {
        question: "How do group chats work?",
        answer:
          "You can create groups with friends, family, or colleagues. Groups support multiple roles (owner, admin, member), custom nicknames, and various settings to manage who can send messages or add new members.",
      },
      {
        question: "Can I send images and files?",
        answer:
          "Yes, you can share images, documents, and other files directly in your conversations. We support common formats like JPG, PNG, GIF, MP4, PDF and ZIP with fast upload speeds.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & Moderation",
    icon: Lock,
    faqs: [
      {
        question: "How do I block or report a user?",
        answer:
          "You can block any user by visiting their profile and clicking the block button. This will prevent them from contacting you. If you encounter behavior that violates our terms, please use the report feature so our moderation team can investigate.",
      },
      {
        question: "What happens when I block someone?",
        answer:
          "When you block someone, they can no longer send you messages or see your online status. Existing conversations are hidden, and they won't be notified that you blocked them.",
      },
      {
        question: "How long does moderation review take?",
        answer:
          "Our moderation team reviews reports within 24-48 hours. For urgent safety concerns, reports are prioritized and may be addressed sooner.",
      },
    ],
  },
];

function FAQItem({ faq, index, isOpen, onToggle }: { faq: FAQ; index: number; isOpen: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        "overflow-hidden border-b border-gold/10 transition-colors",
        isOpen && "border-gold/30"
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left font-medium transition-colors hover:text-gold"
      >
        <span className="pr-4 text-base md:text-lg">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-gold/60" />
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
            <div className="pb-5 pr-10 text-sm leading-relaxed text-muted-foreground md:text-base">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategorySection({ category, categoryIndex }: { category: FAQCategory; categoryIndex: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });
  const Icon = category.icon;

  return (
    <motion.div
      ref={ref}
      id={category.id}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: categoryIndex * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      className="scroll-mt-28 rounded-2xl border border-gold/10 bg-gold/[0.03] p-6 md:p-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <h2 className="text-xl font-bold text-gold md:text-2xl">
          {category.title}
        </h2>
      </div>
      <div>
        {category.faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function FAQAccordion() {
  return (
    <div className="space-y-8">
      {faqCategories.map((category, index) => (
        <CategorySection key={category.title} category={category} categoryIndex={index} />
      ))}
    </div>
  );
}
