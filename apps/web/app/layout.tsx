import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAAL Fantasy HQ",
  description: "Private fantasy football league command center."
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
