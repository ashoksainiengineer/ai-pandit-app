'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

const navLinks = [
  { href: '/rectify', label: 'Start Analysis' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 w-full bg-[#0A0F1C]/95 backdrop-blur-sm border-b border-[#2A3442] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🕉️</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#8C7F72] hover:text-[#D4AF37] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
              >
                Dashboard
              </motion.button>
            </Link>
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#8C7F72] hover:text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A1F2E] border-t border-[#2A3442]"
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
                    className="block px-3 py-2 text-[#8C7F72] hover:text-[#D4AF37] hover:bg-[#2A3442] rounded-md transition-colors duration-200"
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
                  <button className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold rounded-lg transition-colors duration-200">
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
