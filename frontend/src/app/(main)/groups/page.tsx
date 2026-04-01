"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function GroupsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat?tab=groups");
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Redirecting to chats...
      </div>
    </ProtectedRoute>
  );
}
