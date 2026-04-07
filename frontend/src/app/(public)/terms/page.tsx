import type { Metadata } from "next";
import LegalPageLayout from "@/components/marketing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the anonimi platform.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    id: "acceptance-of-terms",
    number: "01",
    title: "Acceptance of Terms",
    body: (
      <p>
        By accessing or using anonimi, you agree to these Terms of Service and our Privacy Policy.
        If you do not agree, do not use the service.
      </p>
    ),
  },
  {
    id: "eligibility",
    number: "02",
    title: "Eligibility",
    body: (
      <p>
        You must be legally able to enter a binding agreement in your jurisdiction to use anonimi.
        If you are using the service on behalf of an organization, you represent you have authority
        to bind that organization.
      </p>
    ),
  },
  {
    id: "description-of-service",
    number: "03",
    title: "Description of Service",
    body: (
      <p>
        anonimi is a real-time messaging platform providing private conversations, group chats,
        contacts, and moderation tooling. Features and availability may change over time.
      </p>
    ),
  },
  {
    id: "accounts-and-security",
    number: "04",
    title: "Accounts and Security",
    body: (
      <p>
        You are responsible for safeguarding your credentials and for activity on your account. You
        agree to provide accurate information and to promptly update it when it changes.
      </p>
    ),
  },
  {
    id: "temporary-accounts",
    number: "05",
    title: "Temporary Accounts",
    body: (
      <p>
        Temporary accounts provide limited-time access of up to 24 hours without email or password.
        To keep a temporary account and its conversation history, you must claim it by adding an
        email address and password and completing verification.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    number: "06",
    title: "Acceptable Use",
    body: (
      <>
        <p>You agree not to use the service to:</p>
        <ul className="space-y-2 pl-5 marker:text-primary">
          <li>Upload or transmit content that is illegal, harmful, or offensive</li>
          <li>Harass, threaten, or impersonate any person or entity</li>
          <li>Spam or engage in unauthorized advertising or automation</li>
          <li>Attempt to gain unauthorized access to the service or systems</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>
      </>
    ),
  },
  {
    id: "content-and-license",
    number: "07",
    title: "Content and License",
    body: (
      <p>
        You retain ownership of content you submit. You grant anonimi a worldwide, non-exclusive,
        royalty-free license to host, store, reproduce, and display your content solely to operate,
        improve, and provide the service.
      </p>
    ),
  },
  {
    id: "encrypted-messages",
    number: "08",
    title: "Encrypted Messages",
    body: (
      <p>
        anonimi is designed so encrypted message contents are not readable through admin tooling.
        Moderators, support staff, and super admins may enforce these Terms using reports, metadata,
        account actions, and audit logs, but they are not provided ordinary access to encrypted
        message bodies.
      </p>
    ),
  },
  {
    id: "stealth-mode",
    number: "09",
    title: "Stealth Mode",
    body: (
      <p>
        Stealth Mode messages are designed to expire after a selected time window. Once expired, the
        content is no longer available and is replaced by an expired placeholder in the conversation.
      </p>
    ),
  },
  {
    id: "moderation-and-enforcement",
    number: "10",
    title: "Moderation and Enforcement",
    body: (
      <p>
        We may review, limit, or remove content and access to enforce these Terms, respond to
        reports, or comply with law. We may suspend or terminate accounts that violate these Terms.
      </p>
    ),
  },
  {
    id: "third-party-services",
    number: "11",
    title: "Third-Party Services",
    body: (
      <p>
        The service may link to or integrate with third-party services. We are not responsible for
        third-party content, policies, or practices.
      </p>
    ),
  },
  {
    id: "termination",
    number: "12",
    title: "Termination",
    body: (
      <p>
        We may suspend or terminate your access at any time for conduct that violates these Terms,
        harms other users, or threatens the service. You may stop using the service at any time.
      </p>
    ),
  },
  {
    id: "disclaimers",
    number: "13",
    title: "Disclaimers",
    body: (
      <p>
        The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do
        not warrant that the service will be uninterrupted, secure, or error-free.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    number: "14",
    title: "Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, anonimi shall not be liable for indirect,
        incidental, special, consequential, or punitive damages arising from your use of the
        service.
      </p>
    ),
  },
  {
    id: "indemnification",
    number: "15",
    title: "Indemnification",
    body: (
      <p>
        You agree to defend and indemnify anonimi from claims arising out of your use of the service
        or violation of these Terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    number: "16",
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the jurisdiction where anonimi is established,
        without regard to conflict of law principles.
      </p>
    ),
  },
  {
    id: "changes-to-these-terms",
    number: "17",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. The &quot;Last updated&quot; date reflects the
        latest revision.
      </p>
    ),
  },
  {
    id: "contact-information",
    number: "18",
    title: "Contact Information",
    body: <p>If you have any questions about these Terms, please contact us at anonimi.main@gmail.com.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      badge="Terms of Service"
      title="The rules for using anonimi."
      description="A more readable version of the legal agreement behind the platform, including account responsibilities, moderation boundaries, and how encrypted messaging fits into the service."
      updatedAt="April 7, 2026"
      accentClassName="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"
      dotClassName="bg-amber-500"
      panelClassName="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-background"
      highlight={{
        eyebrow: "What matters most",
        title: "These terms define how the platform stays usable, safe, and privacy-respecting.",
        description:
          "The Terms cover account use, acceptable behavior, moderation powers, and the limits of our access. They are written to support safety controls without turning moderation into a backdoor for encrypted message content.",
      }}
      quickFacts={[
        "You keep ownership of the content you submit.",
        "We can enforce platform rules through reports, account actions, and audit logs.",
        "Encrypted message bodies are not part of ordinary admin access.",
      ]}
      relatedLink={{ href: "/privacy", label: "Read the Privacy Policy" }}
      sections={sections}
    />
  );
}
