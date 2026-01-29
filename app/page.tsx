/**
 * AI Pandit Landing Page - Technical Showcase
 * Engineering-focused design highlighting algorithmic precision
 * Design System: Dark theme with Green accent #00DC82
 */

import { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Solution from '@/components/landing/Solution';
import { AccuracyShowcase } from '@/components/landing/AccuracyShowcase';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'AI Pandit - Birth Time Rectification Engine v4.2',
  description: 'NASA-grade Swiss Ephemeris calculations fused with DeepSeek AI. Achieve God-Tier precision in birth time rectification through algorithmic Vedic analysis.',
  keywords: 'birth time rectification, vedic astrology, swiss ephemeris, deepseek ai, algorithmic astrology, btr engine',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <AccuracyShowcase />
      <Footer />
    </main>
  );
}
