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
            By accessing or using anonimi, you agree to these Terms of Service and our Privacy Policy. If you do not agree,
            do not use the service.
          </p>

          <h2 className="text-2xl font-semibold mt-12">2. Eligibility</h2>
          <p className="mt-4">
            You must be legally able to enter a binding agreement in your jurisdiction to use anonimi. If you are using the
            service on behalf of an organization, you represent you have authority to bind that organization.
          </p>

          <h2 className="text-2xl font-semibold mt-12">3. Description of Service</h2>
          <p className="mt-4">
            anonimi is a real-time messaging platform providing private conversations, group chats, contacts, and moderation
            tooling. Features and availability may change over time.
          </p>

          <h2 className="text-2xl font-semibold mt-12">4. Accounts and Security</h2>
          <p className="mt-4">
            You are responsible for safeguarding your credentials and for activity on your account. You agree to provide
            accurate information and to promptly update it when it changes.
          </p>

          <h2 className="text-2xl font-semibold mt-12">5. Temporary Accounts</h2>
          <p className="mt-4">
            Temporary accounts provide limited-time access (up to 24 hours) without email or password. To keep a temporary
            account and its conversation history, you must claim it by adding an email address and password and completing
            verification.
          </p>

          <h2 className="text-2xl font-semibold mt-12">6. Acceptable Use</h2>
          <p className="mt-4">You agree not to use the service to:</p>
          <ul className="mt-4 space-y-2">
            <li>Upload or transmit content that is illegal, harmful, or offensive</li>
            <li>Harass, threaten, or impersonate any person or entity</li>
            <li>Spam or engage in unauthorized advertising or automation</li>
            <li>Attempt to gain unauthorized access to the service or systems</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-12">7. Content and License</h2>
          <p className="mt-4">
            You retain ownership of content you submit. You grant anonimi a worldwide, non-exclusive, royalty-free license to
            host, store, reproduce, and display your content solely to operate, improve, and provide the service.
          </p>

          <h2 className="text-2xl font-semibold mt-12">8. Stealth Mode</h2>
          <p className="mt-4">
            Stealth Mode messages are designed to expire after a selected time window. Once expired, the content is no longer
            available and is replaced by an expired placeholder in the conversation.
          </p>

          <h2 className="text-2xl font-semibold mt-12">9. Moderation and Enforcement</h2>
          <p className="mt-4">
            We may review, limit, or remove content and access to enforce these Terms, respond to reports, or comply with law.
            We may suspend or terminate accounts that violate these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-12">10. Third-Party Services</h2>
          <p className="mt-4">
            The service may link to or integrate with third-party services. We are not responsible for third-party content,
            policies, or practices.
          </p>

          <h2 className="text-2xl font-semibold mt-12">11. Termination</h2>
          <p className="mt-4">
            We may suspend or terminate your access at any time for conduct that violates these Terms, harms other users, or
            threatens the service. You may stop using the service at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-12">12. Disclaimers</h2>
          <p className="mt-4">
            The service is provided on an "as is" and "as available" basis. We do not warrant that the service will be
            uninterrupted, secure, or error-free.
          </p>

          <h2 className="text-2xl font-semibold mt-12">13. Limitation of Liability</h2>
          <p className="mt-4">
            To the maximum extent permitted by law, anonimi shall not be liable for indirect, incidental, special,
            consequential, or punitive damages arising from your use of the service.
          </p>

          <h2 className="text-2xl font-semibold mt-12">14. Indemnification</h2>
          <p className="mt-4">
            You agree to defend and indemnify anonimi from claims arising out of your use of the service or violation of
            these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-12">15. Governing Law</h2>
          <p className="mt-4">
            These Terms are governed by the laws of the jurisdiction where anonimi is established, without regard to conflict
            of law principles.
          </p>

          <h2 className="text-2xl font-semibold mt-12">16. Changes to These Terms</h2>
          <p className="mt-4">
            We may update these Terms from time to time. The "Last updated" date reflects the latest revision.
          </p>

          <h2 className="text-2xl font-semibold mt-12">17. Contact Information</h2>
          <p className="mt-4">
            If you have any questions about these Terms, please contact us at support@anonimi.app.
          </p>
        </div>
      </div>
    </div>
  );
}
