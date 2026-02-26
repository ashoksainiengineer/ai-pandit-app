import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap } from 'lucide-react';

interface ShuddhiProps {
    shuddhi: {
        kunda: { score: number; details: string };
        tatwa: { score: number; details: string };
    };
}

export const VedicShuddhiRadar: React.FC<ShuddhiProps> = ({ shuddhi }) => {
    return (
        <div className="bg-white border border-[#F0E8DE] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-[#78611D]" />
            </div>

            <h4 className="text-[#1A1612] font-bold mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#78611D]" />
                Divine Purification (Shuddhi)
            </h4>

            <div className="space-y-6">
                {/* Kunda Shuddhi Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-[#7A756F] uppercase font-mono">Kunda (Lunar-Asc) Alignment</span>
                        <span className="text-[#78611D] font-bold">{shuddhi.kunda.score}%</span>
                    </div>
                    <div className="h-2 bg-[#F5EFE7] rounded-full overflow-hidden border border-[#F0E8DE]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shuddhi.kunda.score}%` }}
                            className="h-full bg-gradient-to-r from-[#78611D]/40 to-[#78611D]"
                        />
                    </div>
                    <p className="text-[10px] text-[#7A756F] mt-2 font-mono italic">
                        {shuddhi.kunda.details}
                    </p>
                </div>

                {/* Tatwa Shuddhi Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-[#7A756F] uppercase font-mono">Tatwa (Elemental Path)</span>
                        <span className="text-[#78611D] font-bold">{shuddhi.tatwa.score}%</span>
                    </div>
                    <div className="h-2 bg-[#F5EFE7] rounded-full overflow-hidden border border-[#F0E8DE]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shuddhi.tatwa.score}%` }}
                            className="h-full bg-gradient-to-r from-[#78611D]/40 to-[#78611D]"
                        />
                    </div>
                    <p className="text-[10px] text-[#7A756F] mt-2 font-mono italic">
                        {shuddhi.tatwa.details}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#F0E8DE]/50">
                <div className="text-[10px] text-[#7A756F] leading-relaxed">
                    The universe exists in 90-minute Tatwa cycles relative to Dinamaana (Day-Length). This candidate aligns perfectly with your physical manifestation.
                </div>
            </div>
        </div>
    );
};
