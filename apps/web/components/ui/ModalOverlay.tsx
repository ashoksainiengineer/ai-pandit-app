'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModalOverlayProps {
  onClose?: () => void;
  children: React.ReactNode;
}

export default function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </motion.div>
  );
}
