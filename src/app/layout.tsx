import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seraya Airways | Discover More",
  description: "The official Seraya Airways booking experience."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
