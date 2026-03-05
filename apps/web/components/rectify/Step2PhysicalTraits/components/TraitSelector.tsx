import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HelpCircle, Info } from 'lucide-react';
import { getSignColor } from '../utils';

interface TraitSelectorProps {
    label: string;
    icon: any;
    options: any[];
    value: any;
    onChange: (val: any) => void;
    groupId: string;
    description?: string;
    grid?: 3 | 4;
    activeHelp: string | null;
    setActiveHelp: (id: string | null) => void;
}

export function TraitSelector({
    label,
    icon: Icon,
    options,
    value,
    onChange,
    groupId,
    description,
    grid = 3,
    activeHelp,
    setActiveHelp
}: TraitSelectorProps) {
    return (
        <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#78611D]/10 border border-[#78611D]/20">
                        <Icon className="w-5 h-5 text-[#78611D]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#1A1612] uppercase tracking-wide">{label}</h3>
                        {description && <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">{description}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setActiveHelp(activeHelp === groupId ? null : groupId)}
                    className={`p-2 rounded-full transition-all ${activeHelp === groupId ? 'bg-[#78611D] text-white' : 'hover:bg-[#F5EFE7] text-[#7A756F]'}`}
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence>
                {activeHelp === groupId && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/20 rounded-xl p-4 mb-4 text-xs leading-relaxed text-[#4A453F] flex gap-3">
                            <Info className="w-4 h-4 text-[#6B9AC4] shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-[#6B9AC4]">Astrological Logic:</strong> This trait helps the AI differentiate between planetary influences on your Ascendant.
                                <br />
                                <span className="italic opacity-70">Example: A &quot;Mars&quot; jawline rules out soft ascendants like Pisces.</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`grid gap-3 ${grid === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${value === opt.value
                            ? 'bg-[#78611D]/10 border-[#78611D] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                            : 'bg-white border-[#F0E8DE] hover:border-[#78611D]/50'
                            }`}
                    >
                        {value === opt.value && (
                            <div className="absolute top-0 right-0 p-2">
                                <Sparkles className="w-3 h-3 text-[#78611D] animate-pulse" />
                            </div>
                        )}
                        <div className="text-2xl mb-2">{opt.emoji}</div>
                        <div className="font-bold text-[#1A1612] text-sm mb-1">{opt.label}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${getSignColor(opt.signs)}`}>
                            {opt.signs}
                        </div>
                        <div className="text-[10px] text-[#7A756F] italic leading-tight group-hover:text-[#4A453F] transition-colors">
                            &quot;{opt.guide}&quot;
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
