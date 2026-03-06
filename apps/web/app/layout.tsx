/**
 * AI Pandit - Root Layout
 * Sacred Ivory Light Theme with Elegant Typography
 */

import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Cormorant_Garamond, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { DebugProvider } from '@/components/providers/debug-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AI Pandit | Birth Time Rectification',
  description: 'Discover your precise birth time with divine accuracy. AI-powered Vedic astrology with seconds-level precision.',
  keywords: 'birth time rectification, vedic astrology, jyotish, BTR, accurate birth time, kundli correction',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Pandit',
  },
  openGraph: {
    title: 'AI Pandit | Birth Time Rectification',
    description: 'Discover your precise birth time with divine accuracy through AI-powered Vedic astrology.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#B8860B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#B8860B',
          colorBackground: '#FFFCF8',
          colorText: '#1A1612',
          colorTextSecondary: '#4A453F',
          colorInputBackground: '#FDF8F3',
          colorInputText: '#1A1612',
          borderRadius: '16px',
        },
        elements: {
          formButtonPrimary: 'bg-gradient-to-r from-[#B8860B] to-[#78611D] hover:opacity-90 text-white font-semibold',
          card: 'bg-[#FDF8F3] border border-[#F0E8DE]',
          headerTitle: 'text-[#1A1612] font-[family-name:var(--font-cormorant)]',
          headerSubtitle: 'text-[#4A453F]',
          socialButtonsBlockButton: 'border-[#78611D]/30 hover:bg-[#78611D]/10',
          formFieldLabel: 'text-[#4A453F]',
          formFieldInput: 'bg-[#FFFCF8] border-[#F0E8DE] text-[#1A1612] focus:border-[#78611D]',
          footerActionLink: 'text-[#B8860B] hover:text-[#78611D]',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className="min-h-screen bg-[#FFFCF8] text-[#1A1612] antialiased overflow-x-hidden">
          {/* Subtle Sacred Pattern Background */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-sacred-pattern" />

          {/* Main Content */}
          <DebugProvider>
            <div className="relative z-10">
              {children}
            </div>
          </DebugProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
