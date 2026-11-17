import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WebMcpAgentRegistry } from '@/components/WebMcpAgentRegistry';

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
      "@type": "Organization",
      "@id": "https://mymbmart.com/#organization",
      "name": "MegaBachatMart",
      "legalName": "MegaBachatMart Technologies Private Limited",
      "url": "https://mymbmart.com",
      "logo": "https://mymbmart.com/images/LOgo.jpeg",
      "image": "https://mymbmart.com/images/LOgo.jpeg",
      "description":
        "India's premier hyperlocal quick-commerce marketplace connecting neighborhood shops, Self-Help Groups (SHGs), and local farmers with 20-minute delivery and 0% partner commissions.",
      "telephone": "+91-651-0000000",
      "email": "support@mymbmart.com",
      "sameAs": [
        "https://twitter.com/mymbmart",
        "https://www.linkedin.com/company/megabachatmart",
        "https://www.instagram.com/megabachatmart",
        "https://www.facebook.com/megabachatmart",
        "https://github.com/fnxtinterns-Main/mymbmart"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-651-0000000",
        "contactType": "Customer Support",
        "email": "support@mymbmart.com",
        "areaServed": "IN",
        "availableLanguage": ["English", "Hindi"]
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Road, Near Birsa Munda Chowk, Ranchi Central",
        "addressLocality": "Ranchi",
        "addressRegion": "Jharkhand",
        "postalCode": "834001",
        "addressCountry": "IN"
      }
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://mymbmart.com/#localbusiness",
      "name": "MegaBachatMart Central Hub & Dark Store",
      "url": "https://mymbmart.com",
      "logo": "https://mymbmart.com/images/LOgo.jpeg",
      "image": "https://mymbmart.com/images/LOgo.jpeg",
      "description":
        "Hyperlocal 20-minute dark store fulfillment center and merchant partner aggregation hub.",
      "telephone": "+91-651-0000000",
      "currenciesAccepted": "INR",
      "paymentAccepted": "Cash, UPI, Credit Card, Debit Card, Net Banking",
      "priceRange": "₹₹",
      "sameAs": [
        "https://twitter.com/mymbmart",
        "https://www.linkedin.com/company/megabachatmart",
        "https://www.instagram.com/megabachatmart"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Road, Ranchi Central Dark Store & Pilot Hub",
        "addressLocality": "Ranchi",
        "addressRegion": "Jharkhand",
        "postalCode": "834001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 23.3441,
        "longitude": 85.3096
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
            "Sunday"
          ],
          "opens": "07:00",
          "closes": "23:00"
        }
      ]
    },
    {
      "@type": "OnlineStore",
      "@id": "https://mymbmart.com/#store",
      "name": "MEGA BACHAT MART",
      "url": "https://mymbmart.com",
      "logo": "https://mymbmart.com/images/LOgo.jpeg",
      "image": "https://mymbmart.com/images/LOgo.jpeg",
      "description":
        "Unified quick commerce grocery delivery and marketplace with community savings passbook and promoter referral rewards.",
      "parentOrganization": { "@id": "https://mymbmart.com/#organization" },
      "currenciesAccepted": "INR",
      "paymentAccepted": "Cash, UPI, PhonePe, Debit Card, Net Banking",
      "priceRange": "₹₹",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Daily Grocery Essentials & SHG Specials",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Fortune Sunlite Refined Sunflower Oil (1 Litre)",
              "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500",
              "description": "Refined sunflower cooking oil enriched with vitamins A & D.",
              "sku": "MBM-SKU-RCH-KRN-101"
            },
            "price": "138",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2027-12-31",
            "url": "https://mymbmart.com/shop"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Tata Tea Gold Premium Assam Blended Tea (500 g)",
              "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500",
              "description": "Exquisite blend of Assam CTC teas with long leaves.",
              "sku": "MBM-SKU-RCH-KRN-102"
            },
            "price": "285",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2027-12-31",
            "url": "https://mymbmart.com/shop"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Aashirvaad Superior MP Sharbati Whole Wheat Atta (5 kg)",
              "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
              "description": "100% pure whole wheat flour ground from heavy golden grains.",
              "sku": "MBM-SKU-RCH-KRN-103"
            },
            "price": "249",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2027-12-31",
            "url": "https://mymbmart.com/shop"
          }
        ]
      }
    },
    {
      "@type": "Service",
      "@id": "https://mymbmart.com/#service-quick-commerce",
      "name": "Hyperlocal 20-Minute Quick Commerce Delivery",
      "provider": { "@id": "https://mymbmart.com/#organization" },
      "areaServed": "Ranchi Central & Surrounding Delivery Hubs",
      "description": "Zero emission electric delivery within 20 to 30 minutes from micro dark stores."
    },
    {
      "@type": "FAQPage",
      "@id": "https://mymbmart.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is MegaBachatMart?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MegaBachatMart is a community-first hyperlocal marketplace and quick-commerce network that connects local shops, Self-Help Groups (SHGs), and farmers with 20-minute delivery, 0% commissions, and prosumer savings."
          }
        },
        {
          "@type": "Question",
          "name": "How can shop owners join MegaBachatMart?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Local shops and SHGs can visit partners.mymbmart.com, submit their basic trade documentation, receive verified portal credentials within 24 hours, and start listing products with bulk CSV or instant photo upload."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods are supported on MegaBachatMart?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MegaBachatMart accepts instant PhonePe UPI payments, all major UPI apps (Google Pay, Paytm), debit/credit cards, and Cash on Delivery (COD) at the doorstep."
          }
        }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://mymbmart.com/#website",
      "url": "https://mymbmart.com",
      "name": "MEGA BACHAT MART",
      "publisher": { "@id": "https://mymbmart.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://mymbmart.com/shop?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
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
        <WebMcpAgentRegistry />
        {children}
      </body>
    </html>
  );
}
