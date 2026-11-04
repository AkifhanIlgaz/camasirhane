import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontArabic, fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
      ? { index: false, follow: false }
      : undefined,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // Ana ekrandan açılınca tarayıcı çubukları olmadan tam ekran açılır.
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="tr">
      <head />
      <body
        className={clsx(
          "min-h-dvh text-foreground bg-background font-sans antialiased",
          fontSans.variable,
          fontArabic.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
