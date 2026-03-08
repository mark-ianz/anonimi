"use client";

import { useState } from "react";
import { useGroup } from "@/hooks/useGroups";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { Group } from "@/types/group";
import { cn } from "@/lib/utils";
import { Camera, Save } from "lucide-react";

interface GroupSettingsProps {
  group: Group;
}

export default function GroupSettings({ group }: GroupSettingsProps) {
  const { updateGroup } = useGroup(group.id);
  const { upload, isUploading } = useMediaUpload();

  const [name, setName] = useState(group.name);
  const [joinRequestEnabled, setJoinRequestEnabled] = useState(
    group.settings.joinRequestEnabled
  );

  function handleSave() {
    updateGroup({ name: name.trim(), settings: { joinRequestEnabled } });
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

  return (
    <div className="p-6 space-y-6">
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
    </div>
  );
}
