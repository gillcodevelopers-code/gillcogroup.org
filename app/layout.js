import './globals.css';

export const metadata = {
  title: 'AuraCorp Developers | Luxury Real Estate & Premium Townships',
  description: 'Discover award-winning luxury residential townships, penthouses, and commercial spaces by AuraCorp Developers. RERA compliant with prime locations.',
  keywords: 'luxury real estate, AuraCorp, penthouses, apartments, RERA approved, property developers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-['Plus_Jakarta_Sans',sans-serif] bg-white text-slate-800 antialiased selection:bg-emerald-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
