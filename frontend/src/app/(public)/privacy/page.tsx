import type { Metadata } from "next";
import LegalPageLayout from "@/components/marketing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How anonimi handles your data.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    id: "introduction",
    number: "01",
    title: "Introduction",
    body: (
      <p>
        At anonimi, we take your privacy seriously. This Privacy Policy explains how we collect,
        use, disclose, and safeguard your information when you use our messaging platform.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    number: "02",
    title: "Information We Collect",
    body: (
      <>
        <p>We collect information you provide directly to us, such as:</p>
        <ul className="space-y-2 pl-5 marker:text-primary">
          <li>Account information like email and username</li>
          <li>Profile information such as display name and avatar</li>
          <li>Encrypted message envelopes and delivery metadata needed to route messages</li>
          <li>Contact information you choose to share</li>
          <li>Temporary session metadata such as temporary username and expiration time</li>
        </ul>
        <p>
          For end-to-end encrypted conversations, message content is intended to be readable only
          on participant devices. Our administrators, moderators, and support staff are not given a
          tool to read encrypted message bodies.
        </p>
        <p>
          We also collect limited usage and device information such as IP address, device
          identifiers, browser type, and timestamps to keep the service reliable and secure.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    number: "03",
    title: "How We Use Your Information",
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="space-y-2 pl-5 marker:text-primary">
          <li>Provide, maintain, and improve our services</li>
          <li>Send you technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Communicate with you about service-related updates and events</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-share-information",
    number: "04",
    title: "How We Share Information",
    body: (
      <>
        <p>
          We share information only as needed to operate the service, comply with law, and protect
          users:
        </p>
        <ul className="space-y-2 pl-5 marker:text-primary">
          <li>Service providers that help us operate infrastructure and deliver support</li>
          <li>Legal and safety requests where disclosure is required or appropriate</li>
          <li>Corporate transactions if the business is reorganized or transferred</li>
        </ul>
      </>
    ),
  },
  {
    id: "encrypted-messages",
    number: "05",
    title: "Encrypted Messages",
    body: (
      <p>
        End-to-end encrypted message content is not available through the admin panel. Moderators
        and super admins can review reports, account status, and operational logs, but they cannot
        open encrypted message contents through ordinary platform tooling.
      </p>
    ),
  },
  {
    id: "data-retention",
    number: "06",
    title: "Data Retention",
    body: (
      <p>
        We retain information for as long as needed to provide the service and meet legal
        obligations. Temporary accounts and their related session data are removed after expiration
        unless claimed.
      </p>
    ),
  },
  {
    id: "data-security",
    number: "07",
    title: "Data Security",
    body: (
      <p>
        We implement appropriate technical and organizational security measures to protect your
        personal information against unauthorized access, alteration, disclosure, or destruction.
      </p>
    ),
  },
  {
    id: "stealth-messages",
    number: "08",
    title: "Stealth Messages",
    body: (
      <p>
        Stealth Mode messages are designed to expire on a timer. Once expired, the content is no
        longer available and only an expired placeholder remains in the conversation.
      </p>
    ),
  },
  {
    id: "temporary-accounts",
    number: "09",
    title: "Temporary Accounts",
    body: (
      <p>
        Temporary accounts expire after 24 hours unless claimed. Expired temporary accounts and
        related session data are removed as part of automated cleanup.
      </p>
    ),
  },
  {
    id: "your-rights",
    number: "10",
    title: "Your Rights",
    body: (
      <p>
        You have the right to access, update, or delete your personal information at any time. You
        can also opt out of certain communications from us.
      </p>
    ),
  },
  {
    id: "international-transfers",
    number: "11",
    title: "International Transfers",
    body: (
      <p>
        If you access the service from outside our primary operating region, your information may
        be processed in locations where we or our service providers operate.
      </p>
    ),
  },
  {
    id: "childrens-privacy",
    number: "12",
    title: "Children&apos;s Privacy",
    body: (
      <p>
        anonimi is not directed to children under the age required by local law to consent to data
        processing. If you believe a minor has provided personal information, contact us.
      </p>
    ),
  },
  {
    id: "changes",
    number: "13",
    title: "Changes to This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date
        reflects the latest revision.
      </p>
    ),
  },
  {
    id: "contact-us",
    number: "14",
    title: "Contact Us",
    body: <p>If you have any questions about this Privacy Policy, please contact us at anonimi.main@gmail.com.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      badge="Privacy Policy"
      title="How anonimi handles your data."
      description="A clearer view of what we collect, what stays private, and how the product is designed so encrypted message content stays out of admin reach."
      updatedAt="April 7, 2026"
      accentClassName="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      dotClassName="bg-emerald-500"
      panelClassName="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background"
      highlight={{
        eyebrow: "Privacy at a glance",
        title: "The service is built to operate without exposing your readable encrypted chats.",
        description:
          "Privacy here is not just a policy statement. It is a product boundary: participant devices hold readable content, while admin tooling focuses on reports, account controls, and service operations.",
      }}
      quickFacts={[
        "Encrypted message bodies are intended to be readable only on participant devices.",
        "Admins and moderators are not given a built-in message browser for encrypted chats.",
        "We keep only the metadata and account information needed to operate the service responsibly.",
      ]}
      relatedLink={{ href: "/terms", label: "Read the Terms of Service" }}
      sections={sections}
    />
  );
}
