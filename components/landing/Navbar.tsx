'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

// OM Symbol SVG Component
const OmSymbol = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="currentColor"
  >
    {/* OM Symbol Paths */}
    <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 85c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z"/>
    {/* Top curve */}
    <path d="M35 35c0-8 6-15 15-15s15 7 15 15c0 6-3 10-8 13 5 2 10 7 10 14 0 10-8 18-18 18-8 0-15-5-17-12h8c2 4 6 6 10 6 6 0 10-4 10-10 0-5-4-9-10-9h-3v-7h3c5 0 9-3 9-8 0-5-4-8-9-8s-9 3-9 8h-7z"/>
    {/* Middle part */}
    <path d="M30 55c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9zm0-14c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z"/>
    {/* Crescent */}
    <path d="M65 70c-8 0-15-4-19-10h8c3 3 6 5 11 5 8 0 15-7 15-15s-7-15-15-15c-4 0-8 2-11 5h-8c4-6 11-10 19-10 12 0 22 10 22 22s-10 22-22 22z"/>
    {/* Dot */}
    <circle cx="65" cy="25" r="5"/>
  </svg>
);

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <OmSymbol className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold text-white">AI-PANDIT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/rectify">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Get Started
              </motion.button>
            </Link>
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-800 border-t border-slate-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-slate-700 rounded-md transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
              >
                <Link href="/rectify" onClick={() => setIsOpen(false)}>
                  <button className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                    Get Started
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
