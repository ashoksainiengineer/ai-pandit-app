'use client';

import React from 'react';

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export default function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`p-4 border-t border-surface-elevated bg-surface-raised flex gap-3 ${className}`}>
      {children}
    </div>
  );
}
