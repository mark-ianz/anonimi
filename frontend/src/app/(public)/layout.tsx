import type { Metadata } from "next";
import MarketingNavbar from "@/components/marketing/MarketingNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "EchoID — Private Messaging, Reimagined",
  description: "Secure, real-time messaging with privacy-first identity. Sign up free.",
  openGraph: {
    title: "EchoID — Private Messaging, Reimagined",
    description: "Secure, real-time messaging with privacy-first identity. Sign up free.",
    type: "website",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
