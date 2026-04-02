import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — anonimi",
  description: "Terms governing use of the anonimi platform.",
};

export default function TermsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold">Terms of Service</h1>
        
        <div className="mt-8 prose prose-lg dark:prose-invert">
          <p className="text-lg text-muted-foreground">
            Last updated: April 3, 2026
          </p>

          <h2 className="text-2xl font-semibold mt-12">1. Acceptance of Terms</h2>
          <p className="mt-4">
            By accessing and using anonimi, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>

          <h2 className="text-2xl font-semibold mt-12">2. Description of Service</h2>
          <p className="mt-4">
            anonimi is a real-time messaging platform that provides secure communication services, 
            including one-on-one messaging, group chats, and contact management.
          </p>

          <h2 className="text-2xl font-semibold mt-12">3. Temporary Accounts</h2>
          <p className="mt-4">
            Temporary accounts provide limited-time access (up to 24 hours) without email or password.
            To keep a temporary account and its conversation history, you must claim it by adding
            an email address and password and completing verification.
          </p>

          <h2 className="text-2xl font-semibold mt-12">4. User Conduct</h2>
          <p className="mt-4">
            You agree not to use the service to:
          </p>
          <ul className="mt-4 space-y-2">
            <li>Upload or transmit any content that is illegal, harmful, or offensive</li>
            <li>Harass, threaten, or impersonate any person or entity</li>
            <li>Spam or engage in any form of unauthorized advertising</li>
            <li>Attempt to gain unauthorized access to the service</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-12">5. Account Responsibilities</h2>
          <p className="mt-4">
            You are responsible for maintaining the confidentiality of your account credentials 
            and for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-semibold mt-12">6. Content</h2>
          <p className="mt-4">
            You retain ownership of any content you submit to anonimi. However, by submitting content, 
            you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content.
          </p>

          <h2 className="text-2xl font-semibold mt-12">7. Stealth Mode</h2>
          <p className="mt-4">
            Stealth Mode messages are designed to expire after a selected time window. Once expired, the
            content is no longer available and is replaced by an expired placeholder in the conversation.
          </p>

          <h2 className="text-2xl font-semibold mt-12">8. Termination</h2>
          <p className="mt-4">
            We reserve the right to terminate or suspend your account at any time, without notice, 
            for conduct that we believe violates these Terms or is harmful to other users or the service.
          </p>

          <h2 className="text-2xl font-semibold mt-12">9. Limitation of Liability</h2>
          <p className="mt-4">
            anonimi shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of or inability to use the service.
          </p>

          <h2 className="text-2xl font-semibold mt-12">10. Contact Information</h2>
          <p className="mt-4">
            If you have any questions about these Terms, please contact us at support@anonimi.app.
          </p>
        </div>
      </div>
    </div>
  );
}
