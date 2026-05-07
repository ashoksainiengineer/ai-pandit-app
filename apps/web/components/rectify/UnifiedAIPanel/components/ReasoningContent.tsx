import React, { memo, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { highlightKeywords } from '@/lib/keyword-highlighter';

export const ReasoningContent = memo(function ReasoningContent({
    content,
    isActive,
}: {
    content: string;
    isActive: boolean;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current && isActive) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content, isActive]);

    const highlightedContent = useMemo(() => {
        const sanitizedContent = sanitizeAIContent(content);
        const trimmedContent = sanitizedContent.length > 50000 ? sanitizedContent.slice(-50000) : sanitizedContent;
        return highlightKeywords(trimmedContent);
    }, [content]);

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-[#000000]/5 flex items-center justify-center mb-4"
                >
                    <Brain className="w-8 h-8 text-black/40" />
                </motion.div>
                <p className="text-sm text-black/60">
                    Waiting for AI reasoning stream...
                </p>
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className="p-5 overflow-y-auto max-h-[400px] font-mono text-sm text-black/60 leading-7 style-scroll"
        >
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-black/60 leading-7">
                {highlightedContent}
                {isActive && (
                    <span className="inline-block w-1.5 h-4 bg-[#000000] animate-pulse ml-0.5 align-middle" />
                )}
            </pre>
        </div>
    );
});
