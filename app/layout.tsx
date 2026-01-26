import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { WatchlistProvider } from "./contexts/WatchlistContext";

export const metadata: Metadata = {
  title: "MikkyStream - Movie Streaming Platform",
  description: "Stream movies, TV series, and anime",
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
