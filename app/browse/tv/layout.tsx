import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EZ - TV Shows",
};

export default function BrowseTVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
