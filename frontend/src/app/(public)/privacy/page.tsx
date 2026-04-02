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

          <h2 className="text-2xl font-semibold mt-12">4. Data Security</h2>
          <p className="mt-4">
            We implement appropriate technical and organizational security measures to protect 
            your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-semibold mt-12">5. Stealth Messages</h2>
          <p className="mt-4">
            Stealth Mode messages are designed to expire on a timer. Once expired, the content is no longer
            available and only an expired placeholder remains in the conversation.
          </p>

          <h2 className="text-2xl font-semibold mt-12">6. Temporary Accounts</h2>
          <p className="mt-4">
            Temporary accounts expire after 24 hours unless claimed. Expired temporary accounts and related
            session data are removed as part of automated cleanup.
          </p>

          <h2 className="text-2xl font-semibold mt-12">7. Your Rights</h2>
          <p className="mt-4">
            You have the right to access, update, or delete your personal information at any time. 
            You can also opt out of certain communications from us.
          </p>

          <h2 className="text-2xl font-semibold mt-12">8. Contact Us</h2>
          <p className="mt-4">
            If you have any questions about this Privacy Policy, please contact us at support@anonimi.app.
          </p>
        </div>
      </div>
    </div>
  );
}
