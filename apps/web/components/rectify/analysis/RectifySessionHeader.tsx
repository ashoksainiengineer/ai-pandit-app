'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Home,
    LayoutDashboard,
    Activity,
    Clock,
    XCircle,
    Calendar,
    MapPin,
    Timer,
} from 'lucide-react';
import type { StreamMetadata } from '@/lib/store/stream-types';

const THEME = {
    bg: '#FFFCF8',
    surface: '#FFFFFF',
    border: '#F0E8DE',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    gold: '#B8860B',
    success: '#184131',
    error: '#C65D3B',
};

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

const Breadcrumbs = memo(function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex items-center gap-2 text-xs text-[#7A756F]">
                {items.map((item, index) => (
                    <li key={item.label} className="flex items-center gap-2">
                        {item.href ? (
                            <Link href={item.href} className="flex items-center gap-1.5 hover:text-[#B8860B] transition-colors">
                                {item.icon}{item.label}
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1.5 font-semibold text-[#1A1612]">{item.icon}{item.label}</span>
                        )}
                        {index < items.length - 1 && <span className="opacity-50">/</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
});

interface AnalysisTimerProps {
    startedAt: string | null;
    isComplete: boolean;
    updatedAt?: string;
}

const AnalysisTimer = memo(function AnalysisTimer({ startedAt, isComplete, updatedAt }: AnalysisTimerProps) {
    const [mounted, setMounted] = useState(false);
    const [duration, setDuration] = useState(0);
    const finalDurationRef = useRef<number | null>(null);

    useEffect(() => {
        setMounted(true);
        const effectiveStart = startedAt || updatedAt;
        if (!effectiveStart) return;

        const startDate = new Date(effectiveStart);
        if (isNaN(startDate.getTime())) return;
        const startMs = startDate.getTime();

        if (isComplete) {
            if (finalDurationRef.current === null) {
                finalDurationRef.current = Date.now() - startMs;
            }
            setDuration(finalDurationRef.current);
            return;
        }

        const interval = setInterval(() => setDuration(Date.now() - startMs), 1000);
        setDuration(Date.now() - startMs);
        return () => clearInterval(interval);
    }, [startedAt, updatedAt, isComplete]);

    if (!mounted || (!startedAt && !updatedAt)) {
        return (
            <div className="flex items-center gap-1.5 font-mono text-sm bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                <Clock className="w-3.5 h-3.5 text-[#7A756F]" />
                <span className="text-xs font-semibold">Waiting...</span>
            </div>
        );
    }

    const totalSeconds = Math.max(0, Math.floor(duration / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return (
        <div className="flex items-center gap-1.5 font-mono text-sm bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <Clock className="w-3.5 h-3.5 text-[#7A756F]" />
            <span className="font-semibold">{minutes}:{seconds}</span>
        </div>
    );
});

interface RectifySessionHeaderProps {
    sessionId: string;
    metadata?: StreamMetadata;
    startedAt: string | null;
    isComplete: boolean;
    isCancelling: boolean;
    cancelled: boolean;
    showCancelConfirm: boolean;
    onShowCancelConfirm: (show: boolean) => void;
    onCancel: () => void;
    pageTitleId: string;
}

export const RectifySessionHeader = memo(function RectifySessionHeader({
    sessionId,
    metadata,
    startedAt,
    isComplete,
    isCancelling,
    cancelled,
    showCancelConfirm,
    onShowCancelConfirm,
    onCancel,
    pageTitleId,
}: RectifySessionHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-white/80" style={{ borderColor: THEME.border }} role="banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
                    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                    { label: 'Analysis', icon: <Activity className="w-4 h-4" /> },
                ]} />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                    <div>
                        <h1 id={pageTitleId} className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                            {metadata?.fullName || 'Birth Time Analysis'}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[#7A756F]">
                                {sessionId.slice(0, 8)}
                            </span>
                        </h1>

                        {(metadata?.dateOfBirth || metadata?.tentativeTime || metadata?.birthPlace || metadata?.offsetConfig) && (
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#7A756F]">
                                {metadata?.dateOfBirth && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{metadata.dateOfBirth}</span>
                                    </div>
                                )}
                                {metadata?.tentativeTime && (
                                    <div className="flex items-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5" />
                                        <span className="font-mono font-semibold">{metadata.tentativeTime}</span>
                                        {metadata.offsetConfig && (
                                            <span className="text-[#B8860B] font-medium">
                                                ±{metadata.offsetConfig.customMinutes ?? metadata.offsetConfig.minutes ?? 60}min
                                            </span>
                                        )}
                                    </div>
                                )}
                                {metadata?.birthPlace && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{metadata.birthPlace}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <AnalysisTimer startedAt={startedAt || null} updatedAt={metadata?.updatedAt} isComplete={isComplete} />

                        {!isComplete && !cancelled && (
                            <div className="relative">
                                {showCancelConfirm ? (
                                    <div className="flex items-center gap-2">
                                        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">
                                            Confirm
                                        </button>
                                        <button onClick={() => onShowCancelConfirm(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            Keep Running
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onShowCancelConfirm(true)}
                                        disabled={isCancelling}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50 flex items-center gap-1.5"
                                        style={{ borderColor: `${THEME.error}40`, color: THEME.error }}
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> Stop
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});
