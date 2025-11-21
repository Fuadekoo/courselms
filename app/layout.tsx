import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { UIProviders } from "@/components/heroUIProvider";
import DevToolsProtection from "@/components/DevToolsProtection";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Darul Kubra - Islamic Learning Platform",
  description:
    "A comprehensive Islamic learning platform offering courses, certifications, and educational resources for students worldwide.",
  keywords:
    "Islamic education, online courses, Islamic studies, certification, learning platform",
  authors: [{ name: "Darul Kubra Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0ea5e9" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning className="scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}
        >
          <UIProviders>
            <ThemeProvider
              defaultTheme="light"
              attribute="class"
              enableSystem={false}
              disableTransitionOnChange={false}
            >
              <DevToolsProtection />
              <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-100 dark:from-neutral-950 dark:via-brand-950/50 dark:to-neutral-900">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-100/20 to-transparent dark:via-brand-900/10" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.15)_1px,_transparent_0)] bg-[size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(71,85,105,0.15)_1px,_transparent_0)]" />
                </div>

                {/* Main Content */}
                <div className="relative z-10">{children}</div>

                {/* Enhanced Toast Notifications */}
                <Toaster
                  position="top-right"
                  expand={true}
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 4000,
                    classNames: {
                      toast: "backdrop-blur-md border-0 shadow-large",
                      title: "font-semibold text-sm",
                      description: "text-xs opacity-90",
                      actionButton:
                        "bg-brand-500 text-white hover:bg-brand-600 transition-colors",
                      cancelButton:
                        "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors",
                      closeButton:
                        "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors border-0",
                      loading:
                        "bg-brand-50/90 border border-brand-200/50 text-brand-700 dark:bg-brand-950/90 dark:border-brand-800/50 dark:text-brand-300",
                      success:
                        "bg-emerald-50/90 border border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/90 dark:border-emerald-800/50 dark:text-emerald-300",
                      warning:
                        "bg-amber-50/90 border border-amber-200/50 text-amber-700 dark:bg-amber-950/90 dark:border-amber-800/50 dark:text-amber-300",
                      error:
                        "bg-red-50/90 border border-red-200/50 text-red-700 dark:bg-red-950/90 dark:border-red-800/50 dark:text-red-300",
                      info: "bg-blue-50/90 border border-blue-200/50 text-blue-700 dark:bg-blue-950/90 dark:border-blue-800/50 dark:text-blue-300",
                    },
                  }}
                />
              </div>
            </ThemeProvider>
          </UIProviders>
        </body>
      </html>
    </SessionProvider>
  );
}
