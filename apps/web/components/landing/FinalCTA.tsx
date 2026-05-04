/**
 * Final CTA Section
 * High-conversion call to action with pricing and urgency
 */

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Clock, Download } from 'lucide-react';

const features = [
  { icon: Clock, text: 'Results in 20-25 minutes' },
  { icon: Shield, text: '97% accuracy guaranteed' },
  { icon: Download, text: '15-20 page detailed report' },
];

export function FinalCTA() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0a0b] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-[#00DC82]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Main Card */}
          <div className="relative bg-gradient-to-b from-[#111113] to-[#0a0a0b] border border-zinc-800 rounded-3xl p-8 lg:p-12 overflow-hidden">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00DC82] to-transparent" />

            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-full text-[#00DC82] text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Limited Time Offer
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Discover Your{' '}
                <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
                  True Birth Time
                </span>?
              </h2>

              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Join 10,000+ Indians who have transformed their astrology journey with AI-powered precision.
              </p>
            </div>

            {/* Pricing Card */}
            <div className="max-w-md mx-auto mb-10">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-end justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold text-white">₹799</span>
                  <span className="text-xl text-zinc-500 line-through mb-2">₹2,499</span>
                </div>
                
                <div className="text-center text-[#00DC82] text-sm font-medium mb-6">
                  Save 68% • Limited Period Offer
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 text-sm text-zinc-300">
                        <div className="w-5 h-5 rounded-full bg-[#00DC82]/20 flex items-center justify-center">
                          <Icon className="w-3 h-3 text-[#00DC82]" />
                        </div>
                        {feature.text}
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <Link href="/rectify">
                  <button
                    className="w-full py-4 bg-gradient-to-r from-[#00DC82] to-[#36E4DA] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(0,220,130,0.3)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Start Your Analysis Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <p className="text-center text-xs text-zinc-500 mt-4">
                  7-day money-back guarantee • Secure payment • Instant delivery
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                10,000+ Happy Customers
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Bank-Grade Security
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
