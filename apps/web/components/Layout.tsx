'use client';

/**
 * AI Pandit - Shared Layout Component
 * Prism Design System — "Prism on white stationery"
 * 
 * Usage:
 * ```tsx
 * import Layout from '@/components/Layout';
 * 
 * export default function Page() {
 *   return (
 *     <Layout>
 *       <YourContent />
 *     </Layout>
 *   );
 * }
 * ```
 */

import React from 'react';
import dynamic from 'next/dynamic';
import '@/app/prism-design-system.css';

const Navbar = dynamic(() => import('./Navbar'), { ssr: false });
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  hideNavbar?: boolean;
  hideFooter?: boolean;
  transparentNavbar?: boolean;
}

export default function Layout({
  children,
  className = '',
  fullWidth = false,
  hideNavbar = false,
  hideFooter = false,
  transparentNavbar = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-prism-canvas text-prism-ink flex flex-col">
      {/* Prism Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-prism-canvas" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.01)_0%,transparent_60%)]" />
      </div>

      {/* Navigation */}
      {!hideNavbar && <Navbar transparent={transparentNavbar} />}

      {/* Main Content */}
      <main className={`flex-1 relative z-10 ${className}`}>
        {fullWidth ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}

/**
 * Alternative layout variant for centered content (auth pages, etc.)
 */
export function CenteredLayout({
  children,
  className = '',
  hideNavbar = false,
  hideFooter = false,
}: Omit<LayoutProps, 'fullWidth'>) {
  return (
    <div className="min-h-screen bg-prism-canvas text-prism-ink flex flex-col relative">
      {/* Prism Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-prism-canvas" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
      </div>

      {!hideNavbar && <Navbar />}

      <main className={`flex-1 flex items-center justify-center p-4 relative z-10 ${className}`}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

/**
 * Dashboard layout variant with sidebar support
 */
export function DashboardLayout({
  children,
  className = '',
  sidebar,
}: {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-prism-canvas text-prism-ink flex flex-col relative">
      {/* Prism Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-prism-canvas" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
      </div>

      <Navbar />

      <div className="flex-1 flex relative z-10">
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-prism-pebble bg-prism-fog">
            {sidebar}
          </aside>
        )}

        <main className={`flex-1 ${className}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
