import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About EchoID",
  description: "Learn about the EchoID platform and our mission.",
};

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold">About EchoID</h1>
        
        <div className="mt-8 prose prose-lg dark:prose-invert">
          <p className="text-lg text-muted-foreground">
            EchoID is a modern messaging platform built with privacy and security at its core. 
            We believe that communication should be secure, private, and accessible to everyone.
          </p>

          <h2 className="text-2xl font-semibold mt-12">Our Mission</h2>
          <p className="mt-4">
            Our mission is to provide a secure messaging platform that respects user privacy 
            while delivering a seamless communication experience. We aim to revolutionize 
            how people think about digital communication by putting users in control of their identity.
          </p>

          <h2 className="text-2xl font-semibold mt-12">What Makes Us Different</h2>
          <ul className="mt-4 space-y-2">
            <li><strong>Privacy-First Identity:</strong> No phone numbers or personal information required. Your EchoID is uniquely yours.</li>
            <li><strong>End-to-End Encryption:</strong> Your messages are secured with industry-standard encryption.</li>
            <li><strong>Modern Architecture:</strong> Built on cutting-edge technology for speed and reliability.</li>
            <li><strong>User Control:</strong> Block, report, and manage your communications on your terms.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-12">The Team</h2>
          <p className="mt-4">
            We are a team of passionate developers and designers committed to building 
            the best messaging experience. We value privacy, security, and user experience above all else.
          </p>

          <h2 className="text-2xl font-semibold mt-12">Contact Us</h2>
          <p className="mt-4">
            Have questions or feedback? We'd love to hear from you. 
            <a href="/contact" className="text-primary hover:underline ml-1">Get in touch</a>
          </p>
        </div>
      </div>
    </div>
  );
}
