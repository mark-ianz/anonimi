import type { Metadata } from "next";
import { baseMetadata } from "@/lib/metadata";
import MarketingNavbar from "@/components/marketing/MarketingNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import BackToTop from "@/components/marketing/BackToTop";

export const metadata: Metadata = {
  ...baseMetadata,
  title: "anonimi — Private Messaging, Reimagined",
  openGraph: {
    ...baseMetadata.openGraph,
    title: "anonimi — Private Messaging, Reimagined",
  },
  twitter: {
    ...baseMetadata.twitter,
    title: "anonimi — Private Messaging, Reimagined",
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
      <BackToTop />
      <MarketingFooter />
    </div>
  );
}
