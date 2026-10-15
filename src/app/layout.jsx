import '@/index.css';
import '@/App.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Career OS - University Placement & Career Operating System',
  description: 'AI-powered campus recruitment, ATS resume builder, verification, and talent pipeline operating system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#F8F9FA] text-[#111827]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
