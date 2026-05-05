/**
 * Not Found Page (404)
 * Custom error page for unmatched routes
 * Follows Sacred Ivory design system
 */

import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Home, 
  Search, 
  ArrowRight, 
  Compass,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found | AI Pandit',
  description: 'The page you are looking for could not be found. Navigate back to AI Pandit birth time rectification.',
};

/**
 * Navigation link configuration for 404 page
 */
const navigationLinks = [
  {
    href: '/',
    label: 'Return Home',
    description: 'Back to landing page',
    icon: Home,
    variant: 'primary' as const,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'View your analyses',
    icon: LayoutDashboard,
    variant: 'secondary' as const,
  },
  {
    href: '/rectify',
    label: 'Start Analysis',
    description: 'Begin new BTR session',
    icon: Sparkles,
    variant: 'secondary' as const,
  },
];

/**
 * SVG Illustration component for 404 page
 * Represents a lost compass/astrological theme
 */
function NotFoundIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8">
      {/* Outer ring */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full animate-spin"
        style={{ animationDuration: '20s' }}
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#F0E8DE"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
      
      {/* Inner compass */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FDF8F3] to-white border-2 border-[#F0E8DE] flex items-center justify-center shadow-lg">
          <Compass className="w-16 h-16 text-[#B8860B]" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Decorative dots */}
      <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#78611D]/30" />
      <div className="absolute bottom-8 left-6 w-2 h-2 rounded-full bg-[#6B1F7A]/20" />
      <div className="absolute top-1/2 -right-2 w-2 h-2 rounded-full bg-[#184131]/20" />
    </div>
  );
}

/**
 * Primary CTA Link component
 */
interface CTALinkProps {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary';
}

function CTALink({ href, label, description, icon: Icon, variant }: CTALinkProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
        ${isPrimary 
          ? 'bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white border-transparent shadow-lg shadow-[#B8860B]/20 hover:shadow-xl hover:shadow-[#B8860B]/30 hover:-translate-y-0.5' 
          : 'bg-white border-[#F0E8DE] hover:border-[#78611D]/50 hover:bg-[#FDF8F3]'
        }
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center transition-colors
        ${isPrimary ? 'bg-white/20' : 'bg-[#FDF8F3] group-hover:bg-white'}
      `}>
        <Icon className={`w-6 h-6 ${isPrimary ? 'text-white' : 'text-[#B8860B]'}`} />
      </div>
      
      <div className="flex-1">
        <div className={`font-semibold ${isPrimary ? 'text-white' : 'text-[#1A1612]'}`}>
          {label}
        </div>
        <div className={`text-sm ${isPrimary ? 'text-white/80' : 'text-[#5A554F]'}`}>
          {description}
        </div>
      </div>
      
      <ArrowRight className={`
        w-5 h-5 transition-transform group-hover:translate-x-1
        ${isPrimary ? 'text-white/80' : 'text-[#B8860B]'}
      `} />
    </Link>
  );
}

/**
 * Search suggestion component
 * Provides quick links to common destinations
 */
function SearchSuggestions() {
  const suggestions = [
    { label: 'Birth Time Rectification', href: '/rectify' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-[#F0E8DE]">
      <div className="flex items-center gap-2 text-[#5A554F] mb-4">
        <Search className="w-4 h-4" />
        <span className="text-sm">Popular pages</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Link
            key={suggestion.href}
            href={suggestion.href}
            className="px-4 py-2 text-sm text-[#4A453F] bg-white border border-[#F0E8DE] rounded-full hover:border-[#78611D]/50 hover:text-[#B8860B] transition-colors"
          >
            {suggestion.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Main 404 Page Component
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        {/* Illustration */}
        <NotFoundIllustration />
        
        {/* Error Code */}
        <div className="text-center mb-2">
          <span className="text-8xl font-bold text-[#F0E8DE] font-[family-name:var(--font-cormorant)] select-none">
            404
          </span>
        </div>
        
        {/* Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1612] font-[family-name:var(--font-cormorant)] mb-2">
            Page Not Found
          </h1>
          <p className="text-[#5A554F]">
            The page you are looking for seems to have wandered into another constellation.
          </p>
        </div>
        
        {/* Navigation Options */}
        <div className="space-y-3">
          {navigationLinks.map((link) => (
            <CTALink key={link.href} {...link} />
          ))}
        </div>
        
        {/* Search Suggestions */}
        <SearchSuggestions />
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#8A857F]">
            If you believe this is an error, please contact{' '}
            <a 
              href="mailto:support@aipandit.app" 
              className="text-[#B8860B] hover:underline"
            >
              support@aipandit.app
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
