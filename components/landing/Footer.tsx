'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative w-8 h-8">
                <Image src="/om-logo.png" alt="AI Pandit" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-white">AI Pandit</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Transforming astrology with AI-powered birth time rectification.
              Get 95-98% accurate results with our advanced Vedic astrology analysis.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Mail className="w-4 h-4 text-amber-400" />
              <a
                href="mailto:support@aipandit.app"
                className="text-amber-400 hover:text-amber-300 transition-colors text-sm"
              >
                support@aipandit.app
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/rectify" className="text-gray-400 hover:text-amber-400 transition-colors text-sm">
                  Start Analysis
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-amber-400 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm cursor-not-allowed">Privacy Policy</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm cursor-not-allowed">Terms of Service</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-slate-800 mt-8 pt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Powered by advanced AI and Vedic astrology principles
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
