'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { LifeEvent, TimeOffsetConfig } from '@/lib/types';

const Step3LifeEvents = dynamic(() => import('@/components/rectify/Step3LifeEvents'), {
    loading: () => <div className="animate-pulse bg-[#FAFAFA] h-96 rounded-xl" />,
    ssr: false
});

interface LifeEventsEditorProps {
    lifeEvents: LifeEvent[];
    offsetConfig: TimeOffsetConfig;
    onUpdateEvents: (events: LifeEvent[]) => void;
}

export default function LifeEventsEditor({
    lifeEvents,
    offsetConfig,
    onUpdateEvents,
}: LifeEventsEditorProps) {
    return (
        <Step3LifeEvents
            lifeEvents={lifeEvents}
            updateEvents={onUpdateEvents}
            offsetConfig={offsetConfig}
        />
    );
}
