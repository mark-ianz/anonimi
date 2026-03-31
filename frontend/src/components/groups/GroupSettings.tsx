"use client";

import { useState } from "react";
import { useGroup } from "@/hooks/useGroups";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { Group } from "@/types/group";
import { cn } from "@/lib/utils";
import { Camera, Save, Link as LinkIcon, QrCode, Copy, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GroupSettingsProps {
  group: Group;
}

export default function GroupSettings({ group }: GroupSettingsProps) {
  const { updateGroup, inviteLinks, createInviteLink, revokeInviteLink, joinRequests, decideJoinRequest } = useGroup(group.id);
  const { upload, isUploading } = useMediaUpload();

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [joinRequestEnabled, setJoinRequestEnabled] = useState(
    group.settings.joinRequestEnabled
  );

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<30 | 60 | 360 | 1440 | 10080>(60);
  const [maxUses, setMaxUses] = useState<string>("");
  const [inviteDescription, setInviteDescription] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  function handleSave() {
    updateGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      settings: { joinRequestEnabled }
    });
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file, "group");
    if (result) {
      updateGroup({ image: result.url });
    }
    e.target.value = "";
  }

  function handleCreateInvite() {
    createInviteLink({
      expiryMinutes: selectedExpiry,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      description: inviteDescription || undefined
    });
    setShowInviteModal(false);
    setInviteDescription("");
    setMaxUses("");
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    toast.success("Link copied!");
    setTimeout(() => setCopiedLink(null), 2000);
  }

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg">Group Settings</h2>

      {/* Avatar */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer group">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
            {group.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              group.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Add a description for this group..."
          className="w-full px-3 py-2 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
      </div>

      {/* Join request toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
        <div>
          <p className="text-sm font-medium">Require join requests</p>
          <p className="text-xs text-muted-foreground">New members need approval to join</p>
        </div>
        <button
          onClick={() => setJoinRequestEnabled((v) => !v)}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors",
            joinRequestEnabled ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
              joinRequestEnabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
      >
        <Save className="w-4 h-4" />
        Save changes
      </button>

      {/* Invite Links Section */}
      <div className="border-t border-border/30 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Invite Links</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Create Link
          </button>
        </div>

        {inviteLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No invite links yet</p>
        ) : (
          <div className="space-y-2">
            {inviteLinks.map((link) => (
              <div key={link.inviteLinkId} className="p-3 rounded-xl bg-muted/40 border border-border/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.joinUrl}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                      {link.maxUses && <span>• {link.usedCount}/{link.maxUses} uses</span>}
                    </div>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyLink(link.joinUrl)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title="Copy link"
                    >
                      {copiedLink === link.joinUrl ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {link.qrCode && (
                      <button
                        onClick={() => window.open(link.qrCode, "_blank")}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="View QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {!link.revokedAt && (
                      <button
                        onClick={() => revokeInviteLink(link.inviteLinkId)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="Revoke link"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {link.revokedAt && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Revoked
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Requests Section */}
      {joinRequests.length > 0 && (
        <div className="border-t border-border/30 pt-6 space-y-4">
          <h3 className="font-display font-semibold">Join Requests</h3>
          <div className="space-y-2">
            {joinRequests.map((req) => (
              <div key={req.requestId} className="p-3 rounded-xl bg-muted/40 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {req.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{req.user.username}</p>
                    <p className="text-xs text-muted-foreground">@{req.user.echoId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideJoinRequest({ requestId: req.requestId, action: "approve" })}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decideJoinRequest({ requestId: req.requestId, action: "reject" })}
                      className="px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <div className="relative glass rounded-2xl w-full max-w-sm shadow-elevated p-4 space-y-4">
            <h3 className="font-display font-semibold">Create Invite Link</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Expires in</label>
                <select
                  value={selectedExpiry}
                  onChange={(e) => setSelectedExpiry(Number(e.target.value) as 30 | 60 | 360 | 1440 | 10080)}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={1440}>24 hours</option>
                  <option value={10080}>7 days</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Max uses (optional)</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={inviteDescription}
                  onChange={(e) => setInviteDescription(e.target.value)}
                  placeholder="What's this link for?"
                  maxLength={200}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 h-10 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvite}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
