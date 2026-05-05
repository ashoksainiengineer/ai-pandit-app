/**
 * FormCard Component
 * Sacred Ivory Light Theme - God Tier Design
 * Styled container for form sections with perfect ratios
 */

import { FormCardProps } from './types';

const variants = {
  default: 'bg-white border-[#F0E8DE]',
  highlighted: 'bg-[#FDF8F3] border-[#78611D]/30',
  subtle: 'bg-[#FAF5EF] border-transparent',
};

export function FormCard({ children, className = '', variant = 'default' }: FormCardProps) {
  return (
    <div className={`rounded-2xl p-6 md:p-8 lg:p-10 border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
