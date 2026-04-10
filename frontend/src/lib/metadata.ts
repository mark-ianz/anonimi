import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anonimi.cloud";
export const SITE_NAME = "anonimi";
export const SITE_DESCRIPTION =
  "Secure, real-time messaging with AID-first identity. Private conversations without exposing personal data.";

export const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
  url: SITE_URL,
  title: {
    default: `${SITE_NAME} — Private Messaging, Reimagined`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  images: [
    {
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
      alt: SITE_NAME,
    },
  ],
};

export const defaultTwitter: Metadata["twitter"] = {
  card: "summary_large_image",
  title: {
    default: `${SITE_NAME} — Private Messaging, Reimagined`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  images: [`${SITE_URL}/og-image.png`],
};

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Private Messaging, Reimagined`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "anonymous messaging",
    "private chat",
    "secure messaging",
    "anonymous identity",
    "AID",
    "encrypted chat",
    "privacy-first messaging",
    "temporary accounts",
    "stealth mode",
    "anonymous communication",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/icon/favicon.ico",
    apple: "/images/icon/favicon.ico",
  },
  openGraph: defaultOpenGraph,
  twitter: defaultTwitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};
