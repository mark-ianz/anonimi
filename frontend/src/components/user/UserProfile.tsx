"use client";

import { useQuery } from "@tanstack/react-query";
import { useContacts } from "@/hooks/useContacts";
import { usePresence } from "@/hooks/usePresence";
import api from "@/lib/api";
import type { PublicUser } from "@/types/user";
import { MessageCircle, UserPlus, UserMinus, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnlineIndicator from "./OnlineIndicator";
import DateDisplay from "@/components/shared/DateDisplay";

interface UserProfileProps {
  echoId: string;
}

export default function UserProfile({ echoId }: UserProfileProps) {
  const router = useRouter();
  const { sendRequest, removeContact, contacts } = useContacts();

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", echoId],
    queryFn: async () => {
      const res = await api.get(`/users/${echoId}`);
      return res.data.data as PublicUser;
    },
    staleTime: 1000 * 60,
  });

  const { status: presenceStatus } = usePresence(user?.id);

  const contact = contacts.find((c) => c.echoId === echoId);
  const isContact = !!contact;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">User not found.</div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-6 animate-fade-in">
      {/* Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-display font-semibold">
            {user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          <OnlineIndicator
            status={presenceStatus}
            size="lg"
            className="absolute bottom-1 right-1 border-2 border-background rounded-full"
          />
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-1">
        <h2 className="font-display font-semibold text-xl">
          {contact?.nickname ?? user.username}
        </h2>
        <p className="text-sm text-muted-foreground">@{user.echoId}</p>
        <OnlineIndicator status={presenceStatus} showLabel className="justify-center" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/chat?user=${echoId}`}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>

        {isContact ? (
          <button
            onClick={() => contact && removeContact(contact.contactId)}
            className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <UserMinus className="w-4 h-4" />
            Remove
          </button>
        ) : (
          <button
            onClick={() => sendRequest(echoId)}
            className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add contact
          </button>
        )}
      </div>

      {/* Member since */}
      {user.createdAt && (
        <p className="text-xs text-muted-foreground text-center">
          Member since <DateDisplay date={user.createdAt} format="short" />
        </p>
      )}
    </div>
  );
}
