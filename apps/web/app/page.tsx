/**
 * AI Pandit Landing Page - Celestial Design System
 * Cosmic aesthetics with sacred Indian heritage
 *
 * Build Optimization:
 * - Static generation for instant load
 * - ISR for automatic updates every hour
 * - No server-side computation on request
 * - Dynamic imports for below-fold content
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';

const Problem = dynamic(() => import('@/components/landing/Problem'), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const Solution = dynamic(() => import('@/components/landing/Solution'), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const AccuracyShowcase = dynamic(() => import('@/components/landing/AccuracyShowcase').then(mod => ({ default: mod.AccuracyShowcase })), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const TestimonialsSection = dynamic(() => import('@/components/landing/Testimonials'), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const Pricing = dynamic(() => import('@/components/landing/Pricing'), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <section className="min-h-[400px] bg-[#FFFCF8]" />,
  ssr: true
});
const FinalCTA = dynamic(() => import('@/components/landing/FinalCTA').then(mod => ({ default: mod.FinalCTA })), {
  loading: () => <section className="min-h-[200px] bg-[#FFFCF8]" />,
  ssr: true
});
const Footer = dynamic(() => import('@/components/landing/Footer'), {
  ssr: true
});

// ISR: Revalidate every hour to refresh content without full rebuild
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI Pandit | Celestial Birth Time Rectification',
  description: 'Discover your precise birth time with divine accuracy. AI-powered Vedic astrology with seconds-level precision through celestial algorithmic analysis.',
  keywords: 'birth time rectification, vedic astrology, jyotish, BTR, accurate birth time, kundli correction, celestial astrology',
  openGraph: {
    title: 'AI Pandit | Celestial Birth Time Rectification',
    description: 'Discover your precise birth time with divine accuracy through AI-powered Vedic astrology.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <AccuracyShowcase />
      <TestimonialsSection />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
