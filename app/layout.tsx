// app/layout.tsx
// Root layout with Clerk auth provider and global styles

import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Inter, Poppins, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-poppins',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-playfair',
    display: 'swap',
});

export const metadata = {
    title: 'AI Pandit | Seconds-Level Birth Time Rectification',
    description: 'World\'s most accurate birth time rectification system. ±3-5 seconds precision with 97-99% confidence using AI + 15 Vedic methods.',
    keywords: 'birth time rectification, vedic astrology, jyotish, BTR, accurate birth time, kundli correction',
    openGraph: {
        title: 'AI Pandit | Seconds-Level Birth Time Rectification',
        description: 'Discover your precise birth time with AI-powered Vedic astrology.',
        type: 'website',
        locale: 'en_US',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            appearance={{
                baseTheme: undefined,
                variables: {
                    colorPrimary: '#D4AF37',
                    colorBackground: '#0F1419',
                    colorText: '#F5F0EB',
                    colorTextSecondary: '#C4B8AD',
                    colorInputBackground: '#1A1F2E',
                    colorInputText: '#F5F0EB',
                    borderRadius: '13px',
                },
                elements: {
                    formButtonPrimary: 'bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:opacity-90',
                    card: 'bg-[#1A1F2E] border border-[#D4AF37]/20',
                    headerTitle: 'text-[#F5F0EB]',
                    headerSubtitle: 'text-[#C4B8AD]',
                    socialButtonsBlockButton: 'border-[#D4AF37]/30 hover:bg-[#D4AF37]/10',
                    formFieldLabel: 'text-[#C4B8AD]',
                    formFieldInput: 'bg-[#2A3442] border-[#D4AF37]/20 text-[#F5F0EB]',
                    footerActionLink: 'text-[#D4AF37] hover:text-[#E8C54D]',
                }
            }}
        >
            <html lang="en" className={`${inter.variable} ${poppins.variable} ${playfair.variable}`}>
                <body className="min-h-screen bg-[#0F1419] text-[#F5F0EB] antialiased">
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
