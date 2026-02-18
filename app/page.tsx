/**
 * AI Pandit Landing Page - Celestial Design System
 * Cosmic aesthetics with sacred Indian heritage
 *
 * Build Optimization:
 * - Static generation for instant load
 * - ISR for automatic updates every hour
 * - No server-side computation on request
 */

import { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Solution from '@/components/landing/Solution';
import { AccuracyShowcase } from '@/components/landing/AccuracyShowcase';
import { FinalCTA } from '@/components/landing/FinalCTA';
import TestimonialsSection from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

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
