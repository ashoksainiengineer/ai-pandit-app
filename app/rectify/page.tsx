/**
 * Birth Time Rectification Page
 * Unified dark theme with consistent design system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig, SpouseData, ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
import Step4Review from '@/components/rectify/Step4Review';
import Layout from '@/components/Layout';

// Initial States
const initialBirthData: BirthData = {
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5,
    gender: 'male'
};

const initialForensicTraits: ForensicTraits = {
    physical: {
        facialStructure: { forehead: '', eyeShape: '', noseType: '', teethAlignment: '', voicePitch: '' },
        skinHair: { texture: '', hairType: '', complexion: '', marks: [] },
        build: '',
        height: { cm: 0, feet: 0, inches: 0 }
    },
    psychographic: {
        speechStyle: '',
        decisionMaking: '',
        stressResponse: '',
        sleepCycle: '',
        temperament: ''
    },
    biological: {
        prakriti: '',
        sensitivity: { heat: '', cold: '' },
        recurringHealthIssues: []
    },
    family: {
        siblingPosition: '',
        brotherCount: 0,
        sisterCount: 0,
        fatherStatusAtBirth: '',
        motherHealthAtBirth: ''
    }
};

const initialSpouseData: SpouseData = {
    dateOfBirth: '',
    birthTime: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5
};

export default function RectifyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [birthData, setBirthData] = useState<BirthData>(initialBirthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [forensicTraits, setForensicTraits] = useState<ForensicTraits>(initialForensicTraits);
    const [spouseData, setSpouseData] = useState<SpouseData>(initialSpouseData);
    const [offsetConfig, setOffsetConfig] = useState<TimeOffsetConfig>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
    const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Save draft to cloud
    const saveDraftToCloud = async () => {
        if (!birthData.fullName) return;
        setCloudSaveStatus('saving');
        try {
            const res = await fetch('/api/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    forensicTraits,
                    spouseData: spouseData.dateOfBirth ? spouseData : undefined,
                    offsetConfig,
                    sessionId: draftSessionId,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setDraftSessionId(result.sessionId);
                setCloudSaveStatus('saved');
                localStorage.setItem('btr_draft_id', result.sessionId);
            } else {
                setCloudSaveStatus('error');
            }
        } catch (err) {
            setCloudSaveStatus('error');
        }
    };

    // Load from local storage on mount
    useEffect(() => {
        const pingWarmup = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                fetch(`${backendUrl}/api/warmup`).catch(() => { });
            } catch (e) { }
        };
        pingWarmup();

        const saved = localStorage.getItem('btr_form_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.birthData) setBirthData(parsed.birthData);
                if (parsed.lifeEvents) setLifeEvents(parsed.lifeEvents);
                if (parsed.forensicTraits) {
                    const merged = {
                        ...initialForensicTraits,
                        ...parsed.forensicTraits,
                        physical: { ...initialForensicTraits.physical, ...parsed.forensicTraits.physical },
                        psychographic: { ...initialForensicTraits.psychographic, ...parsed.forensicTraits.psychographic },
                        biological: { ...initialForensicTraits.biological, ...parsed.forensicTraits.biological },
                        family: { ...initialForensicTraits.family, ...parsed.forensicTraits.family }
                    };
                    setForensicTraits(merged);
                }
                if (parsed.spouseData) setSpouseData(parsed.spouseData);
                if (parsed.offsetConfig) setOffsetConfig(parsed.offsetConfig);
                if (parsed.step) setStep(parsed.step);
            } catch (e) {
                console.error('Failed to restore form data', e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        const dataToSave = { birthData, lifeEvents, forensicTraits, offsetConfig, step, spouseData };
        localStorage.setItem('btr_form_data', JSON.stringify(dataToSave));
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, step]);

    const handleNext = () => {
        if (isSubmitting) return;
        setError(null);
        if (validateStep(step)) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setError(null);
        setStep(s => s - 1);
        window.scrollTo(0, 0);
    };

    const validateStep = (currentStep: number): boolean => {
        const missingFields: string[] = [];
        
        switch (currentStep) {
            case 1:
                if (!birthData.fullName?.trim()) missingFields.push("Full Name");
                if (!birthData.dateOfBirth) missingFields.push("Date of Birth");
                if (!birthData.tentativeTime) missingFields.push("Tentative Birth Time");
                if (!birthData.birthPlace?.trim()) missingFields.push("Birth Place");
                if (!birthData.gender) missingFields.push("Gender");
                
                if (missingFields.length > 0) {
                    setError(`Please complete: ${missingFields.join(", ")}`);
                    return false;
                }
                return true;
                
            case 2:
                const { physical, psychographic, biological, family } = forensicTraits;
                if (!physical?.facialStructure?.forehead) missingFields.push("Forehead Type");
                if (!physical?.facialStructure?.eyeShape) missingFields.push("Eye Shape");
                if (!physical?.facialStructure?.voicePitch) missingFields.push("Voice Texture");
                if (!biological?.prakriti) missingFields.push("Body Constitution");
                if (!psychographic?.speechStyle) missingFields.push("Speech Style");
                if (!psychographic?.decisionMaking) missingFields.push("Decision Making Style");
                if (!psychographic?.temperament) missingFields.push("Temperament");
                if (!family?.siblingPosition) missingFields.push("Sibling Order");
                if (!family?.fatherStatusAtBirth) missingFields.push("Father's Status at Birth");
                
                if (missingFields.length > 0) {
                    setError(`Forensic markers required: ${missingFields.join(", ")}`);
                    return false;
                }
                return true;
                
            case 3:
                if (lifeEvents.length < 3) {
                    setError(`Minimum 3 life events required. Current: ${lifeEvents.length}`);
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (step !== 4) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                birthData: {
                    fullName: birthData.fullName,
                    dateOfBirth: birthData.dateOfBirth,
                    tentativeTime: birthData.tentativeTime,
                    birthPlace: birthData.birthPlace,
                    latitude: birthData.latitude || 28.6,
                    longitude: birthData.longitude || 77.2,
                    timezone: birthData.timezone,
                    gender: birthData.gender
                },
                lifeEvents: lifeEvents.map(e => ({
                    category: e.category,
                    eventType: e.eventType,
                    datePrecision: e.datePrecision,
                    eventDate: e.eventDate,
                    endDate: e.endDate,
                    description: e.description,
                    importance: e.importance
                })),
                offsetConfig,
                forensicTraits,
                spouseData: spouseData.dateOfBirth ? spouseData : undefined
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const token = await getToken();

            const response = await fetch(`${backendUrl}/api/queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.removeItem('btr_form_data');
                router.push(`/rectify/${result.data.sessionId}`);
            } else {
                setError(result.error || 'Failed to submit analysis');
            }
        } catch (err: any) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepLabels = ['Birth Details', 'Physical', 'Life Events', 'Review'];
    const stepEmojis = ['👤', '🪞', '📅', '✅'];

    return (
        <Layout>
            <div className="pt-24 pb-16">
                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-start justify-between w-full">
                        {[1, 2, 3, 4].map((s) => (
                            <React.Fragment key={s}>
                                <button
                                    onClick={() => setStep(s)}
                                    className="relative z-10 flex flex-col items-center min-w-[80px] outline-none focus:outline-none"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${s < step
                                            ? 'bg-[#2D7A5C] border-[#2D7A5C] text-white'
                                            : s === step
                                                ? 'bg-[#0A0F1C] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                                : 'bg-[#1A1F2E] border-[#2A3442] text-[#5A6475]'
                                            }`}
                                    >
                                        {s < step ? '✓' : stepEmojis[s - 1]}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium whitespace-nowrap ${s === step ? 'text-[#D4AF37]' : 'text-[#5A6475]'}`}>
                                        {stepLabels[s - 1]}
                                    </span>
                                </button>

                                {s < 4 && (
                                    <div className="flex-1 mt-5 mx-2 h-0.5 bg-[#2A3442] relative rounded">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#D4AF37] transition-all duration-500 rounded ${s < step ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444]">
                        ⚠️ {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <Step1BirthDetails
                            data={birthData}
                            updateData={(updates) => setBirthData(prev => ({ ...prev, ...updates }))}
                            offsetConfig={offsetConfig}
                            updateOffset={setOffsetConfig}
                            spouseData={spouseData}
                            updateSpouse={(updates) => setSpouseData(prev => ({ ...prev, ...updates }))}
                        />
                    )}
                    {step === 2 && (
                        <Step2ForensicTraits
                            traits={forensicTraits}
                            updateTraits={(updates) => setForensicTraits(prev => ({ ...prev, ...updates }))}
                            gender={birthData.gender as Gender}
                        />
                    )}
                    {step === 3 && (
                        <Step3LifeEvents
                            lifeEvents={lifeEvents}
                            updateEvents={setLifeEvents}
                            offsetConfig={offsetConfig}
                        />
                    )}
                    {step === 4 && (
                        <Step4Review
                            data={birthData}
                            events={lifeEvents}
                            traits={{ height: { cm: 0, feet: 0, inches: 0 }, build: '', complexion: '', faceShape: '', eyeColor: '', hairColor: '', hairType: '', prakriti: '', noseType: '' }}
                            forensicTraits={forensicTraits}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onEdit={setStep}
                            offsetConfig={offsetConfig}
                        />
                    )}
                </div>

                {/* Navigation */}
                {step < 4 && (
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#2A3442]">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1
                                ? 'opacity-0 cursor-default'
                                : 'border-2 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                                }`}
                        >
                            ← Back
                        </button>

                        <button
                            onClick={saveDraftToCloud}
                            disabled={cloudSaveStatus === 'saving' || !birthData.fullName}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${cloudSaveStatus === 'saved'
                                ? 'bg-[#2D7A5C]/20 text-[#2D7A5C] border border-[#2D7A5C]/30'
                                : cloudSaveStatus === 'saving'
                                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse'
                                    : cloudSaveStatus === 'error'
                                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                                        : 'bg-[#1A1F2E] text-[#8C7F72] border border-[#2A3442] hover:border-[#D4AF37]/50'
                                }`}
                        >
                            {cloudSaveStatus === 'saving' ? '💾 Saving...' :
                                cloudSaveStatus === 'saved' ? '☁️ Saved' :
                                    cloudSaveStatus === 'error' ? '⚠️ Retry' : '☁️ Save Draft'}
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] text-[#0A0F1C] rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                        >
                            Next Step →
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
