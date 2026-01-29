/**
 * FormCard Component
 * Styled container for form sections - Unified Design System
 */

import { FormCardProps } from './types';

const variants = {
  default: 'bg-[#1A1F2E] border-[#2A3442]',
  highlighted: 'bg-[#D4AF37]/5 border-[#D4AF37]/30',
  subtle: 'bg-[#0F1419] border-transparent',
};

export function FormCard({ children, className = '', variant = 'default' }: FormCardProps) {
  return (
    <div className={`rounded-xl p-6 border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
