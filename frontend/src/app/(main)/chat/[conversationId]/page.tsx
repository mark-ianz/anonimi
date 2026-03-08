"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Search, 
  Paperclip,
  Send,
  Smile,
  Check,
  CheckCheck,
  Image
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image";
  mediaUrl?: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hey! How are you doing?",
    timestamp: "10:30 AM",
    senderId: "other",
    status: "read",
    type: "text"
  },
  {
    id: "2",
    content: "I'm doing great! Just finished working on the new project. How about you?",
    timestamp: "10:32 AM",
    senderId: "me",
    status: "read",
    type: "text"
  },
  {
    id: "3",
    content: "That's awesome! I've been busy with meetings all day",
    timestamp: "10:33 AM",
    senderId: "other",
    status: "read",
    type: "text"
  },
  {
    id: "4",
    content: "We should catch up soon! Maybe grab coffee this weekend?",
    timestamp: "10:35 AM",
    senderId: "other",
    status: "read",
    type: "text"
  },
  {
    id: "5",
    content: "That sounds perfect! Saturday works for me",
    timestamp: "10:36 AM",
    senderId: "me",
    status: "delivered",
    type: "text"
  },
  {
    id: "6",
    content: "Great! Let's say around 3pm?",
    timestamp: "10:38 AM",
    senderId: "other",
    status: "read",
    type: "text"
  },
  {
    id: "7",
    content: "3pm works perfectly! See you then 😊",
    timestamp: "10:40 AM",
    senderId: "me",
    status: "sent",
    type: "text"
  },
];

const contact = {
  name: "Sarah Johnson",
  isOnline: true,
  lastSeen: "2m ago",
  avatar: undefined,
};

export default function ChatViewPage() {
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: "me",
      status: "sent",
      type: "text"
    };

    setMessages([...messages, message]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation List - Hidden on mobile when chatting */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-border/50 flex-col">
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/20",
                i === 1 && "bg-muted/70"
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  S{i}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium truncate">Contact {i}</span>
                  <span className="text-xs text-muted-foreground">2m</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">Last message preview...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                SJ
              </div>
              {contact.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{contact.name}</h2>
              <p className="text-xs text-muted-foreground">
                {contact.isOnline ? "Online" : `Last seen ${contact.lastSeen}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Phone className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Video className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Date divider */}
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full">
              Today
            </span>
          </div>

          {messages.map((message, index) => {
            const isMe = message.senderId === "me";
            const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== message.senderId);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2 animate-message-appear",
                  isMe && "flex-row-reverse"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {!isMe && (
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0",
                    !showAvatar && "opacity-0"
                  )}>
                    SJ
                  </div>
                )}
                
                <div className={cn("max-w-[70%] group", isMe && "items-end")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl",
                    isMe 
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md" 
                      : "bg-muted rounded-bl-md"
                  )}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 mt-1 px-1",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[10px] text-muted-foreground">
                      {message.timestamp}
                    </span>
                    {isMe && (
                      <span className="text-[10px]">
                        {message.status === "read" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        ) : message.status === "delivered" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                SJ
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-xl hover:bg-muted transition-colors shrink-0">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[48px] max-h-32"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Smile className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {newMessage.trim() ? (
              <button 
                onClick={handleSend}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button className="p-2.5 rounded-xl hover:bg-muted transition-colors shrink-0">
                <Image className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
