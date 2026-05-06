'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Gem, AlertCircle, RefreshCw } from 'lucide-react';

export const RectifyEmptyState = memo(function RectifyEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f8f8] text-center p-4" role="status" aria-live="polite">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} aria-hidden="true">
                <Gem className="w-16 h-16 text-[#000000]" />
            </motion.div>
            <h1 className="text-2xl font-medium mt-6 text-[#000000]">Starting Analysis...</h1>
            <p className="text-lg text-[#636363] mt-2">Establishing secure connection...</p>
        </div>
    );
});

interface RectifyErrorStateProps {
    error: string;
    onRetry: () => void;
}

export const RectifyErrorState = memo(function RectifyErrorState({ error, onRetry }: RectifyErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f8f8] text-center p-4" role="alert">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-medium mt-6 text-red-700">Connection Error</h1>
            <p className="text-xs text-red-600 mt-2 max-w-2xl bg-red-50 p-4 rounded border border-red-200">{error}</p>
            <button
                onClick={onRetry}
                className="mt-8 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-[#000000] to-[#000000] shadow-md flex items-center gap-2 hover:shadow-lg transition-all"
            >
                <RefreshCw className="w-4 h-4" /> Retry
            </button>
        </div>
    );
});
