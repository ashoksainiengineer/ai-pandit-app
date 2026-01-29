/**
 * AI Pandit - Unified Footer Component
 * Consistent footer used across all pages
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';

const footerLinks = {
  product: [
    { href: '/rectify', label: 'Start Analysis' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/#how-it-works', label: 'How It Works' },
  ],
  company: [
    { href: '/#about', label: 'About' },
    { href: '/#technology', label: 'Technology' },
    { href: '/#faq', label: 'FAQ' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0F1C] border-t border-[#2A3442]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#E8C54D] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl">🕉️</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] bg-clip-text text-transparent">
                  AI Pandit
                </span>
                <span className="block text-xs text-[#8C7F72]">Vedic BTR Engine</span>
              </div>
            </Link>
            <p className="text-[#8C7F72] text-sm leading-relaxed max-w-xs mb-4">
              Birth time rectification within seconds-level precision using 
              Swiss Ephemeris and DeepSeek AI.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#8C7F72]">
              <Mail className="w-4 h-4 text-[#8B5CF6]" />
              <a
                href="mailto:support@aipandit.app"
                className="hover:text-[#D4AF37] transition-colors"
              >
                support@aipandit.app
              </a>
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#F5F0EB] font-semibold mb-4 text-sm uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#F5F0EB] font-semibold mb-4 text-sm uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#F5F0EB] font-semibold mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-[#2A3442] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-[#5A6475] text-sm">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#5A6475]">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span>Powered by Swiss Ephemeris & DeepSeek AI</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
