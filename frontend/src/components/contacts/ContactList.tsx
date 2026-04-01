"use client";

import { useContacts } from "@/hooks/useContacts";
import ContactItem from "./ContactItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";

interface ContactListProps {
  searchQuery?: string;
}

export default function ContactList({ searchQuery = "" }: ContactListProps) {
  const {
    contacts,
    isLoadingContacts,
    hasMoreContacts,
    fetchMoreContacts,
    removeContact,
  } = useContacts();

  const filtered = searchQuery
    ? contacts.filter((c) => {
        const name = c.nickname ?? c.username;
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.anonimiId.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : contacts;

  if (isLoadingContacts) {
    return <LoadingSkeleton variant="conversation" rows={6} />;
  }

  if (!filtered.length) {
    return (
      <EmptyState
        variant={searchQuery ? "search" : "contacts"}
        description={
          searchQuery
            ? `No contacts matching "${searchQuery}"`
            : "Add contacts by searching their anonimi."
        }
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.map((contact) => (
        <ContactItem
          key={contact.contactId}
          contact={contact}
          onRemove={removeContact}
        />
      ))}
      <InfiniteScrollSentinel
        onLoadMore={() => fetchMoreContacts()}
        hasMore={hasMoreContacts ?? false}
        isLoading={false}
      />
    </div>
  );
}
