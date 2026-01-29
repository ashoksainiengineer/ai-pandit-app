/**
 * AI Pandit - Universal Navbar Component
 * Works across all pages with consistent styling
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

interface NavbarProps {
  transparent?: boolean;
}

const navLinks = [
  { href: '/rectify', label: 'Start Analysis' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar({ transparent = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  const bgClass = transparent 
    ? 'bg-transparent' 
    : 'bg-[#0A0F1C]/95 backdrop-blur-sm';

  return (
    <nav className={`fixed top-0 w-full ${bgClass} border-b border-[#2A3442] z-50 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#E8C54D] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
              <span className="text-2xl">🕉️</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] bg-clip-text text-transparent hidden sm:block">
              AI Pandit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold rounded-lg transition-all duration-200 text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                Dashboard
              </motion.button>
            </Link>
            {isSignedIn && (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 border-2 border-[#D4AF37]/50'
                  }
                }}
              />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isSignedIn && (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 border-2 border-[#D4AF37]/50'
                  }
                }}
              />
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#8C7F72] hover:text-[#D4AF37] p-2 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="md:hidden bg-[#0F1419] border-t border-[#2A3442] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
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
                    className="block px-4 py-3 text-[#8C7F72] hover:text-[#D4AF37] hover:bg-[#2A3442] rounded-lg transition-colors duration-200"
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
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="block mt-2"
                >
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
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
