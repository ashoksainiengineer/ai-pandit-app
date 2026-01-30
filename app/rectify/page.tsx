/**
 * Birth Time Rectification Page
 * Sacred Ivory Light Theme - Consistent with landing page
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
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);

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
                // Reset to idle after 2 seconds
                setTimeout(() => setCloudSaveStatus('idle'), 2000);
            } else {
                setCloudSaveStatus('error');
            }
        } catch (err) {
            setCloudSaveStatus('error');
        }
    };

    // Auto-save effect - runs when form data changes
    useEffect(() => {
        if (!isAutoSaveEnabled || !birthData.fullName) return;

        const timer = setTimeout(() => {
            saveDraftToCloud();
        }, 1500); // Auto-save 1.5 seconds after last change

        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, isAutoSaveEnabled]);

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
        // Enable auto-save after initial load
        setIsAutoSaveEnabled(true);
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
        <Layout hideFooter>
            <div className="pt-28 pb-16">
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
                                                ? 'bg-white border-[#B8860B] text-[#B8860B] shadow-[0_0_15px_rgba(184,134,11,0.3)]'
                                                : 'bg-[#F5EFE7] border-[#EBE2D6] text-[#A8A39D]'
                                            }`}
                                    >
                                        {s < step ? '✓' : stepEmojis[s - 1]}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium whitespace-nowrap ${s === step ? 'text-[#B8860B]' : 'text-[#A8A39D]'}`}>
                                        {stepLabels[s - 1]}
                                    </span>
                                </button>

                                {s < 4 && (
                                    <div className="flex-1 mt-5 mx-2 h-0.5 bg-[#EBE2D6] relative rounded">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#B8860B] transition-all duration-500 rounded ${s < step ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#C65D3B]/10 border border-[#C65D3B]/30 rounded-xl text-[#C65D3B]">
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
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#F0E8DE]">
                            <button
                                onClick={handleBack}
                                disabled={step === 1}
                                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1
                                    ? 'opacity-0 cursor-default'
                                    : 'border-2 border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10'
                                    }`}
                            >
                                ← Back
                            </button>
    
                            {/* Auto-save Status Indicator */}
                            <div className="flex items-center gap-2 text-sm">
                                {cloudSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1.5 text-[#B8860B] animate-pulse">
                                        <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                )}
                                {cloudSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1.5 text-[#2D7A5C]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Auto-saved
                                    </span>
                                )}
                                {cloudSaveStatus === 'error' && (
                                    <span className="flex items-center gap-1.5 text-[#C65D3B]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Save failed
                                    </span>
                                )}
                            </div>
    
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(184,134,11,0.4)] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                )}
            </div>
        </Layout>
    );
}
