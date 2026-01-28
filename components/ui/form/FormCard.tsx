/**
 * FormCard Component
 * Styled container for form sections
 */

import { FormCardProps } from './types';

const variants = {
  default: 'bg-[#241F1C] border-[#C4B8AD]/10',
  highlighted: 'bg-[#E8A849]/5 border-[#E8A849]/30',
  subtle: 'bg-[#2E2724] border-transparent',
};

export function FormCard({ children, className = '', variant = 'default' }: FormCardProps) {
  return (
    <div className={`rounded-xl p-6 border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
