'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0F1C] border-t border-[#2A3442]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🕉️</span>
              <span className="text-xl font-bold text-[#F5F0EB]">Vedic BTR</span>
            </div>
            <p className="text-[#8C7F72] text-sm leading-relaxed">
              Birth time rectification within seconds-level precision using 
              Swiss Ephemeris and DeepSeek AI.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#F5F0EB] font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/rectify" className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm">
                  Start Analysis
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#F5F0EB] font-semibold mb-4">Contact</h3>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#8B5CF6]" />
              <a
                href="mailto:support@aipandit.app"
                className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors text-sm"
              >
                support@aipandit.app
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-[#2A3442] mt-8 pt-8 text-center"
        >
          <p className="text-[#5A6475] text-sm">
            © {currentYear} aipandit.app
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
