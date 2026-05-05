import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    isVisible: boolean;
}

export function EmptyState({ isVisible }: EmptyStateProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-2 border-[#F0E8DE] p-12 text-center"
        >
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612] mb-2">
                Your timeline starts here
            </h3>
            <p className="text-[#5A554F] text-sm">Search or browse categories above to add your first event</p>
        </motion.div>
    );
}
