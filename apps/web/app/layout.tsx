/**
 * AI Pandit - Root Layout
 * Dia Browser Design System — Clean, Minimal, Monochrome
 *
 * Fonts loaded via next/font for optimal Core Web Vitals.
 */

import { DM_Sans, JetBrains_Mono } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

import { ClerkProvider } from '@clerk/nextjs';
import { env } from '@/lib/config/env';
import { DebugProvider } from '@/components/providers/debug-provider';
import { RootTestModeProvider } from '@/components/providers/root-test-mode-provider';
import './globals.css';

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
  themeColor: '#a8c4e8',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={env.clerk.publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#000000',
          colorBackground: '#f8f8f8',
          colorText: '#000000',
          colorTextSecondary: '#636363',
          colorInputBackground: '#ffffff',
          colorInputText: '#000000',
          borderRadius: '16px',
        },
        elements: {
          formButtonPrimary: 'bg-black hover:bg-black/85 text-white font-medium',
          card: 'bg-white border border-black/8',
          headerTitle: 'text-black font-[family-name:var(--font-dm-sans)]',
          headerSubtitle: 'text-black/60',
          socialButtonsBlockButton: 'border-black/10 hover:bg-black/5',
          formFieldLabel: 'text-black/60',
          formFieldInput: 'bg-white border-black/10 text-black focus:border-black',
          footerActionLink: 'text-black hover:text-black/70',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="preconnect" href="https://nominatim.openstreetmap.org" />
          <link rel="preconnect" href="https://tile.openstreetmap.org" />
        </head>
        <body className={`${dmSans.variable} ${jetbrainsMono.variable} min-h-screen bg-dia-bg text-dia-ink antialiased overflow-x-hidden`}>
          {/* Dia Browser Clean Background */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-dia-bg" />

          {/* Main Content */}
          <DebugProvider>
            <RootTestModeProvider>
              <div className="relative z-10">
                {children}
              </div>
            </RootTestModeProvider>
          </DebugProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
