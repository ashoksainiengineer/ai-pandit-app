/**
 * FormLabel Component
 * Accessible label with required indicator
 */

import { ReactNode } from 'react';

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function FormLabel({ children, htmlFor, required, className = '' }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-[#C4B8AD] mb-2 ${className}`}
    >
      {children}
      {required && <span className="text-[#EF4444] ml-1">*</span>}
    </label>
  );
}
