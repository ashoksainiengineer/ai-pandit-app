'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(26, 22, 20, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none'
      }}
    >
      <nav className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🕉️</span>
          <span className="text-xl font-bold text-[var(--text-primary)]">AI-Pandit</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            FAQ
          </a>
        </div>

        {/* CTA Button - Desktop */}
        <Link href="/rectify" className="hidden md:inline-flex btn btn-primary h-[44px] px-6">
          Start Rectification
        </Link>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[var(--text-primary)]"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-surface)] border-t border-[var(--border-default)] px-6 py-4">
          <div className="flex flex-col gap-4">
            <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              How It Works
            </a>
            <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Pricing
            </a>
            <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              FAQ
            </a>
            <Link href="/rectify" className="btn btn-primary w-full">
              Start Rectification
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
