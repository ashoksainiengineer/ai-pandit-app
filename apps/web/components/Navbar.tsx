'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    setMounted(true);
    const updateNavbarOnScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    updateNavbarOnScroll();
    window.addEventListener('scroll', updateNavbarOnScroll);
    return () => window.removeEventListener('scroll', updateNavbarOnScroll);
  }, []);

  if (!mounted) {
    return (
      <nav className={`fixed top-0 w-full z-50 h-16 sm:h-20 ${transparent ? 'bg-transparent' : 'bg-[#FFFCF8]/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#B8860B] rounded-lg" />
            <div className="h-6 w-24 bg-[#B8860B]/10 rounded" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
      ? 'bg-white/90 backdrop-blur-xl border-b border-[#F0E8DE] shadow-sm'
      : transparent ? 'bg-transparent' : 'bg-[#FFFCF8]/80 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#B8860B] to-[#78611D] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm sm:text-lg font-bold">ॐ</span>
              </div>
              <div>
                <span className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-semibold text-[#1A1612]">
                  AI Pandit
                </span>
                <span className="hidden sm:block text-[10px] text-[#5A554F] uppercase tracking-[0.2em]">
                  VEDIC ASTRO MASTER
                </span>
              </div>
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
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#B8860B] to-[#78611D] 
                                 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA & Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-[#6B1F7A] to-[#8B4A9C] text-white 
                           font-medium text-sm rounded-xl shadow-lg shadow-purple-500/20
                           hover:shadow-purple-500/30 transition-shadow duration-300"
              >
                Dashboard
              </button>
            </Link>
            {isLoaded && isSignedIn && (
              <div className="border border-[#F0E8DE] rounded-xl p-1 bg-white">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {isLoaded && isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl 
                         bg-white border border-[#F0E8DE] text-[#4A453F] hover:text-[#B8860B]
                         hover:border-[#78611D]/50 transition-all duration-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden bg-white/98 backdrop-blur-xl border-t border-[#F0E8DE]"
        >
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <div
                key={link.href}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-[#4A453F] hover:text-[#B8860B] 
                             hover:bg-[#FDF8F3] rounded-xl transition-all duration-300"
                >
                  {link.label}
                </Link>
              </div>
            ))}
            <div>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <button className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-[#6B1F7A] to-[#8B4A9C] 
                                   text-white font-medium rounded-xl">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


