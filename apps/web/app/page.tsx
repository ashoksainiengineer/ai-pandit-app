/**
 * AI Pandit Landing Page
 *
 * Clean, trust-building landing page focused on conversion.
 * Hero → How It Works → Why Trust Us → FAQ → Footer
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), {
  loading: () => <section className="min-h-[300px] bg-[#FFFCF8]" />,
  ssr: true,
});
const WhyTrustUs = dynamic(() => import('@/components/landing/WhyTrustUs'), {
  loading: () => <section className="min-h-[300px] bg-white" />,
  ssr: true,
});
const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <section className="min-h-[300px] bg-[#FFFCF8]" />,
  ssr: true,
});
const Footer = dynamic(() => import('@/components/landing/Footer'), {
  ssr: true,
});

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI Pandit — Birth Time Rectification',
  description:
    'Discover your precise birth time. AI-powered Vedic astrology cross-references your life events against planetary positions for seconds-level accuracy.',
  keywords:
    'birth time rectification, vedic astrology, jyotish, BTR, accurate birth time, kundli correction',
  openGraph: {
    title: 'AI Pandit — Birth Time Rectification',
    description:
      'Discover your precise birth time through AI-powered Vedic astrology.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <WhyTrustUs />
      <FAQ />
      <Footer />
    </main>
  );
}
