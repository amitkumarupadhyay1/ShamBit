import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
}

export const metadata: Metadata = {
  title: {
    default: "ShamBit - A bit of goodness in every deal",
    template: "%s | ShamBit"
  },
  description: "India's most trusted local marketplace. Shop from verified sellers near you with same-day delivery, cash on delivery, and easy returns. A bit of goodness in every deal.",
  keywords: ["online shopping", "local marketplace", "India", "same day delivery", "cash on delivery", "trusted sellers", "electronics", "fashion", "daily essentials"],
  authors: [{ name: "ShamBit Team" }],
  creator: "ShamBit",
  publisher: "ShamBit Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://shambit.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://shambit.com',
    title: 'ShamBit - A bit of goodness in every deal',
    description: 'India\'s most trusted local marketplace with same-day delivery and cash on delivery.',
    siteName: 'ShamBit',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'ShamBit - Local Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShamBit - A bit of goodness in every deal',
    description: 'India\'s most trusted local marketplace with same-day delivery and cash on delivery.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//api.shambit.com" />
        <link rel="dns-prefetch" href="//cdn.shambit.com" />
        
        {/* Preload logo for faster LCP */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
      </head>
      <body
        className={`${inter.variable} bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark antialiased`}
      >
        <ServiceWorkerRegistration />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
