import type { Metadata } from "next";
import { Fraunces, Manrope, Fira_Mono, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const display = Fraunces({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const firaMono = Fira_Mono({
  variable: "--font-fira-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const logoFont = Sora({
  variable: "--font-logo",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "anonimi - Real-time Chat",
  description: "A modern real-time messaging platform",
  icons: {
    icon: "/images/icon/favicon.ico",
    apple: "/images/icon/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Analytics />
      <SpeedInsights />
      <body
        className={`${display.variable} ${manrope.variable} ${firaMono.variable} ${logoFont.variable} antialiased`}
      >
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
