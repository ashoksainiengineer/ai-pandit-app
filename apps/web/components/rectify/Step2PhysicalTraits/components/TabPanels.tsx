import { motion, AnimatePresence } from 'framer-motion';
import { Brain, User, Zap, Sparkles, Eye, ScanFace, Activity, Fingerprint, Ruler } from 'lucide-react';
import { PhysicalTraits } from '@/lib/types';
import {
    EYE_SHAPES,
    FOREHEAD_TYPES,
    JAW_TYPES,
    HEIGHT_OPTIONS,
    FRAME_OPTIONS,
    SHOULDER_OPTIONS,
    HAIR_OPTIONS
} from '../constants';
import { TraitSelector } from './TraitSelector';

interface TabPanelsProps {
    activeTab: string;
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
    activeHelp: string | null;
    setActiveHelp: (id: string | null) => void;
}

export function TabPanels({ activeTab, physicalTraits, updateTraits, activeHelp, setActiveHelp }: TabPanelsProps) {
    return (
        <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
                {activeTab === 'face' && (
                    <motion.div
                        key="face"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                    >
                        <TraitSelector
                            label="Netra (The Gaze)"
                            icon={Eye}
                            groupId="eyes"
                            description="Window to the Moon Sign"
                            options={EYE_SHAPES}
                            value={physicalTraits.eyeShape || 'almond'}
                            onChange={(val: any) => updateTraits({ eyeShape: val })}
                            grid={4}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                        <TraitSelector
                            label="Lalat (Forehead)"
                            icon={Brain}
                            groupId="forehead"
                            description="Seat of Intelligence (Mercury/Jupiter)"
                            options={FOREHEAD_TYPES}
                            value={physicalTraits.foreheadHeight || 'high'}
                            onChange={(val: any) => updateTraits({ foreheadHeight: val })}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                        <TraitSelector
                            label="Hanu (Jawline)"
                            icon={ScanFace}
                            groupId="jaw"
                            description="Determine Willpower (Mars Strength)"
                            options={JAW_TYPES}
                            value={physicalTraits.jawLine || 'defined'}
                            onChange={(val: any) => updateTraits({ jawLine: val })}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                    </motion.div>
                )}

                {activeTab === 'structure' && (
                    <motion.div
                        key="structure"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                    >
                        <TraitSelector
                            label="Sharira (Constitution)"
                            icon={Activity}
                            groupId="frame"
                            description="Overall Elemental Balance"
                            options={FRAME_OPTIONS}
                            value={physicalTraits.prakriti || 'pitta'}
                            onChange={(val: any) => updateTraits({ prakriti: val })}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                        <TraitSelector
                            label="Deha (Height)"
                            icon={Ruler}
                            groupId="height"
                            description="Vertical Aspect"
                            options={HEIGHT_OPTIONS}
                            value={(() => {
                                const height = physicalTraits.height;
                                const cm = typeof height === 'number' ? height : (typeof height === 'object' && height !== null ? height.cm : 168);
                                return (cm || 168) < 162 ? 'short' : (cm || 168) > 178 ? 'tall' : 'medium';
                            })()}
                            onChange={(val: any) => {
                                const cm = val === 'short' ? 155 : val === 'tall' ? 180 : 168;
                                updateTraits({ height: { cm, feet: 5, inches: 6 } });
                            }}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                        <TraitSelector
                            label="Skandha (Shoulders)"
                            icon={User}
                            groupId="shoulders"
                            description="Planetary Strength Indicator"
                            options={SHOULDER_OPTIONS}
                            value={physicalTraits.shoulderWidth || 'average'}
                            onChange={(val: any) => updateTraits({ shoulderWidth: val })}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />
                    </motion.div>
                )}

                {activeTab === 'details' && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                    >
                        <TraitSelector
                            label="Kesha (Hair Texture)"
                            icon={Sparkles}
                            groupId="hair"
                            description="Influence of Saturn/Venus"
                            options={HAIR_OPTIONS}
                            value={physicalTraits.hairType || 'straight'}
                            onChange={(val: any) => updateTraits({ hairType: val })}
                            grid={4}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                        />

                        {/* Special Marks */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#78611D]/10 border border-[#78611D]/20">
                                    <Fingerprint className="w-5 h-5 text-[#78611D]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#1A1612] uppercase tracking-wide">Vishesha Lakshan</h3>
                                    <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Unique Distinguishing Marks</p>
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={physicalTraits.specialFeatures || ''}
                                    onChange={(e) => updateTraits({ specialFeatures: e.target.value })}
                                    placeholder="Describe scars, moles (tilaks), or unique physical features..."
                                    className="w-full h-32 bg-white border border-[#F0E8DE] rounded-xl p-4 text-sm text-[#1A1612] placeholder-[#7A756F] focus:border-[#78611D] focus:ring-1 focus:ring-[#78611D] outline-none transition-all resize-none"
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] text-[#7A756F] flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-[#78611D]" />
                                    Encrypted
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
