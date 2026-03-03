import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retro Notes",
  description: "A retro-themed notes app with auth + search + CRUD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
