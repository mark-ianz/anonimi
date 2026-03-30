"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ContactList from "@/components/contacts/ContactList";
import ContactRequestCard from "@/components/contacts/ContactRequestCard";
import SearchInput from "@/components/shared/SearchInput";
import UserSearchResults from "@/components/user/UserSearchResults";
import { useContacts } from "@/hooks/useContacts";

export default function ContactsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "requests" ? "requests" : "contacts";
  const [search, setSearch] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const { requests, isLoadingRequests, acceptRequest, declineRequest } = useContacts();

  const setTab = (nextTab: "contacts" | "requests") => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "requests") {
      params.set("tab", "requests");
    } else {
      params.delete("tab");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-full flex-col bg-background">
        <div className="shrink-0 space-y-3 border-b border-border/60 bg-card/45 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Network
              </p>
              <h1 className="mt-1 text-2xl leading-tight font-semibold">Contacts</h1>
            </div>
            <button
              onClick={() => setAddingContact((v) => !v)}
              title={addingContact ? "Cancel" : "Add contact"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                addingContact
                  ? "border-border/70 bg-muted text-foreground"
                  : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {addingContact ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>
          </div>

          {addingContact && (
            <div className="animate-fade-in">
              <UserSearchResults />
            </div>
          )}

          {!addingContact && (
            <>
              <div className="flex gap-1 rounded-xl border border-border/60 bg-background p-1">
                <button
                  onClick={() => setTab("contacts")}
                  className={`flex-1 h-8 rounded-lg text-sm font-medium transition-colors ${
                    tab === "contacts"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Contacts
                </button>
                <button
                  onClick={() => setTab("requests")}
                  className={`flex-1 h-8 rounded-lg text-sm font-medium transition-colors relative ${
                    tab === "requests"
                      ? "bg-muted text-foreground"
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
