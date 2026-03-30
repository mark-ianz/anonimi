export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(18,42,64,0.09),transparent_36%),radial-gradient(circle_at_88%_8%,rgba(33,117,138,0.1),transparent_40%)]"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,420px)] md:px-8">
        <section className="hidden border-l border-border/60 pl-7 md:block">
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            EchoID Access
          </p>
          <h1 className="mt-4 max-w-[13ch] text-5xl leading-[0.94] font-semibold">
            Private messaging starts with identity.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Sign in or create an account to access your secure workspace, contacts, and conversations.
          </p>
        </section>

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
