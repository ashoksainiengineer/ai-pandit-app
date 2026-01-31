/**
 * Navbar - Sacred Ivory Edition
 * Light, elegant navigation with warm accents
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

const navLinks = [
  { href: '/rectify', label: 'Start Analysis' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-xl border-b border-[#F0E8DE] shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand - Always visible with logo icon on mobile */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            {/* Logo Icon - Visible on all screens */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#B8860B] to-[#D4A853] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm sm:text-lg font-bold">ॐ</span>
            </div>
            {/* Text - Hidden on very small screens, visible on sm+ */}
            <div className="hidden sm:block">
              <span className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-semibold text-[#1A1612]">
                AI Pandit
              </span>
              <span className="block text-[10px] text-[#7A756F] uppercase tracking-[0.2em]">
                VEDIC ASTRO MASTER
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#4A453F] hover:text-[#B8860B] transition-colors duration-300 
                           text-sm font-medium relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#B8860B] to-[#D4A853] 
                                 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA & Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#6B1F7A] to-[#8B4A9C] text-white 
                           font-medium text-sm rounded-xl shadow-lg shadow-purple-500/20
                           hover:shadow-purple-500/30 transition-shadow duration-300"
              >
                Dashboard
              </motion.button>
            </Link>
            {isSignedIn && (
              <div className="border border-[#F0E8DE] rounded-xl p-1 bg-white">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl 
                         bg-white border border-[#F0E8DE] text-[#4A453F] hover:text-[#B8860B]
                         hover:border-[#D4A853]/50 transition-all duration-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/98 backdrop-blur-xl border-t border-[#F0E8DE]"
          >
            <div className="px-6 py-6 space-y-4">
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
                    className="block px-4 py-3 text-[#4A453F] hover:text-[#B8860B] 
                               hover:bg-[#FDF8F3] rounded-xl transition-all duration-300"
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
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <button className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-[#6B1F7A] to-[#8B4A9C] 
                                     text-white font-medium rounded-xl">
                    Dashboard
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
