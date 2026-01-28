/**
 * AI Pandit Landing Page
 * Ultra-transparent, high-conversion design showcasing the Vedic + AI technology
 * Design System: Leapcell-inspired (Dark theme, Green accent #00DC82)
 */

import { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import { ProcessTransparency } from '@/components/landing/ProcessTransparency';
import { TechnologyStack } from '@/components/landing/TechnologyStack';
import { AccuracyShowcase } from '@/components/landing/AccuracyShowcase';
import { TrustIndicators } from '@/components/landing/TrustIndicators';
import { FinalCTA } from '@/components/landing/FinalCTA';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'AI Pandit - Birth Time Rectification with 95-98% Accuracy',
  description: 'Discover your exact birth time using advanced AI and Vedic astrology. 9 validation methods, Swiss Ephemeris data, and 20+ minute deep analysis.',
  keywords: 'birth time rectification, vedic astrology, AI astrology, kundali, janam kundali, exact birth time',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProcessTransparency />
      <TechnologyStack />
      <AccuracyShowcase />
      <TrustIndicators />
      <FinalCTA />
      <Footer />
    </main>
  );
}
