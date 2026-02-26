/**
 * SecurityBadge - End-to-End Encryption Badge Component
 * Displays technical security information across the application
 * Sacred Ivory Light Theme
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, EyeOff, Server, Key } from 'lucide-react';
import { useState } from 'react';

interface SecurityBadgeProps {
  variant?: 'compact' | 'detailed' | 'inline' | 'footer';
  showTooltip?: boolean;
  className?: string;
}

const SECURITY_DETAILS = {
  encryption: "AES-256-GCM encryption with unique keys per session",
  storage: "Your data is encrypted before leaving your browser",
  access: "Only you can decrypt your data with your session key",
  server: "Our servers only store encrypted ciphertext - zero plaintext",
  transmission: "TLS 1.3 for all data transmission",
  keyManagement: "Session keys are never stored on our servers"
};

export function SecurityBadge({ 
  variant = 'compact', 
  showTooltip = true,
  className = '' 
}: SecurityBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compact variant - used at top of forms
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-center gap-2 text-xs text-[#184131] bg-[#184131]/5 py-2.5 px-4 rounded-full border border-[#184131]/10 ${className}`}
      >
        <Lock className="w-4 h-4" />
        <span className="font-medium">🔐 End-to-End Encrypted</span>
        <span className="text-[#184131]/60">•</span>
        <span className="text-[#7A756F]">Nobody can read your data except you</span>
      </motion.div>
    );
  }

  // Detailed variant - expanded with technical info
  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-[#184131]/5 to-[#184131]/10 rounded-xl border border-[#184131]/20 overflow-hidden ${className}`}
      >
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#184131]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#184131]/10">
              <Shield className="w-5 h-5 text-[#184131]" />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1A1612]">🔐 End-to-End Encrypted</div>
              <div className="text-xs text-[#7A756F]">Nobody can read your data except you</div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-[#7A756F]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {/* Expanded technical details */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#184131]/10"
          >
            <div className="p-4 space-y-3">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-[#184131] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#1A1612]">{SECURITY_DETAILS.encryption}</div>
                    <div className="text-[10px] text-[#7A756F]">Military-grade encryption standard</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <EyeOff className="w-4 h-4 text-[#184131] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#1A1612]">{SECURITY_DETAILS.access}</div>
                    <div className="text-[10px] text-[#7A756F]">Not even our administrators can view your data</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Server className="w-4 h-4 text-[#184131] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#1A1612]">{SECURITY_DETAILS.server}</div>
                    <div className="text-[10px] text-[#7A756F]">Encrypted at rest with unique keys</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Key className="w-4 h-4 text-[#184131] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#1A1612]">{SECURITY_DETAILS.keyManagement}</div>
                    <div className="text-[10px] text-[#7A756F]">Ephemeral keys generated in your browser</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#184131]/10">
                <p className="text-[10px] text-[#7A756F] text-center">
                  🔒 Your sacred astrological data remains private and secure
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Inline variant - for forms and cards
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-[10px] text-[#184131] ${className}`}>
        <Lock className="w-3 h-3" />
        <span>End-to-end encrypted • Only you can read this</span>
      </div>
    );
  }

  // Footer variant - for bottom of forms
  if (variant === 'footer') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-center gap-2 py-3 text-xs text-[#7A756F] ${className}`}
      >
        <Shield className="w-3.5 h-3.5 text-[#184131]" />
        <span>🔐 End-to-End Encrypted • Nobody except you can access this data</span>
      </motion.div>
    );
  }

  return null;
}

// Export individual elements for custom compositions
export function EncryptionLockIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#184131]/10 ${className}`}>
      <Lock className="w-3 h-3 text-[#184131]" />
    </div>
  );
}

export function SecurityTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1A1612] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        🔐 End-to-end encrypted • Only you can read this
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1612]" />
      </div>
    </div>
  );
}

export default SecurityBadge;
