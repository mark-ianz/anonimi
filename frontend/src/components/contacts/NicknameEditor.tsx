"use client";

import { useState } from "react";
import { Check, X, Edit2 } from "lucide-react";

interface NicknameEditorProps {
  contactId: string;
  currentNickname: string | null;
  username: string;
  onSave: (contactId: string, nickname: string) => void;
}

export default function NicknameEditor({
  contactId,
  currentNickname,
  username,
  onSave,
}: NicknameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNickname ?? "");

  function handleSave() {
    onSave(contactId, value.trim());
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Edit2 className="w-3 h-3" />
        {currentNickname ? `"${currentNickname}"` : "Set nickname"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        maxLength={50}
        placeholder={`Nickname for ${username}`}
        className="h-7 px-2 rounded-lg text-xs bg-muted/60 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30 flex-1 min-w-0"
      />
      <button onClick={handleSave} className="w-6 h-6 rounded flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-colors">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
