import { useState, useCallback } from 'react';
import { logger } from '@/lib/secure-logger';
import { TabType } from '../types';
import { sanitizeHtml } from '../utils';

export function useResultsPage(onNewAnalysis: () => void) {
    const [selectedTab, setSelectedTab] = useState<TabType>('top');
    const [isLoading, setIsLoading] = useState(false);

    // Handle new analysis with loading state
    const handleNewAnalysis = useCallback(() => {
        setIsLoading(true);
        try {
            onNewAnalysis();
        } catch (error) {
            logger.error('Failed to start new analysis:', error);
            setIsLoading(false);
        }
    }, [onNewAnalysis]);

    // Extract section helper
    const extractSection = useCallback((text: string | undefined, section: string): string => {
        if (!text) return 'Analysis pending...';
        const regex = new RegExp(`${section}[^:]*:([^]*?)(?=\n\n|\n[A-Z]|$)`, 'i');
        const match = text.match(regex);
        return match ? sanitizeHtml(match[1].trim().substring(0, 200)) : 'Analysis pending...';
    }, []);

    return {
        selectedTab,
        setSelectedTab,
        isLoading,
        handleNewAnalysis,
        extractSection
    };
}
