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
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <BackToTop />
      <MarketingFooter />
    </div>
  );
}
