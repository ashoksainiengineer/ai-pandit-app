/**
 * FormField Component
 * Wrapper for form inputs with label and error handling
 */

import { ReactNode } from 'react';
import { FormLabel } from './FormLabel';
import { FormError } from './FormError';
import { FormFieldProps } from './types';

export function FormField({
  label,
  children,
  error,
  required,
  description,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <FormLabel required={required}>{label}</FormLabel>
      {description && (
        <p className="text-xs text-[#8C7F72] -mt-1 mb-2">{description}</p>
      )}
      {children}
      <FormError message={error} />
    </div>
  );
}
