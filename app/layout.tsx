import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import BackToTop from "./components/BackToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastDisplay } from "./components/shared/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import QueryProvider from "./providers/QueryProvider";

// Viewport configuration for better mobile experience
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030305",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mikky.vip",
  ),
  title: "EZstream - Movie Streaming Platform",
  description: "Stream movies, TV series, and anime",
  keywords: ["movies", "tv shows", "anime", "streaming", "watch online"],
  authors: [{ name: "EZstream" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "EZstream - Movie Streaming Platform",
    description: "Stream movies, TV series, and anime",
    type: "website",
    siteName: "EZstream",
  },
  twitter: {
    card: "summary",
    title: "EZstream - Movie Streaming Platform",
    description: "Stream movies, TV series, and anime",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="charcoal">
      <head>
        {/* Apply theme immediately before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ezstream_theme') || 'charcoal';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
      </head>
      <body className="antialiased bg-gray-900">
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <WatchlistProvider>
                  <ToastProvider>
                    <Navbar />
                    {children}
                    <BackToTop />
                    <ToastDisplay />
                  </ToastProvider>
                </WatchlistProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
