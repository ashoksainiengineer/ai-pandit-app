'use client';

import Layout from '@/components/Layout';

export function DashboardSkeleton() {
  return (
    <Layout hideNavbar hideFooter>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-10 bg-black/5 rounded-xl animate-pulse w-48" />
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="h-10 bg-black/5 rounded-xl animate-pulse w-64 mb-4" />
          <div className="h-5 bg-black/5 rounded-xl animate-pulse w-96" />
        </div>
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-black/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-black/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-black/5 rounded-2xl animate-pulse" />
            <div className="h-48 bg-black/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
