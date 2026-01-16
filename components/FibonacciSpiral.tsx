'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Fibonacci Spiral background component
 */
export default function FibonacciSpiral() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />

            {/* Animated circles representing Fibonacci spiral */}
            {[1, 2, 3, 5, 8, 13, 21].map((size, index) => (
                <motion.div
                    key={size}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: 0.1 + (index * 0.02),
                        scale: 1,
                        rotate: 360
                    }}
                    transition={{
                        duration: 20 + (index * 10),
                        repeat: Infinity,
                        ease: 'linear',
                        delay: index * 0.5
                    }}
                    className="absolute rounded-full border border-blue-500/20"
                    style={{
                        width: `${size * 50}px`,
                        height: `${size * 50}px`,
                        left: `calc(50% - ${(size * 50) / 2}px)`,
                        top: `calc(50% - ${(size * 50) / 2}px)`,
                    }}
                />
            ))}

            {/* Floating particles */}
            {Array.from({ length: 20 }).map((_, index) => (
                <motion.div
                    key={`particle-${index}`}
                    initial={{
                        opacity: 0,
                        x: Math.random() * window?.innerWidth || 1000,
                        y: Math.random() * window?.innerHeight || 800
                    }}
                    animate={{
                        opacity: [0, 0.3, 0],
                        y: [
                            Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                            Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) - 200
                        ]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                    }}
                />
            ))}

            {/* Glowing center orb */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-radial from-blue-500/30 to-transparent blur-xl"
            />
        </div>
    );
}
