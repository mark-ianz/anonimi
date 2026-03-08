export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative w-full max-w-md px-4">
        {/* Background decorative elements */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--echo-gradient)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.45 0.12 300), transparent)",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
