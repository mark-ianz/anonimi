"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import api from "@/lib/api";
import { Mail, Trash2, Check, Eye, Clock, CheckCircle, AlertOctagon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "in_progress" | "resolved" | "spam";
  createdAt: string;
  updatedAt: string;
}

type MessageStatus = "all" | "unread" | "read" | "in_progress" | "resolved" | "spam";

const statusConfig: { value: MessageStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "all", label: "All", icon: Mail, color: "text-muted-foreground" },
  { value: "unread", label: "Unread", icon: AlertOctagon, color: "text-red-500" },
  { value: "read", label: "Read", icon: Eye, color: "text-blue-500" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-yellow-500" },
  { value: "resolved", label: "Resolved", icon: CheckCircle, color: "text-green-500" },
  { value: "spam", label: "Spam", icon: AlertOctagon, color: "text-orange-500" },
];

export default function AdminContactMessagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<MessageStatus>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-messages", status],
    queryFn: async () => {
      const params = status !== "all" ? { status } : {};
      const res = await api.get("/admin/contact-messages", { params });
      return res.data.data as ContactMessage[];
    },
    placeholderData: (prev) => prev,
  });

  const updateStatus = async (messageId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/contact-messages/${messageId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((prev) => prev ? { ...prev, status: newStatus as ContactMessage["status"] } : null);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/admin/contact-messages/${messageId}`);
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const messages = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Contact Messages</h1>
          <p className="text-xs text-muted-foreground">
            Messages submitted from the public contact form.
          </p>
          <div className="flex gap-1 flex-wrap">
            {statusConfig.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                  status === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Message List */}
          <div className="w-1/2 border-r border-border/30 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Mail className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/30 transition-colors",
                      selectedMessage?.id === msg.id && "bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{msg.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground/70 truncate mt-1">{msg.message}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full",
                          msg.status === "unread" && "bg-red-500/20 text-red-500",
                          msg.status === "read" && "bg-blue-500/20 text-blue-500",
                          msg.status === "in_progress" && "bg-yellow-500/20 text-yellow-500",
                          msg.status === "resolved" && "bg-green-500/20 text-green-500",
                          msg.status === "spam" && "bg-orange-500/20 text-orange-500"
                        )}>
                          {msg.status.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {!selectedMessage ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Mail className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a message to view details</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-border/30 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-medium">{selectedMessage.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedMessage.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="text-sm font-medium">{selectedMessage.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Message</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Received</p>
                      <p className="text-xs">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-border/30 shrink-0">
                  <div className="flex gap-2 flex-wrap">
                    {selectedMessage.status !== "read" && (
                      <button
                        onClick={() => updateStatus(selectedMessage.id, "read")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Mark Read
                      </button>
                    )}
                    {selectedMessage.status !== "in_progress" && (
                      <button
                        onClick={() => updateStatus(selectedMessage.id, "in_progress")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        In Progress
                      </button>
                    )}
                    {selectedMessage.status !== "resolved" && (
                      <button
                        onClick={() => updateStatus(selectedMessage.id, "resolved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                    {selectedMessage.status !== "spam" && (
                      <button
                        onClick={() => updateStatus(selectedMessage.id, "spam")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Spam
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}