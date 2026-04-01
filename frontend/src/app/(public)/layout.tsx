import type { Metadata } from "next";
import MarketingNavbar from "@/components/marketing/MarketingNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "anonimi — Private Messaging, Reimagined",
  description: "Secure, real-time messaging with AID-first identity. Sign up free.",
  openGraph: {
    title: "anonimi — Private Messaging, Reimagined",
    description: "Secure, real-time messaging with AID-first identity. Sign up free.",
    type: "website",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col grain-overlay">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_10%,rgba(61,129,149,0.11),transparent_36%),radial-gradient(circle_at_14%_24%,rgba(20,47,68,0.1),transparent_34%)]" />
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
