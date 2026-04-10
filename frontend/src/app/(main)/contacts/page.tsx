"use client";

import { Suspense } from "react";
import { UserPlus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ContactList from "@/components/contacts/ContactList";
import ContactRequestCard from "@/components/contacts/ContactRequestCard";
import SearchInput from "@/components/shared/SearchInput";
import UserSearchResults from "@/components/user/UserSearchResults";
import { useContacts } from "@/hooks/useContacts";

function ContactsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "requests" ? "requests" : "contacts";
  const search = searchParams.get("q") ?? "";
  const addingContact = searchParams.get("mode") === "add";
  const { requests, isLoadingRequests, acceptRequest, declineRequest } = useContacts();
  const filteredRequests = requests.filter((req) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      req.from.username.toLowerCase().includes(q) ||
      req.from.anonimiId.toLowerCase().includes(q)
    );
  });

  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = value.trim();
    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toggleAddingContact = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (addingContact) {
      params.delete("mode");
    } else {
      params.set("mode", "add");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

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
              onClick={toggleAddingContact}
              title={addingContact ? "Cancel" : "Add contact"}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all cursor-pointer ${
                addingContact
                  ? "border border-border/70 bg-muted text-foreground"
                  : "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
              }`}
            >
              {addingContact ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              <span>{addingContact ? "Close" : "Add Contact"}</span>
            </button>
          </div>

          {addingContact && (
            <div className="animate-fade-in">
              <UserSearchResults query={search} onQueryChange={setQuery} />
            </div>
          )}

          {!addingContact && (
            <>
              <div className="flex gap-1 rounded-xl border border-border/60 bg-background p-1">
                <button
                  onClick={() => setTab("contacts")}
                  className={`cursor-pointer flex-1 h-8 rounded-lg text-sm font-medium transition-colors ${
                    tab === "contacts"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Contacts
                </button>
                <button
                  onClick={() => setTab("requests")}
                  className={`cursor-pointer flex-1 h-8 rounded-lg text-sm font-medium transition-colors relative ${
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

              <SearchInput
                placeholder={tab === "contacts" ? "Search contacts..." : "Search requests..."}
                value={search}
                onChange={setQuery}
              />
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
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="font-medium text-sm mb-1">No matching requests</p>
                  <p className="text-xs text-muted-foreground">Try another username or anonimi.</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
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

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
      <ContactsContent />
    </Suspense>
  );
}
