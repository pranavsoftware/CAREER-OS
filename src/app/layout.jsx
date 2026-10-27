import '@/index.css';
import '@/App.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Career OS - University Placement & Career Operating System',
  description: 'AI-powered campus recruitment, ATS resume builder, verification, and talent pipeline operating system.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Career OS',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4F46E5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />

        {/* iOS Safari PWA — required for proper routing & full-screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Career OS" />

        {/* iOS Safari touch icon */}
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* Prevent iOS Safari from auto-detecting phone numbers/emails (breaks layout) */}
        <meta name="format-detection" content="telephone=no, email=no, address=no" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#F8F9FA] text-[#111827]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
