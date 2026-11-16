import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mymbmart.com"),
  title: {
    default: "MEGA BACHAT MART | Bachat Bhi. Kamai Bhi. - Shop Smart. Save More.",
    template: "%s | MEGA BACHAT MART",
  },
  description:
    "India's community-driven e-commerce & quick commerce platform. 20-minute grocery delivery from local dark stores, marketplace shopping, 3-tier promoter referral rewards, and rural SHG empowerment in Ranchi.",
  keywords: [
    "Mega Bachat Mart",
    "mymbmart",
    "quick commerce Ranchi",
    "online grocery shopping",
    "bachat bhi kamai bhi",
    "referral earnings",
    "SHG products",
    "organic food Ranchi",
    "fresh vegetables Ranchi",
  ],
  authors: [{ name: "Mega Bachat Mart Team", url: "https://mymbmart.com" }],
  creator: "Mega Bachat Mart",
  publisher: "Mega Bachat Mart",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "MEGA BACHAT MART | Bachat Bhi. Kamai Bhi.",
    description:
      "Shop Smart. Save More. 20-minute grocery delivery from dark stores, savings passbook, and 3-tier promoter team rewards.",
    url: "https://mymbmart.com",
    siteName: "MEGA BACHAT MART",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/LOgo.jpeg",
        width: 800,
        height: 600,
        alt: "MEGA BACHAT MART Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEGA BACHAT MART | Bachat Bhi. Kamai Bhi.",
    description: "Shop Smart. Save More. 20-minute grocery delivery & promoter rewards.",
    images: ["/images/LOgo.jpeg"],
  },
  alternates: {
    canonical: "https://mymbmart.com",
  },
  icons: {
    icon: "/images/LOgo.jpeg",
    apple: "/images/LOgo.jpeg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MEGA BACHAT MART",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#064E3B",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": "https://mymbmart.com/#store",
      "name": "MEGA BACHAT MART",
      "url": "https://mymbmart.com",
      "logo": "https://mymbmart.com/images/LOgo.jpeg",
      "image": "https://mymbmart.com/images/LOgo.jpeg",
      "description":
        "Unified quick commerce grocery delivery and marketplace with community savings passbook and promoter referral rewards.",
      "telephone": "+91-651-0000000",
      "currenciesAccepted": "INR",
      "paymentAccepted": "Cash, Credit Card, UPI, Debit Card, Net Banking",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Road, Ranchi Central Dark Store",
        "addressLocality": "Ranchi",
        "addressRegion": "Jharkhand",
        "postalCode": "834001",
        "addressCountry": "IN",
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          "opens": "07:00",
          "closes": "23:00",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://mymbmart.com/#website",
      "url": "https://mymbmart.com",
      "name": "MEGA BACHAT MART",
      "publisher": { "@id": "https://mymbmart.com/#store" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://mymbmart.com/shop?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
