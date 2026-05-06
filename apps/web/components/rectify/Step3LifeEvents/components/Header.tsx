import React from 'react';
import { motion } from 'framer-motion';

export function Header() {
    return (
        <>
            {/* Security Badge - Top of Form */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-xs text-[#184131] bg-[#184131]/5 py-2.5 px-4 rounded-full border border-[#184131]/10"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">🔐 End-to-End Encrypted</span>
                <span className="text-[#184131]/60">•</span>
                <span className="text-[#636363]">Nobody can read your data except you</span>
            </motion.div>

            {/* Header - Centered */}
            <div className="text-center my-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffffff] to-white border border-[rgba(0,0,0,0.08)] rounded-full text-xs mb-6 shadow-sm"
                >
                    <span className="text-[#000000] font-medium tracking-wider">STEP 4 OF 5</span>
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className=" text-3xl sm:text-4xl font-medium text-[#000000] leading-tight mb-2">
                    Life <span className="text-[#000000]">Events</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-[#636363]">
                    Add events for birth time rectification
                </motion.p>
            </div>
        </>
    );
}
