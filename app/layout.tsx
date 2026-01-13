import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: "Vedic Birth Time Rectification | जन्म समय शुद्धि",
  description: "Accurate birth time rectification using authentic Vedic astrology methods including K.N. Rao's event-based approach, divisional charts, and Vimshottari Dasha analysis.",
  keywords: ["Vedic Astrology", "Birth Time Rectification", "Jyotish", "Kundli", "BTR", "K.N. Rao"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-vedic-navy antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
