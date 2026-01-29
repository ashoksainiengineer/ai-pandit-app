/**
 * Footer - Sacred Ivory Edition
 * Light, elegant footer with warm accents
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <span className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] block">
                AI Pandit
              </span>
              <span className="text-[10px] text-[#7A756F] uppercase tracking-[0.2em]">
                Powered by DeepSeek R1-0528
              </span>
            </div>
            
            <p className="text-[#4A453F] text-sm leading-relaxed mb-6">
              Birth time rectification within seconds-level precision using 
              Swiss Ephemeris and DeepSeek AI. Aligning ancient Vedic wisdom 
              with modern computational power.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-[#7A756F]">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>and sacred intention</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
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
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
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
                                flex items-center justify-center group-hover:border-[#D4A853]/50 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>support@aipandit.app</span>
              </a>
              
              <div className="pt-4 border-t border-[#F0E8DE]">
                <p className="text-xs text-[#7A756F] leading-relaxed">
                  Based on Swiss Ephemeris calculations. For spiritual guidance only. 
                  Not a substitute for professional astrological consultation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-[#F0E8DE] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-[#7A756F] text-sm">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#A8A39D]">Powered by</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7A756F]">Swiss Ephemeris</span>
              <span className="text-[#F0E8DE]">•</span>
              <span className="text-xs text-[#7A756F]">DeepSeek AI</span>
              <span className="text-[#F0E8DE]">•</span>
              <span className="text-xs text-[#7A756F]">Next.js</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
