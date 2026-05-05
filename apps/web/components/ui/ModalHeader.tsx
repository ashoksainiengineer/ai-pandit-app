'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function ModalHeader({ title, subtitle, icon, onClose, className = '' }: ModalHeaderProps) {
  return (
    <div className={`p-4 border-b border-surface-elevated flex items-center justify-between bg-gradient-to-r from-surface-raised to-white ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          {title && <h2 className="font-semibold text-content-primary text-base">{title}</h2>}
          {subtitle && <p className="text-xs text-content-secondary">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-surface-elevated flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-content-secondary" />
        </button>
      )}
    </div>
  );
}
