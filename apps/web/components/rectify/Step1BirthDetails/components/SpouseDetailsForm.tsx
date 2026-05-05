import React from 'react';
import { motion } from 'framer-motion';
import { FormField } from '@/components/ui/form/FormField';
import BirthPlacePicker from '../../BirthPlacePicker';
import { SpouseData } from '@/lib/types';
import { MONTHS, YEARS, HOURS, MINUTES } from '../constants';

interface SpouseDetailsFormProps {
    showSpouse: boolean;
    setShowSpouse: (show: boolean) => void;
    spouseData?: SpouseData;
    spouseDobParts: { day: string; month: string; year: string; };
    spouseTimeParts: { hour: string; minute: string; period: 'AM' | 'PM'; };
    spouseAvailableDays: string[];
    handleSpouseDateChange: (part: 'day' | 'month' | 'year', val: string) => void;
    handleSpouseTimeChange: (part: 'hour' | 'minute' | 'period', val: string) => void;
    updateSpouse?: (updates: Partial<SpouseData>) => void;
}

export function SpouseDetailsForm({
    showSpouse,
    setShowSpouse,
    spouseData,
    spouseDobParts,
    spouseTimeParts,
    spouseAvailableDays,
    handleSpouseDateChange,
    handleSpouseTimeChange,
    updateSpouse
}: SpouseDetailsFormProps) {
    return (
        <>
            <button
                type="button"
                onClick={() => setShowSpouse(!showSpouse)}
                className="flex items-center justify-between w-full text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-xl">👩‍❤️‍👨</div>
                    <div>
                        <h4 className="font-[family-name:var(--font-cormorant)] text-base font-semibold text-[#1A1612]">Spouse Details <span className="text-[#5A554F] font-normal text-xs">(Optional)</span></h4>
                        <p className="text-[10px] text-[#5A554F]">+15% precision boost</p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-xs transition-all ${showSpouse ? 'rotate-180 bg-[#B8860B] border-[#B8860B] text-white' : 'text-[#B8860B]'}`}>▼</div>
            </button>

            {showSpouse && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-4 pt-4 border-t border-[#F0E8DE]"
                >
                    <FormField label="Spouse Date of Birth">
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                value={spouseDobParts.day}
                                onChange={(e) => handleSpouseDateChange('day', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#78611D]"
                            >
                                <option value="">Day</option>
                                {spouseAvailableDays.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select
                                value={spouseDobParts.month}
                                onChange={(e) => handleSpouseDateChange('month', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#78611D]"
                            >
                                <option value="">Month</option>
                                {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                            </select>
                            <select
                                value={spouseDobParts.year}
                                onChange={(e) => handleSpouseDateChange('year', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#78611D]"
                            >
                                <option value="">Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Spouse Birth Time">
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                value={spouseTimeParts.hour}
                                onChange={(e) => handleSpouseTimeChange('hour', e.target.value)}
                                className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center outline-none focus:border-[#78611D]"
                            >
                                <option value="">HH</option>
                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-xl text-[#B8860B]">:</span>
                            <select
                                value={spouseTimeParts.minute}
                                onChange={(e) => handleSpouseTimeChange('minute', e.target.value)}
                                className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center outline-none focus:border-[#78611D]"
                            >
                                <option value="">MM</option>
                                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="flex bg-white rounded-lg overflow-hidden border border-[#E8E0D5] h-11">
                                {['AM', 'PM'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleSpouseTimeChange('period', p as any)}
                                        className={`px-4 font-medium text-sm transition-all ${spouseTimeParts.period === p ? 'bg-[#B8860B] text-white' : 'text-[#5A554F] hover:text-[#1A1612]'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FormField>

                    <FormField label="Spouse Birth Place">
                        <BirthPlacePicker
                            birthPlace={spouseData?.birthPlace || ''}
                            latitude={spouseData?.latitude || 0}
                            longitude={spouseData?.longitude || 0}
                            timezone={parseFloat(spouseData?.timezone?.toString() || '5.5')}
                            onUpdate={(updates) => updateSpouse?.(updates)}
                        />
                    </FormField>
                </motion.div>
            )}
        </>
    );
}
