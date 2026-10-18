import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { brand } from "@/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: `${brand.name}: one character, every shot`, template: `%s | ${brand.name}` },
  description: "Create a character once, then make UGC style images and videos with the same face in any scene you can describe.",
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name}: one character, every shot`,
    description: "Create a character once, then make UGC style images and videos with the same face in any scene you can describe.",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
