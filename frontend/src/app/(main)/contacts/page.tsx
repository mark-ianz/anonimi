"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ContactList from "@/components/contacts/ContactList";
import ContactRequestCard from "@/components/contacts/ContactRequestCard";
import SearchInput from "@/components/shared/SearchInput";
import UserSearchResults from "@/components/user/UserSearchResults";
import { useContacts } from "@/hooks/useContacts";

export default function ContactsPage() {
  const [tab, setTab] = useState<"contacts" | "requests">("contacts");
  const [search, setSearch] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const { requests, isLoadingRequests, acceptRequest, declineRequest } = useContacts();

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-semibold">Contacts</h1>
            <button
              onClick={() => setAddingContact((v) => !v)}
              title={addingContact ? "Cancel" : "Add contact"}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                addingContact
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {addingContact ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>
          </div>

          {/* Add Contact search panel */}
          {addingContact && (
            <div className="animate-fade-in">
              <UserSearchResults />
            </div>
          )}

          {/* Tabs + contact filter search — hidden while adding */}
          {!addingContact && (
            <>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                <button
                  onClick={() => setTab("contacts")}
                  className={`flex-1 h-8 rounded-lg text-sm font-medium transition-colors ${
                    tab === "contacts"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Contacts
                </button>
                <button
                  onClick={() => setTab("requests")}
                  className={`flex-1 h-8 rounded-lg text-sm font-medium transition-colors relative ${
                    tab === "requests"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Requests
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                      {requests.length > 9 ? "9+" : requests.length}
                    </span>
                  )}
                </button>
              </div>

              {tab === "contacts" && (
                <SearchInput
                  placeholder="Search contacts..."
                  value={search}
                  onChange={setSearch}
                />
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {addingContact ? null : tab === "contacts" ? (
            <ContactList searchQuery={search} />
          ) : (
            <div>
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <UserPlus className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm mb-1">No pending requests</p>
                  <p className="text-xs text-muted-foreground">
                    New contact requests will appear here.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <ContactRequestCard
                    key={req.requestId}
                    request={req}
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
