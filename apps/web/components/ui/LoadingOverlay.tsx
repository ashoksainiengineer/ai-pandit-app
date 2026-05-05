'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export const LoadingOverlay = memo(function LoadingOverlay({ isVisible, message = 'Processing...' }: LoadingOverlayProps) {
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md"
                >
                    <div className="relative flex flex-col items-center">
                        {/* Animated Background Glow */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute w-48 h-48 bg-[#B8860B]/20 rounded-full blur-3xl pointer-events-none"
                        />

                        <div className="relative bg-white border border-[#F0E8DE] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
                            {/* Sacred Ivory Ornament Ornament */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFFCF8] to-[#F5EFE7] border border-[#F0E8DE] flex items-center justify-center shadow-inner relative overflow-hidden">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#B8860B_0%,_transparent_70%)]"
                                />
                                <Loader2 className="w-8 h-8 text-[#B8860B] animate-spin" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-[#1A1612] font-[family-name:var(--font-cormorant)] flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#B8860B]" />
                                    {message}
                                </h3>
                                <p className="text-sm text-[#7A756F]">
                                    Navigating the divine alignment for you...
                                </p>
                            </div>

                            {/* Progress dots */}
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 1, 0.3],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                        className="w-2 h-2 rounded-full bg-[#B8860B]"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
