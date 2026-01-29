/**
 * AI Pandit - Shared Layout Component
 * Consistent page wrapper with navbar, footer, and max-width container
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
import Navbar from './Navbar';
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
    <div className="min-h-screen bg-[#0A0F1C] text-[#F5F0EB] flex flex-col">
      {/* Navigation */}
      {!hideNavbar && <Navbar transparent={transparentNavbar} />}

      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
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
    <div className="min-h-screen bg-[#0A0F1C] text-[#F5F0EB] flex flex-col">
      {!hideNavbar && <Navbar />}
      
      <main className={`flex-1 flex items-center justify-center p-4 ${className}`}>
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
    <div className="min-h-screen bg-[#0A0F1C] text-[#F5F0EB] flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-[#2A3442] bg-[#0F1419]">
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
