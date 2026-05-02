import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getMonthlyFeedbackTitle } from "@/lib/month";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export function generateMetadata(): Metadata {
  const title = getMonthlyFeedbackTitle();
  return {
    title,
    description: "Monthly feedback collection for Masai School.",
    icons: []
  };
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

