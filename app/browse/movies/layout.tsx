import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EZ - Movies",
};

export default function BrowseMoviesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
