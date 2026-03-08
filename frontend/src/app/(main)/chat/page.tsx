"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
  isGroup?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    lastMessage: "Hey! Are you free tonight?",
    timestamp: "2m",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    name: "Project Team",
    lastMessage: "Meeting at 3pm confirmed",
    timestamp: "1h",
    unreadCount: 0,
    isGroup: true,
  },
  {
    id: "3",
    name: "Mike Chen",
    lastMessage: "Thanks for the help!",
    timestamp: "3h",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "4",
    name: "Emily Davis",
    lastMessage: "Let's catch up soon",
    timestamp: "Yesterday",
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: "5",
    name: "Design Review",
    lastMessage: "New mockups are ready",
    timestamp: "Yesterday",
    unreadCount: 0,
    isGroup: true,
  },
  {
    id: "6",
    name: "Alex Thompson",
    lastMessage: "See you tomorrow!",
    timestamp: "2 days",
    unreadCount: 0,
    isOnline: false,
  },
];

export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border/50 flex flex-col">
        {/* List Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-display font-semibold">Messages</h1>
            <button className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="stroke-current">
                <path d="M8 3v10M3 8h10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv, index) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group cursor-pointer animate-fade-in",
                "border-b border-border/20"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {conv.isGroup ? (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                    {conv.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {conv.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                {!conv.isGroup && conv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn(
                    "font-medium truncate",
                    conv.unreadCount > 0 && "font-semibold"
                  )}>
                    {conv.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {conv.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate",
                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty State - when no chat selected */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
        <div className="text-center max-w-sm px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-semibold mb-2">Select a conversation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose from your existing conversations or start a new one to begin messaging
          </p>
        </div>
      </div>
    </div>
  );
}
