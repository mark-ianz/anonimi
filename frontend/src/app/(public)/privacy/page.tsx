import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — anonimi",
  description: "How anonimi handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold">Privacy Policy</h1>
        
        <div className="mt-8 prose prose-lg dark:prose-invert">
          <p className="text-lg text-muted-foreground">
            Last updated: April 3, 2026
          </p>

          <h2 className="text-2xl font-semibold mt-12">1. Introduction</h2>
          <p className="mt-4">
            At anonimi, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our messaging platform.
          </p>

          <h2 className="text-2xl font-semibold mt-12">2. Information We Collect</h2>
          <p className="mt-4">
            We collect information you provide directly to us, such as:
          </p>
          <ul className="mt-4 space-y-2">
            <li>Account information (email, username)</li>
            <li>Profile information (display name, avatar)</li>
            <li>Messages and content you send</li>
            <li>Contact information you choose to share</li>
            <li>Temporary session metadata (temporary username, expiration time)</li>
          </ul>

          <p className="mt-4">
            We also collect limited usage and device information such as IP address, device identifiers, browser type,
            and timestamps to keep the service reliable and secure.
          </p>

          <h2 className="text-2xl font-semibold mt-12">3. How We Use Your Information</h2>
          <p className="mt-4">
            We use the information we collect to:
          </p>
          <ul className="mt-4 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Communicate with you about products, services, and events</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-12">4. How We Share Information</h2>
          <p className="mt-4">
            We share information only as needed to operate the service, comply with law, and protect users:
          </p>
          <ul className="mt-4 space-y-2">
            <li>Service providers that help us operate infrastructure and deliver support</li>
            <li>Legal and safety requests where disclosure is required or appropriate</li>
            <li>Corporate transactions if the business is reorganized or transferred</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-12">5. Data Retention</h2>
          <p className="mt-4">
            We retain information for as long as needed to provide the service and meet legal obligations. Temporary accounts
            and their related session data are removed after expiration unless claimed.
          </p>

          <h2 className="text-2xl font-semibold mt-12">6. Data Security</h2>
          <p className="mt-4">
            We implement appropriate technical and organizational security measures to protect 
            your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-semibold mt-12">7. Stealth Messages</h2>
          <p className="mt-4">
            Stealth Mode messages are designed to expire on a timer. Once expired, the content is no longer
            available and only an expired placeholder remains in the conversation.
          </p>

          <h2 className="text-2xl font-semibold mt-12">8. Temporary Accounts</h2>
          <p className="mt-4">
            Temporary accounts expire after 24 hours unless claimed. Expired temporary accounts and related
            session data are removed as part of automated cleanup.
          </p>

          <h2 className="text-2xl font-semibold mt-12">9. Your Rights</h2>
          <p className="mt-4">
            You have the right to access, update, or delete your personal information at any time. 
            You can also opt out of certain communications from us.
          </p>

          <h2 className="text-2xl font-semibold mt-12">10. International Transfers</h2>
          <p className="mt-4">
            If you access the service from outside our primary operating region, your information may be processed in
            locations where we or our service providers operate.
          </p>

          <h2 className="text-2xl font-semibold mt-12">11. Children&apos;s Privacy</h2>
          <p className="mt-4">
            anonimi is not directed to children under the age required by local law to consent to data processing. If you
            believe a minor has provided personal information, contact us.
          </p>

          <h2 className="text-2xl font-semibold mt-12">12. Changes to This Policy</h2>
          <p className="mt-4">
            We may update this Privacy Policy from time to time. The "Last updated" date reflects the latest revision.
          </p>

          <h2 className="text-2xl font-semibold mt-12">13. Contact Us</h2>
          <p className="mt-4">
            If you have any questions about this Privacy Policy, please contact us at support@anonimi.app.
          </p>
        </div>
      </div>
    </div>
  );
}
