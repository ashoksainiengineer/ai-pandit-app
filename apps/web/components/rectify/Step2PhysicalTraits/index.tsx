'use client';

import { usePhysicalTraits } from './hooks/usePhysicalTraits';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { TabPanels } from './components/TabPanels';
import { Step2Props } from './types';

export default function Step2PhysicalTraitsIndex({ physicalTraits, updateTraits }: Step2Props) {
    const engine = usePhysicalTraits();

    return (
        <div className="w-full max-w-4xl mx-auto pb-12">
            <Header />
            <TabNavigation activeTab={engine.activeTab} setActiveTab={engine.setActiveTab} />
            <TabPanels
                activeTab={engine.activeTab}
                physicalTraits={physicalTraits}
                updateTraits={updateTraits}
                activeHelp={engine.activeHelp}
                setActiveHelp={engine.setActiveHelp}
            />

            {/* Validation Badge */}
            <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#184131]/10 border border-[#184131]/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#184131]">
                        AI-PANDIT LOGIC SYNC: ACTIVE
                    </span>
                </div>
            </div>
        </div>
    );
}
