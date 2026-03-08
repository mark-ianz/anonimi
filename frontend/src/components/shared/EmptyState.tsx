import { cn } from "@/lib/utils";
import { MessageCircle, Users, FileText, Search, Inbox } from "lucide-react";

type EmptyVariant = "conversations" | "messages" | "contacts" | "search" | "generic" | "requests";

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const icons: Record<EmptyVariant, React.ElementType> = {
  conversations: MessageCircle,
  messages: MessageCircle,
  contacts: Users,
  search: Search,
  requests: Inbox,
  generic: FileText,
};

export default function EmptyState({
  variant = "generic",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icons[variant];

  const defaults: Record<EmptyVariant, { title: string; description: string }> = {
    conversations: {
      title: "No conversations yet",
      description: "Start messaging by finding a contact or searching for someone.",
    },
    messages: {
      title: "No messages yet",
      description: "Send the first message to get the conversation started.",
    },
    contacts: {
      title: "No contacts yet",
      description: "Search for people by their EchoID to add them as a contact.",
    },
    search: {
      title: "No results found",
      description: "Try a different search term.",
    },
    requests: {
      title: "No requests",
      description: "You have no pending requests at the moment.",
    },
    generic: {
      title: "Nothing here yet",
      description: "Come back later.",
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-semibold text-base mb-1">
        {title ?? defaults[variant].title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {description ?? defaults[variant].description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
