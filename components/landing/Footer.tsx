'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-default)] py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🕉️</span>
              <span style={{ fontSize: 'var(--text-h4)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                AI-Pandit
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}>
              Vedic Birth Time Rectification
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: 'var(--text-h4)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'About', href: '#' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }} className="hover:text-[var(--text-primary)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontSize: 'var(--text-h4)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Support
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'FAQ', href: '#faq' },
                { label: 'Contact Us', href: '#' },
                { label: 'WhatsApp', href: '#' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }} className="hover:text-[var(--text-primary)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: 'var(--text-h4)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Legal
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
                { label: 'Refund Policy', href: '#' }
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }} className="hover:text-[var(--text-primary)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-default)] py-8">
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)', textAlign: 'center' }}>
            © 2025 AI-Pandit. All rights reserved.
            <br />
            Made with 🧡 in India
          </p>
        </div>
      </div>
    </footer>
  );
}
