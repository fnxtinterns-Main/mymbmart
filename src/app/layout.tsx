import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MegaBachatMart | Bachat Bhi. Kamai Bhi.",
  description: "India's Community E-Commerce Movement. Save on daily essentials, empower local SHGs and women entrepreneurs, and earn referral micro-credit on every purchase.",
  icons: {
    icon: "/images/LOgo.jpeg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MegaBachatMart",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0D2C6C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
