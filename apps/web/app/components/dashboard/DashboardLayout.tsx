/**
 * DashboardLayout Component
 * Main layout structure for dashboard pages with sidebar and header
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Readings', href: '/admin/readings', icon: Activity },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FFFCF8] flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#F0E8DE] transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#F0E8DE]">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#78611D] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612]">
              AI Pandit
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#B8860B]/10 text-[#B8860B]'
                    : 'text-[#4A453F] hover:bg-[#FDF8F3] hover:text-[#1A1612]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B8860B]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#F0E8DE]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FDF8F3]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8860B] to-[#78611D] flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1612] truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-[#7A756F] truncate">
                {user?.email || 'admin@aipandit.com'}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-[#F0E8DE]/50 text-[#7A756F] hover:text-[#1A1612] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#F0E8DE] flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#FDF8F3] text-[#4A453F]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-2 text-sm">
              <Link href="/admin/dashboard" className="text-[#7A756F] hover:text-[#1A1612]">
                Dashboard
              </Link>
              {pathname !== '/admin/dashboard' && pathname !== '/admin' && (
                <>
                  <ChevronRight className="w-4 h-4 text-[#D0CBC5]" />
                  <span className="text-[#1A1612] font-medium capitalize">
                    {pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-[#FDF8F3] text-[#4A453F] transition-colors">
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
