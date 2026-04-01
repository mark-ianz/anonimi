import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SocketProvider } from "@/providers/SocketProvider";

export const metadata: Metadata = {
  title: "anonimi Admin",
};

function AdminLayoutWithSocket({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </SocketProvider>
  );
}

export default AdminLayoutWithSocket;
