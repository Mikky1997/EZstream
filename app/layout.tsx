import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { WatchlistProvider } from "./contexts/WatchlistContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mikky.vip'),
  title: "MikkyStream - Movie Streaming Platform",
  description: "Stream movies, TV series, and anime",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "MikkyStream - Movie Streaming Platform",
    description: "Stream movies, TV series, and anime",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MikkyStream - Movie Streaming Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "MikkyStream - Movie Streaming Platform",
    description: "Stream movies, TV series, and anime",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-900">
        <AuthProvider>
          <WatchlistProvider>
            <Navbar />
            {children}
          </WatchlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
