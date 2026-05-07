/**
 * AI Pandit - Footer Component
 * Light Theme
 */

'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { href: '/rectify', label: 'Start Analysis' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#features', label: 'Features' },
  ],
  Resources: [
    { href: '#', label: 'Documentation' },
    { href: '#', label: 'API Reference' },
  ],
  Company: [
    { href: '#', label: 'About' },
    { href: '#', label: 'Blog' },
    { href: '#', label: 'Careers' },
    { href: '#', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '#', label: 'Cookie Policy' },
  ],
};

const socialLinks = [
  { label: 'GitHub', href: '#', icon: Github },
  { label: 'Twitter', href: '#', icon: Twitter },
  { label: 'Email', href: 'mailto:app.aipandit@gmail.com', icon: Mail },
];

export default memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FAFAFA] border-t border-[rgba(0,0,0,0.05)]">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#79C9FF] to-[#0358F7] rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">ॐ</span>
              </div>
              <span className="text-2xl font-medium text-black tracking-tight">AI Pandit</span>
            </Link>
            <p className="text-[#636363] text-sm leading-relaxed max-w-xs mb-6">
              AI-powered Vedic birth time rectification with seconds-level precision.
              Private by design.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/10 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-black/60 mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-black/40 hover:text-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 pt-6 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/20">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-black/20 uppercase tracking-wider">Powered by</span>
            <div className="flex items-center gap-4">
              {['Next.js', 'DeepSeek AI', 'Skyfield', 'Neon'].map((tech, i) => (
                <React.Fragment key={tech}>
                  <span className="text-xs text-black/30">{tech}</span>
                  {i < 3 && <span className="text-black/10">•</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
