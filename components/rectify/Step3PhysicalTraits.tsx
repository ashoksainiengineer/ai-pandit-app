'use client';

import { PhysicalTraits } from '@/lib/types';

interface Step3Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}

export default function Step3PhysicalTraits({ physicalTraits, updateTraits }: Step3Props) {
    const handleHeightChange = (field: 'cm' | 'feet' | 'inches', value: string) => {
        const numVal = parseInt(value) || 0;
        const currentHeight = physicalTraits.height || { cm: 0, feet: 0, inches: 0 };

        let newHeight = { ...currentHeight, [field]: numVal };

        // Auto-convert logic can be complex, for now we let users input what they know
        // Ideally we'd sync cm <-> feet/inches
        if (field === 'cm') {
            const totalInches = numVal / 2.54;
            newHeight.feet = Math.floor(totalInches / 12);
            newHeight.inches = Math.round(totalInches % 12);
        } else {
            // Update cm based on feet/inches
            const totalInches = (newHeight.feet * 12) + newHeight.inches;
            newHeight.cm = Math.round(totalInches * 2.54);
        }

        updateTraits({ height: newHeight });
    };

    return (
        <div className="animate-fade-in-up space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[#F5F0EB]">Physical Traits</h2>
                <p className="text-[#C4B8AD]">
                    Your physical appearance is heavily influenced by your Ascendant (Lagna) sign.
                    This helps us confirm the rising sign.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Height */}
                    <div className="glass-card p-6">
                        <label className="block text-sm font-medium text-[#D4AF37] mb-4">Height</label>
                        <div className="flex gap-4 items-center mb-4">
                            <div className="flex-1">
                                <label className="text-xs text-[#8C7F72] block mb-1">Feet</label>
                                <select
                                    value={physicalTraits.height?.feet || 0}
                                    onChange={(e) => handleHeightChange('feet', e.target.value)}
                                    className="input-field"
                                >
                                    {[4, 5, 6, 7].map(f => <option key={f} value={f}>{f}'</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[#8C7F72] block mb-1">Inches</label>
                                <select
                                    value={physicalTraits.height?.inches || 0}
                                    onChange={(e) => handleHeightChange('inches', e.target.value)}
                                    className="input-field"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i).map(i => <option key={i} value={i}>{i}"</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="text-xs text-[#8C7F72] text-center">
                            OR {physicalTraits.height?.cm || 0} cm
                        </div>
                    </div>

                    {/* Build */}
                    <div>
                        <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Body Build</label>
                        <select
                            value={physicalTraits.build}
                            onChange={(e) => updateTraits({ build: e.target.value as any })}
                            className="input-field"
                        >
                            <option value="">Select Build</option>
                            <option value="slim">Slim / Lean</option>
                            <option value="medium">Medium / Athletic</option>
                            <option value="heavy">Heavy / Large Frame</option>
                            <option value="very_heavy">Very Heavy</option>
                        </select>
                    </div>

                    {/* Complexion */}
                    <div>
                        <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Complexion</label>
                        <select
                            value={physicalTraits.complexion}
                            onChange={(e) => updateTraits({ complexion: e.target.value as any })}
                            className="input-field"
                        >
                            <option value="">Select Complexion</option>
                            <option value="very_fair">Very Fair</option>
                            <option value="fair">Fair / Wheatish</option>
                            <option value="medium">Medium / Olive</option>
                            <option value="dark">Dark</option>
                            <option value="very_dark">Very Dark</option>
                        </select>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Face Shape */}
                    <div>
                        <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Face Shape</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['round', 'oval', 'square', 'long', 'heart', 'pear'].map((shape) => (
                                <button
                                    key={shape}
                                    onClick={() => updateTraits({ faceShape: shape as any })}
                                    className={`p-2 rounded-lg border text-sm capitalize transition-all ${physicalTraits.faceShape === shape
                                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0F1419] font-bold'
                                            : 'bg-[#2A3442] border-transparent text-[#C4B8AD] hover:border-[#D4AF37]/30'
                                        }`}
                                >
                                    {shape}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Eyes */}
                    <div>
                        <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Eye Color</label>
                        <select
                            value={physicalTraits.eyeColor}
                            onChange={(e) => updateTraits({ eyeColor: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Select Eye Color</option>
                            <option value="black">Black / Dark Brown</option>
                            <option value="brown">Brown</option>
                            <option value="hazel">Hazel</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                        </select>
                    </div>

                    {/* Hair */}
                    <div>
                        <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Hair Color</label>
                        <select
                            value={physicalTraits.hairColor}
                            onChange={(e) => updateTraits({ hairColor: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Select Hair Color</option>
                            <option value="black">Black</option>
                            <option value="brown">Brown</option>
                            <option value="blonde">Blonde</option>
                            <option value="white">White / Grey</option>
                            <option value="red">Red</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Special Features / Marks (Optional)</label>
                <textarea
                    value={physicalTraits.specialFeatures}
                    onChange={(e) => updateTraits({ specialFeatures: e.target.value })}
                    className="input-field min-h-[100px]"
                    placeholder="Describe any distinct marks (moles, scars), tattoos, or unique features..."
                />
            </div>
        </div>
    );
}
