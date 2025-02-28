'use client';

import { useEffect, useState } from 'react';
import localFont from 'next/font/local';
import { AppProvider } from '@/app/context/AppContext';

import '../styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const metadata = {
  title: 'Silent infestation',
  icons: {
    icon: '/images/logo.jpg',
  },
};

export default function RootLayout({ children }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 375);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <link rel="icon" href={metadata.icons.icon} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-default antialiased`}>
        {isSmallScreen ? (
          <main className="fixed inset-0 flex items-center justify-center bg-black text-xl text-white">
            Screen too small
          </main>
        ) : (
          <>
            <AppProvider>
              <Navbar />
              <main className="mt-[7rem] min-h-[calc(100vh-7rem)]">{children}</main>
              <Footer />
            </AppProvider>
          </>
        )}
      </body>
    </html>
  );
}
