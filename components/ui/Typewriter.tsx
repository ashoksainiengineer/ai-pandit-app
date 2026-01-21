'use client';

import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
    content: string;
    speed?: number; // ms per char
    onComplete?: () => void;
}

export function Typewriter({ content, speed = 10, onComplete }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset if content changes SIGNIFICANTLY (e.g. new stage), but usually we append
    // This handling is tricky if content is appended. We want to continue from current index.

    useEffect(() => {
        // If content is shorter than displayed (reset), reset index
        if (content.length < displayedText.length) {
            setDisplayedText('');
            indexRef.current = 0;
        }

        const animate = () => {
            if (indexRef.current < content.length) {
                // If we are lagging far behind (e.g. > 100 chars), catch up faster
                const lag = content.length - indexRef.current;
                const charsToAppend = lag > 100 ? 10 : lag > 30 ? 3 : 1;

                const nextChunk = content.substring(indexRef.current, indexRef.current + charsToAppend);
                setDisplayedText((prev) => prev + nextChunk);
                indexRef.current += charsToAppend;

                timeoutRef.current = setTimeout(animate, lag > 100 ? 0 : speed);
            } else {
                if (onComplete) onComplete();
            }
        };

        // Start animation if not running
        if (!timeoutRef.current && indexRef.current < content.length) {
            animate();
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [content, speed, onComplete, displayedText.length]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return <span className="whitespace-pre-wrap">{displayedText}</span>;
}
