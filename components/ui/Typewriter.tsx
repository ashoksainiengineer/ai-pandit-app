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
                // Add next character
                const nextChar = content.charAt(indexRef.current);
                setDisplayedText((prev) => prev + nextChar);
                indexRef.current++;

                // Variable speed to mimic human typing slightly? 
                // No, sticking to constant for smoothness as requested "robot typewriter"
                timeoutRef.current = setTimeout(animate, speed);
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
