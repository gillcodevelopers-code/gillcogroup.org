import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Gillco Group | Punjab\'s Leading Luxury Real Estate Developer',
  description: "Gillco Group — Punjab's leading luxury real estate developer. Curating legacy spaces with modern design since 2001. Premium residential & commercial developments in Mohali, Punjab.",
  keywords: 'Gillco Group, Gillco Meraqui, Mohali real estate, Punjab luxury apartments, RERA approved, 3 BHK 4 BHK Mohali, Sector 126 Mohali, Airport Road Mohali, Gillco Industrial Park',
  openGraph: {
    title: 'Gillco Group | Luxury Real Estate in Punjab',
    description: "Punjab's leading luxury real estate developer since 2001. 25+ years of excellence, 11M+ sq. ft. developed, 1,577+ happy families.",
    type: 'website',
    images: ['https://www.gillcogroup.com/assets/meraqui/1.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-['Inter',sans-serif] bg-white text-slate-800 antialiased selection:bg-emerald-800 selection:text-white">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
