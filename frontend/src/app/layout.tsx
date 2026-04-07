import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";
import { baseMetadata } from "@/lib/metadata";

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Analytics />
      <SpeedInsights />
      <body className="antialiased">
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast:
                    "font-sans text-sm rounded-xl border border-border/50 shadow-elevated",
                  actionButton:
                    "!bg-transparent !text-primary !shadow-none !border-0 !p-0 !h-auto underline underline-offset-2 hover:opacity-80",
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
