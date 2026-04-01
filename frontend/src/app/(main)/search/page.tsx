"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  UserPlus,
  MessagesSquare,
  Compass,
  ArrowRight,
  UserRound,
} from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import api from "@/lib/api";
import type { Contact, ContactRequest } from "@/types/contact";
import type { Conversation } from "@/types/conversation";
import type { SearchUser } from "@/types/user";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function rankScore(value: string, q: string) {
  const haystack = normalize(value);
  if (!haystack || !q) return 0;
  if (haystack.startsWith(q)) return 3;
  if (haystack.includes(q)) return 1;
  return 0;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const query = normalize(q);

  const contactsQuery = useQuery({
    queryKey: ["global-search", "contacts", query],
    queryFn: async () => {
      const res = await api.get("/contacts", {
        params: { status: "accepted", limit: 80 },
      });
      return (res.data?.data ?? []) as Contact[];
    },
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });

  const requestsQuery = useQuery({
    queryKey: ["global-search", "requests", query],
    queryFn: async () => {
      const res = await api.get("/contacts/requests", { params: { limit: 80 } });
      return (res.data?.data ?? []) as ContactRequest[];
    },
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });

  const peopleQuery = useQuery({
    queryKey: ["global-search", "people", query],
    queryFn: async () => {
      const res = await api.get("/users/search", {
        params: { q: query, limit: 20 },
      });
      return (res.data?.data ?? []) as SearchUser[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });

  const conversationsQuery = useQuery({
    queryKey: ["global-search", "messages", query],
    queryFn: async () => {
      const res = await api.get("/conversations", { params: { limit: 80 } });
      return (res.data?.data ?? []) as Conversation[];
    },
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });

  const contacts = useMemo(() => {
    const list = (contactsQuery.data ?? [])
      .map((contact) => {
        const primary = contact.nickname ?? contact.username;
        const score =
          rankScore(primary, query) +
          rankScore(contact.username, query) +
          rankScore(contact.anonimiId, query);
        return { contact, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => item.contact);

    return list;
  }, [contactsQuery.data, query]);

  const requests = useMemo(() => {
    const list = (requestsQuery.data ?? [])
      .map((request) => {
        const score =
          rankScore(request.from.username, query) + rankScore(request.from.anonimiId, query);
        return { request, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => item.request);

    return list;
  }, [requestsQuery.data, query]);

  const contactAnonimiIds = useMemo(() => {
    return new Set((contactsQuery.data ?? []).map((contact) => contact.anonimiId));
  }, [contactsQuery.data]);

  const people = useMemo(() => {
    return (peopleQuery.data ?? [])
      .filter((person) => !contactAnonimiIds.has(person.anonimiId))
      .slice(0, 12);
  }, [peopleQuery.data, contactAnonimiIds]);

  const messages = useMemo(() => {
    const list = (conversationsQuery.data ?? [])
      .map((conversation) => {
        const title =
          conversation.type === "group"
            ? conversation.group?.name ?? "Group"
            : conversation.participant?.nickname ??
              conversation.participant?.username ??
              conversation.participant?.anonimiId ??
              "Conversation";
        const preview = conversation.lastMessage?.content ?? "";
        const score = rankScore(title, query) + rankScore(preview, query);
        return { conversation, title, preview, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return list;
  }, [conversationsQuery.data, query]);

  const groups = useMemo(() => {
    const list = (conversationsQuery.data ?? [])
      .filter((conversation) => conversation.type === "group")
      .map((conversation) => {
        const name = conversation.group?.name ?? "Group";
        const score = rankScore(name, query);
        return { conversation, name, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return list;
  }, [conversationsQuery.data, query]);

  const suggestions = useMemo(
    () => [
      { label: "Open My Contacts", href: "/contacts", icon: Users },
      { label: "Open Requests", href: "/contacts?tab=requests", icon: UserPlus },
      { label: "Open Messages", href: "/chat", icon: MessagesSquare },
      { label: "Open Support", href: "/support", icon: Compass },
    ],
    []
  );

  const loading =
    contactsQuery.isFetching ||
    requestsQuery.isFetching ||
    conversationsQuery.isFetching ||
    peopleQuery.isFetching;

  const hasResults =
    contacts.length > 0 ||
    requests.length > 0 ||
    people.length > 0 ||
    groups.length > 0 ||
    messages.length > 0;

  const orderedSections = useMemo(() => {
    const baseOrder = ["contacts", "people", "groups", "messages", "requests"] as const;
    const counts = {
      contacts: contacts.length,
      people: people.length,
      groups: groups.length,
      messages: messages.length,
      requests: requests.length,
    };

    const withResults = baseOrder
      .filter((key) => counts[key] > 0)
      .sort((a, b) => {
        const diff = counts[b] - counts[a];
        if (diff !== 0) return diff;
        return baseOrder.indexOf(a) - baseOrder.indexOf(b);
      });

    const withoutResults = baseOrder.filter((key) => counts[key] === 0);

    if (
      withResults[0] === "messages" &&
      withResults.some((key) => key !== "messages")
    ) {
      const firstNonMessages = withResults.find((key) => key !== "messages");
      if (firstNonMessages) {
        withResults.splice(withResults.indexOf(firstNonMessages), 1);
        withResults.unshift(firstNonMessages);
        withResults.splice(1, 0, "messages");
        const unique = Array.from(new Set(withResults));
        return [...unique, ...withoutResults];
      }
    }

    return [...withResults, ...withoutResults];
  }, [contacts.length, people.length, groups.length, messages.length, requests.length]);

  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-soft sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-background">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Global Search
                </p>
                <h1 className="mt-1 text-2xl leading-tight font-semibold">Results for &quot;{q || ""}&quot;</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Grouped by Contacts, Requests, Other People, and Messages.
                </p>
              </div>
            </div>
          </div>

          {q.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">
                Enter a search term in the sidebar and press Enter to search across your workspace.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {orderedSections.map((section) => {
                if (section === "contacts") {
                  return (
                    <section key={section} className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <h2 className="mb-2 text-sm font-semibold">My Contacts</h2>
                      {contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matching contacts.</p>
                      ) : (
                        <div className="space-y-2">
                          {contacts.map((contact) => (
                            <Link
                              key={contact.contactId}
                              href="/contacts"
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              <span className="truncate text-foreground">{contact.nickname ?? contact.username}</span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{contact.anonimiId}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }

                if (section === "people") {
                  return (
                    <section key={section} className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <h2 className="mb-2 text-sm font-semibold">Other People</h2>
                      {people.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matching people.</p>
                      ) : (
                        <div className="space-y-2">
                          {people.map((person) => (
                            <Link
                              key={person.id}
                              href={`/user/${person.anonimiId}`}
                              className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate text-foreground">{person.username}</span>
                              </span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{person.anonimiId}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }

                if (section === "groups") {
                  return (
                    <section key={section} className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <h2 className="mb-2 text-sm font-semibold">Groups</h2>
                      {groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matching groups.</p>
                      ) : (
                        <div className="space-y-2">
                          {groups.map((item) => (
                            <Link
                              key={item.conversation.id}
                              href={`/chat/${item.conversation.id}`}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              <span className="truncate text-foreground">{item.name}</span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                Group
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }

                if (section === "messages") {
                  return (
                    <section key={section} className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                      <h2 className="mb-2 text-sm font-semibold">Messages</h2>
                      {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matching conversations.</p>
                      ) : (
                        <div className="space-y-2">
                          {messages.map((item) => (
                            <Link
                              key={item.conversation.id}
                              href={`/chat/${item.conversation.id}`}
                              className="block rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              <p className="truncate text-foreground">{item.title}</p>
                              {item.preview ? (
                                <p className="truncate text-xs text-muted-foreground">{item.preview}</p>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }

                return (
                  <section key={section} className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                    <h2 className="mb-2 text-sm font-semibold">Requests</h2>
                    {requests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No matching requests.</p>
                    ) : (
                      <div className="space-y-2">
                        {requests.map((request) => (
                          <Link
                            key={request.requestId}
                            href="/contacts?tab=requests"
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            <span className="truncate text-foreground">{request.from.username}</span>
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">{request.from.anonimiId}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {loading && (
                <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}

              {!loading && !hasResults && (
                <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">No results found.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try another keyword or search by anonimi.
                  </p>
                </div>
              )}

              <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Suggested Shortcuts</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
