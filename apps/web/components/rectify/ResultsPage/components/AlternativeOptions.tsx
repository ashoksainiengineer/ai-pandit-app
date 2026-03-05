import React from 'react';
import { Candidate } from '../types';
import { CandidateCard } from './CandidateCard';

interface AlternativeOptionsProps {
    alternativeOptions: Candidate[];
}

export function AlternativeOptions({ alternativeOptions }: AlternativeOptionsProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-[#1A1612] uppercase tracking-tight">
                Secondary Timeline Options
            </h2>
            <p className="text-[#7A756F] text-sm">
                High-precision alternatives that crossed the Level 2 neural screening threshold:
            </p>
            {alternativeOptions.map((candidate, idx) => (
                <CandidateCard key={idx} candidate={candidate} rank={idx + 2} />
            ))}
        </div>
    );
}
