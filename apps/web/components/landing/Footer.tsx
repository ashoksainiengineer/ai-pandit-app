/**
 * Footer - Sacred Ivory Edition
 * Light, elegant footer with warm accents
 */

import Link from 'next/link';
import { Mail, Heart, Sparkles } from 'lucide-react';

const footerLinks = [
  { href: '/rectify', label: 'Start Analysis' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[#F0E8DE] bg-[#FDF8F3]">
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand Column */}
          <div
          >
            <div className="mb-6">
              <span className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] block">
                AI Pandit
              </span>
              <span className="text-[10px] text-[#5A554F] uppercase tracking-[0.2em]">
                Powered by DeepSeek R1-0528
              </span>
            </div>

            <p className="text-[#4A453F] text-sm leading-relaxed mb-6">
              Birth time rectification within seconds-level precision using
              Skyfield ephemeris and DeepSeek AI. Aligning ancient Vedic wisdom
              with modern computational power.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#5A554F]">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>and sacred intention</span>
            </div>
          </div>

          {/* Quick Links */}
          <div
          >
            <h3 className="font-[family-name:var(--font-cormorant)] text-[#1A1612] font-semibold text-lg mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#4A453F] hover:text-[#B8860B] transition-colors duration-300 text-sm 
                               flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-[#B8860B] group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div
          >
            <h3 className="font-[family-name:var(--font-cormorant)] text-[#1A1612] font-semibold text-lg mb-6">
              Connect
            </h3>

            <div className="space-y-4">
              <a
                href="mailto:support@aipandit.app"
                className="flex items-center gap-3 text-[#4A453F] hover:text-[#B8860B] 
                           transition-colors duration-300 text-sm group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#F0E8DE] 
                                flex items-center justify-center group-hover:border-[#78611D]/50 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>support@aipandit.app</span>
              </a>

              <div className="pt-4 border-t border-[#F0E8DE]">
                <p className="text-xs text-[#5A554F] leading-relaxed">
                  Based on Skyfield ephemeris calculations. For spiritual guidance only.
                  Not a substitute for professional astrological consultation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-[#F0E8DE] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-[#5A554F] text-sm">
            © {currentYear} AI Pandit. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <span className="text-xs text-[#8A857F]">Powered by</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5A554F]">Skyfield</span>
              <span className="text-[#F0E8DE]">•</span>
              <span className="text-xs text-[#5A554F]">DeepSeek AI</span>
              <span className="text-[#F0E8DE]">•</span>
              <span className="text-xs text-[#5A554F]">Next.js</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
