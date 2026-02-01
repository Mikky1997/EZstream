import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EZ - Anime",
};

export default function BrowseAnimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
