'use client';

import { PhysicalTraits } from '@/lib/types';

interface Step3Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}

const FACE_SHAPES = [
    { value: 'round', label: 'Round', icon: '🌕', description: 'Circular face' },
    { value: 'oval', label: 'Oval', icon: '🥚', description: 'Egg-shaped' },
    { value: 'square', label: 'Square', icon: '⬛', description: 'Angular jawline' },
    { value: 'long', label: 'Long', icon: '📏', description: 'Elongated' },
    { value: 'heart', label: 'Heart', icon: '💗', description: 'Wide forehead' },
    { value: 'pear', label: 'Pear', icon: '🍐', description: 'Wide jaw' },
];

const BUILD_OPTIONS = [
    { value: 'slim', label: 'Slim', icon: '🪶', description: 'Lean build' },
    { value: 'medium', label: 'Medium', icon: '⚖️', description: 'Average build' },
    { value: 'athletic', label: 'Athletic', icon: '💪', description: 'Muscular' },
    { value: 'heavy', label: 'Heavy', icon: '🐻', description: 'Large frame' },
    { value: 'very_heavy', label: 'Very Heavy', icon: '🏋️', description: 'Plus size' },
];

const COMPLEXION_OPTIONS = [
    { value: 'very_fair', label: 'Very Fair', icon: '🧈', color: '#FFF8DC' },
    { value: 'fair', label: 'Fair / Wheatish', icon: '🌾', color: '#F5DEB3' },
    { value: 'medium', label: 'Medium / Olive', icon: '🫒', color: '#D2B48C' },
    { value: 'dark', label: 'Dark', icon: '☕', color: '#A0522D' },
    { value: 'very_dark', label: 'Very Dark', icon: '🍫', color: '#654321' },
];

const EYE_COLORS = [
    { value: 'black', label: 'Black', icon: '⚫' },
    { value: 'brown', label: 'Brown', icon: '🟤' },
    { value: 'hazel', label: 'Hazel', icon: '🌰' },
    { value: 'blue', label: 'Blue', icon: '🔵' },
    { value: 'green', label: 'Green', icon: '🟢' },
    { value: 'grey', label: 'Grey', icon: '⚪' },
];

const HAIR_COLORS = [
    { value: 'black', label: 'Black', icon: '🖤' },
    { value: 'brown', label: 'Brown', icon: '🤎' },
    { value: 'blonde', label: 'Blonde', icon: '💛' },
    { value: 'white', label: 'White / Grey', icon: '🤍' },
    { value: 'red', label: 'Red', icon: '❤️' },
];

export default function Step3PhysicalTraits({ physicalTraits, updateTraits }: Step3Props) {
    const handleHeightChange = (field: 'cm' | 'feet' | 'inches', value: string) => {
        const numVal = parseInt(value) || 0;
        const currentHeight = physicalTraits.height || { cm: 0, feet: 0, inches: 0 };
        let newHeight = { ...currentHeight, [field]: numVal };
        if (field === 'cm') {
            const totalInches = numVal / 2.54;
            newHeight.feet = Math.floor(totalInches / 12);
            newHeight.inches = Math.round(totalInches % 12);
        } else {
            const totalInches = (newHeight.feet * 12) + newHeight.inches;
            newHeight.cm = Math.round(totalInches * 2.54);
        }
        updateTraits({ height: newHeight });
    };

    const completedTraits = [physicalTraits.build, physicalTraits.complexion, physicalTraits.faceShape, physicalTraits.eyeColor, physicalTraits.hairColor].filter(Boolean).length;

    return (
        <div className="animate-fade-in-up space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">🪞 Physical Appearance</h2>
                <p className="text-[#C4B8AD] max-w-2xl mx-auto">
                    ✨ Your physical traits are influenced by your <span className="text-[#8B5CF6] font-semibold">Ascendant (Rising Sign)</span>. This helps us confirm the correct rising sign!
                </p>
            </div>

            {/* Progress */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#C4B8AD]">Completion Progress</span>
                    <span className="text-sm font-bold text-[#D4AF37]">{completedTraits}/5 traits</span>
                </div>
                <div className="h-3 bg-[#2A3442] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8B5CF6] rounded-full transition-all duration-500" style={{ width: `${(completedTraits / 5) * 100}%` }} />
                </div>
            </div>

            {/* Height */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">📏</span> Height
                </label>
                <div className="flex gap-4 items-center flex-wrap">
                    <select value={physicalTraits.height?.feet || 5} onChange={(e) => handleHeightChange('feet', e.target.value)} className="input-field w-28">
                        {[4, 5, 6, 7].map(f => <option key={f} value={f}>{f} ft</option>)}
                    </select>
                    <select value={physicalTraits.height?.inches || 0} onChange={(e) => handleHeightChange('inches', e.target.value)} className="input-field w-28">
                        {Array.from({ length: 12 }, (_, i) => i).map(i => <option key={i} value={i}>{i} in</option>)}
                    </select>
                    <div className="text-[#8C7F72] flex items-center gap-2">
                        <span>=</span>
                        <span className="text-[#D4AF37] font-mono font-bold">{physicalTraits.height?.cm || 0}</span>
                        <span>cm</span>
                    </div>
                </div>
            </div>

            {/* Body Build */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">🏃</span> Body Build
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {BUILD_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => updateTraits({ build: opt.value as any })}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${physicalTraits.build === opt.value ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                            <div className="text-2xl mb-1">{opt.icon}</div>
                            <div className="text-xs font-semibold text-[#F5F0EB]">{opt.label}</div>
                            <div className="text-[10px] text-[#8C7F72]">{opt.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Complexion */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">🎨</span> Skin Complexion
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {COMPLEXION_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => updateTraits({ complexion: opt.value as any })}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${physicalTraits.complexion === opt.value ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                            <div className="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-white/20" style={{ backgroundColor: opt.color }} />
                            <div className="text-xs font-semibold text-[#F5F0EB]">{opt.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Face Shape */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">😊</span> Face Shape
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {FACE_SHAPES.map((shape) => (
                        <button key={shape.value} type="button" onClick={() => updateTraits({ faceShape: shape.value as any })}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${physicalTraits.faceShape === shape.value ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                            <div className="text-3xl mb-1">{shape.icon}</div>
                            <div className="text-xs font-semibold text-[#F5F0EB]">{shape.label}</div>
                            <div className="text-[10px] text-[#8C7F72]">{shape.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Eyes & Hair */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                        <span className="text-xl">👁️</span> Eye Color
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {EYE_COLORS.map((opt) => (
                            <button key={opt.value} type="button" onClick={() => updateTraits({ eyeColor: opt.value })}
                                className={`p-3 rounded-xl text-center transition-all border-2 ${physicalTraits.eyeColor === opt.value ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                                <div className="text-xl mb-1">{opt.icon}</div>
                                <div className="text-[10px] text-[#F5F0EB]">{opt.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-6">
                    <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                        <span className="text-xl">💇</span> Hair Color
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {HAIR_COLORS.map((opt) => (
                            <button key={opt.value} type="button" onClick={() => updateTraits({ hairColor: opt.value })}
                                className={`p-3 rounded-xl text-center transition-all border-2 ${physicalTraits.hairColor === opt.value ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                                <div className="text-xl mb-1">{opt.icon}</div>
                                <div className="text-[10px] text-[#F5F0EB]">{opt.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Special Features */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">✨</span> Special Features (Optional)
                </label>
                <textarea value={physicalTraits.specialFeatures} onChange={(e) => updateTraits({ specialFeatures: e.target.value })} className="input-field min-h-[100px] resize-none" placeholder="🔍 Describe any moles, birthmarks, scars, tattoos, or unique features..." />
            </div>

            {/* Completion */}
            {completedTraits >= 4 && (
                <div className="p-4 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-xl animate-fade-in">
                    <p className="text-[#2D7A5C] flex items-center gap-3 font-medium">
                        <span className="text-2xl">🎉</span>
                        Excellent! Your physical traits will help verify your Ascendant sign! ✨
                    </p>
                </div>
            )}
        </div>
    );
}
