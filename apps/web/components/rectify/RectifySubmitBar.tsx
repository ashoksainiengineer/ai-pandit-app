'use client';

import React from 'react';

interface RectifySubmitBarProps {
    step: number;
    totalSteps: number;
    isSubmitting: boolean;
    error: string | null;
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export default function RectifySubmitBar({
    step,
    totalSteps,
    isSubmitting,
    error,
    onBack,
    onNext,
    onSubmit,
}: RectifySubmitBarProps) {
    return (
        <>
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[rgba(0,0,0,0.08)]">
                <button
                    onClick={onBack}
                    disabled={step === 1}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${step === 1 ? 'opacity-0' : 'border-2 border-[#000000]/50 text-[#000000] hover:bg-[#000000]/10'}`}
                >
                    ← Back
                </button>
                {step < totalSteps ? (
                    <button
                        onClick={onNext}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#000000] to-[#000000] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                        Next Step →
                    </button>
                ) : (
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#184131] to-[#2d6b4f] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Start Analysis'
                        )}
                    </button>
                )}
            </div>
        </>
    );
}
