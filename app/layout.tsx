import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD
=======
import { ErrorBoundary } from '@/components/ErrorBoundary';
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17

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
<<<<<<< HEAD
        {children}
=======
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
      </body>
    </html>
  );
}
