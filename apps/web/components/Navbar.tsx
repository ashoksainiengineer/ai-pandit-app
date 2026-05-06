'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import '@/app/prism-design-system.css';

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
      <nav className={`fixed top-0 w-full z-50 h-16 sm:h-20 ${transparent ? 'bg-transparent' : 'bg-prism-canvas/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-prism-ink rounded-lg" />
            <div className="h-6 w-24 bg-prism-pebble/30 rounded" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
      ? 'bg-prism-snow/90 backdrop-blur-xl border-b border-prism-pebble shadow-prism-sm'
      : transparent ? 'bg-transparent' : 'bg-prism-canvas/80 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-prism-ink to-prism-graphite rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-prism-snow text-sm sm:text-lg font-bold">ॐ</span>
              </div>
              <div>
                <span className="font-prism text-xl sm:text-2xl font-semibold text-prism-ink">
                  AI Pandit
                </span>
                <span className="hidden sm:block text-[10px] text-prism-graphite uppercase tracking-[0.2em]">
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
                className="text-prism-graphite hover:text-prism-ink transition-colors duration-300 
                           text-sm font-medium relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prism-ink 
                                 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA & Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <button
                className="px-6 py-2.5 bg-prism-ink text-prism-snow 
                           font-medium text-sm rounded-prism-xl shadow-prism-sm
                           hover:bg-prism-graphite transition-colors duration-300"
              >
                Dashboard
              </button>
            </Link>
            {isLoaded && isSignedIn && (
              <div className="border border-prism-pebble rounded-prism-lg p-1 bg-prism-snow">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {isLoaded && isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-prism-lg 
                         bg-prism-snow border border-prism-pebble text-prism-graphite hover:text-prism-ink
                         hover:border-prism-ash transition-all duration-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden bg-prism-snow/98 backdrop-blur-xl border-t border-prism-pebble"
        >
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <div
                key={link.href}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-prism-graphite hover:text-prism-ink 
                             hover:bg-prism-fog rounded-prism-lg transition-all duration-300"
                >
                  {link.label}
                </Link>
              </div>
            ))}
            <div>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <button className="w-full mt-2 px-4 py-3 bg-prism-ink 
                                   text-prism-snow font-medium rounded-prism-xl">
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
