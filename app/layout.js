import './globals.css';
import { Toaster } from 'sonner';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b5138',
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org'),
  title: {
    default: "Gillco Group | Punjab's Leading Luxury Real Estate Developer",
    template: '%s | Gillco Group',
  },
  description:
    "Gillco Group — Punjab's leading luxury real estate developer. Curating legacy spaces with modern design since 2001. Premium residential & commercial developments in Mohali, Punjab.",
  keywords: [
    'Gillco Group', 'Gillco Meraqui', 'Mohali real estate', 'Punjab luxury apartments',
    'RERA approved', '3 BHK 4 BHK Mohali', 'Sector 126 Mohali', 'Airport Road Mohali',
    'Gillco Industrial Park', 'Gillco Parkhills', 'Chandigarh real estate',
  ],
  authors: [{ name: 'Gillco Group' }],
  creator: 'Gillco Group',
  publisher: 'Gillco Group',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  icons: {
    icon: 'https://www.gillcogroup.com/gillco-logo-original.png',
    apple: 'https://www.gillcogroup.com/gillco-logo-original.png',
  },
  openGraph: {
    title: 'Gillco Group | Luxury Real Estate in Punjab',
    description:
      "Punjab's leading luxury real estate developer since 2001. 25+ years of excellence, 11M+ sq. ft. developed, 1,577+ happy families.",
    url: '/',
    siteName: 'Gillco Group',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: 'https://www.gillcogroup.com/assets/meraqui/1.jpg',
        width: 1200,
        height: 630,
        alt: 'Gillco Meraqui — Luxury Living in Mohali',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gillco Group | Luxury Real Estate in Punjab',
    description: "Punjab's leading luxury real estate developer since 2001.",
    images: ['https://www.gillcogroup.com/assets/meraqui/1.jpg'],
  },
  alternates: { canonical: '/' },
  formatDetection: { telephone: true, email: true, address: true },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Gillco Group',
  url: 'https://gillcogroup.org',
  logo: 'https://www.gillcogroup.com/gillco-logo-original.png',
  description: "Punjab's leading luxury real estate developer since 2001.",
  foundingDate: '2001',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mohali',
    addressRegion: 'Punjab',
    addressCountry: 'IN',
  },
  telephone: '+91-90417-95879',
  sameAs: [
    'https://www.facebook.com/gillcogroup',
    'https://www.instagram.com/gillcogroup',
    'https://www.linkedin.com/company/gillco-group',
    'https://www.youtube.com/@gillcogroup',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect for perf */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.gillcogroup.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />

        {/* Fonts with display=swap for no flash of invisible text */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Mobile web-app hints */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=yes" />

        {/* Organization schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="font-['Inter',sans-serif] bg-white text-slate-800 antialiased selection:bg-emerald-800 selection:text-white">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
