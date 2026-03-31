"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Image as ImageIcon } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGroups } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { cn } from "@/lib/utils";

export default function CreateGroupPage() {
  const router = useRouter();
  const { createGroup, isCreating } = useGroups();
  const { contacts } = useContacts();
  const { upload, isUploading } = useMediaUpload();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [joinRequestEnabled, setJoinRequestEnabled] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const filtered = contacts.filter((c) => {
    const n = c.nickname ?? c.username;
    return (
      n.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.echoId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  function toggleContact(echoId: string) {
    setSelectedIds((prev) =>
      prev.includes(echoId)
        ? prev.filter((id) => id !== echoId)
        : [...prev, echoId]
    );
  }

  function handleCreate() {
    if (selectedIds.length === 0) return;
    
    createGroup(
      {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        image: image ?? undefined,
        settings: { joinRequestEnabled },
        memberEchoIds: selectedIds,
      },
      {
        onSuccess: () => {
          router.push("/groups");
        },
      }
    );
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file, "group");
    if (result) {
      setImage(result.url);
    }
    e.target.value = "";
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-semibold">Create Group</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Group Avatar */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-medium">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Group" className="w-full h-full object-cover" />
                ) : name ? (
                  name.slice(0, 2).toUpperCase()
                ) : (
                  "G"
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate the group name
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this group..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Join Request Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
            <div>
              <p className="text-sm font-medium">Require join requests</p>
              <p className="text-xs text-muted-foreground">
                New members need approval to join
              </p>
            </div>
            <button
              onClick={() => setJoinRequestEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                joinRequestEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                  joinRequestEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Selected Members */}
          {selectedIds.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected ({selectedIds.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedIds.map((echoId) => {
                  const c = contacts.find((c) => c.echoId === echoId);
                  return (
                    <span
                      key={echoId}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {c?.nickname ?? c?.username ?? echoId}
                      <button
                        onClick={() => toggleContact(echoId)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add members</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filtered.map((contact) => {
                const isSelected = selectedIds.includes(contact.echoId);
                return (
                  <button
                    key={contact.contactId}
                    onClick={() => toggleContact(contact.echoId)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {contact.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={contact.profileImage}
                          alt={contact.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        contact.username[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.nickname ?? contact.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{contact.echoId}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!filtered.length && searchQuery && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <button
            onClick={handleCreate}
            disabled={selectedIds.length === 0 || isCreating}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : null}
            Create Group ({selectedIds.length} members)
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
