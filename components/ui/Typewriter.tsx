'use client';

// components/ui/Typewriter.tsx
// Enhanced Typewriter effect for AI thinking tokens with smooth animation

import { useState, useEffect, useRef, useCallback } from 'react';

interface TypewriterProps {
    content: string;
    speed?: number; // ms per char (base speed)
    onComplete?: () => void;
    className?: string;
}

export function Typewriter({ content, speed = 8, onComplete, className = '' }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const frameRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);

    // Calculate adaptive speed based on content length lag
    const getCharsToAppend = useCallback((lag: number): number => {
        // Smooth adaptive chunking - larger lag = more chars at once
        if (lag > 1000) return 80;  // Very far behind - catch up fast
        if (lag > 500) return 40;
        if (lag > 200) return 20;
        if (lag > 100) return 10;
        if (lag > 50) return 5;
        if (lag > 20) return 3;
        return 1;  // Normal typing speed
    }, []);

    useEffect(() => {
        // If content shortened (reset case), reset display
        if (content.length < displayedText.length) {
            setDisplayedText('');
            indexRef.current = 0;
        }

        const animate = (timestamp: number) => {
            // Throttle updates for smooth performance
            const elapsed = timestamp - lastTimeRef.current;
            const minInterval = speed;

            if (elapsed < minInterval) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            lastTimeRef.current = timestamp;

            if (indexRef.current < content.length) {
                const lag = content.length - indexRef.current;
                const charsToAppend = getCharsToAppend(lag);

                // Get next chunk of text
                const nextChunk = content.substring(
                    indexRef.current,
                    Math.min(indexRef.current + charsToAppend, content.length)
                );

                // Append smoothly
                setDisplayedText(prev => prev + nextChunk);
                indexRef.current += nextChunk.length;

                // Continue animation
                frameRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete
                if (onComplete) onComplete();
            }
        };

        // Start animation if we have content to show
        if (indexRef.current < content.length && !frameRef.current) {
            frameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };
    }, [content, speed, onComplete, getCharsToAppend, displayedText.length]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    return (
        <span className={`whitespace-pre-wrap ${className}`}>
            {displayedText}
        </span>
    );
}

// Simplified variant for minimal overhead
export function TypewriterLite({ text, delay = 5 }: { text: string; delay?: number }) {
    const [displayed, setDisplayed] = useState('');
    const indexRef = useRef(0);

    useEffect(() => {
        if (text.length <= displayed.length) return;

        const timer = setInterval(() => {
            if (indexRef.current < text.length) {
                const lag = text.length - indexRef.current;
                const chunk = lag > 100 ? 20 : lag > 50 ? 5 : 1;
                setDisplayed(prev => prev + text.substring(indexRef.current, indexRef.current + chunk));
                indexRef.current += chunk;
            } else {
                clearInterval(timer);
            }
        }, delay);

        return () => clearInterval(timer);
    }, [text, delay, displayed.length]);

    useEffect(() => {
        if (text.length < displayed.length) {
            setDisplayed('');
            indexRef.current = 0;
        }
    }, [text, displayed.length]);

    return <span className="whitespace-pre-wrap">{displayed}</span>;
}
