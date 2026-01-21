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
                // If we are lagging far behind, catch up MUCH faster
                const lag = content.length - indexRef.current;

                // Adaptive chunking based on lag severity
                let charsToAppend = 1;
                if (lag > 200) charsToAppend = 20;
                else if (lag > 100) charsToAppend = 10;
                else if (lag > 50) charsToAppend = 5;
                else if (lag > 20) charsToAppend = 2;

                const nextChunk = content.substring(indexRef.current, indexRef.current + charsToAppend);
                setDisplayedText((prev) => prev + nextChunk);
                indexRef.current += charsToAppend;

                // Remove artificial delay if lag is significant
                timeoutRef.current = setTimeout(animate, lag > 50 ? 0 : speed);
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
