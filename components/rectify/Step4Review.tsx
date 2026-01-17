'use client';

import { BirthData, PhysicalTraits, LifeEvent } from '@/lib/types';

interface Step4Props {
    data: BirthData;
    events: LifeEvent[];
    traits: PhysicalTraits;
    onSubmit: () => void;
    isSubmitting: boolean;
    onEdit: (step: number) => void;
}

export default function Step4Review({ data, events, traits, onSubmit, isSubmitting, onEdit }: Step4Props) {
    return (
        <div className="animate-fade-in-up space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Review Your Details</h2>
                <p className="text-[#C4B8AD]">
                    Verify everything before we begin the calculation. Precision matters.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="glass-card p-6 border border-[#2D7A5C]/30 relative group">
                    <button
                        onClick={() => onEdit(1)}
                        className="absolute top-4 right-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                    >
                        Edit
                    </button>
                    <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 border-b border-[#2D7A5C]/30 pb-2">
                        Basic Information
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Name</span>
                            <span className="text-[#C4B8AD]">{data.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Birth Date</span>
                            <span className="text-[#C4B8AD]">{data.dateOfBirth}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Tentative Time</span>
                            <span className="text-[#C4B8AD] font-mono">{data.tentativeTime}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Place</span>
                            <span className="text-[#C4B8AD] text-right">{data.birthPlace}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Gender</span>
                            <span className="text-[#C4B8AD] capitalize">{data.gender}</span>
                        </div>
                    </div>
                </div>

                {/* Physical Traits */}
                <div className="glass-card p-6 border border-[#8B5CF6]/30 relative group">
                    <button
                        onClick={() => onEdit(3)}
                        className="absolute top-4 right-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                    >
                        Edit
                    </button>
                    <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 border-b border-[#8B5CF6]/30 pb-2">
                        Physical Traits
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Height</span>
                            <span className="text-[#C4B8AD]">
                                {traits.height?.feet}' {traits.height?.inches}" ({traits.height?.cm} cm)
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Build</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.build}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Complexion</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.complexion?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Face Shape</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.faceShape}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Hair / Eyes</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.hairColor} / {traits.eyeColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Life Events Summary */}
            <div className="glass-card p-6 border border-[#D4AF37]/30 relative group">
                <button
                    onClick={() => onEdit(2)}
                    className="absolute top-4 right-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                >
                    Edit
                </button>
                <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 border-b border-[#D4AF37]/30 pb-2">
                    Life Events Timeline ({events.length})
                </h3>
                <div className="space-y-4">
                    {events.map((e, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-[#0F1419]/50">
                            <span className="text-xl">{e.icon || '📅'}</span>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-[#F5F0EB]">{e.eventType}</span>
                                    <span className="text-[#D4AF37] bg-[#D4AF37]/10 px-2 rounded-full text-xs">
                                        {e.datePrecision?.includes('range')
                                            ? `${e.eventDate} → ${e.endDate}`
                                            : e.eventDate}
                                    </span>
                                </div>
                                {e.description && (
                                    <p className="text-[#8C7F72] mt-1 italic line-clamp-1">{e.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agreement & Submit */}
            <div className="mt-8 pt-8 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-[#D4AF37]/50 bg-[#2A3442] text-[#D4AF37] focus:ring-[#D4AF37]/50" />
                    <span className="text-[#C4B8AD] text-sm group-hover:text-[#F5F0EB] transition-colors">
                        I confirm that the birth details provided are accurate to the best of my knowledge.
                        I understand that incorrect data will lead to incorrect rectification.
                    </span>
                </label>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0F1419] font-bold rounded-xl text-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Processing...
                            </span>
                        ) : (
                            'Start Rectification Analysis'
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-[#8C7F72] mt-4">
                    Takes approx 2-3 minutes • AI-Powered Vedic Analysis
                </p>
            </div>
        </div>
    );
}
