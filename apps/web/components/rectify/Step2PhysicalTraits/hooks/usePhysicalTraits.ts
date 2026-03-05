import { useState } from 'react';

export function usePhysicalTraits() {
    const [activeTab, setActiveTab] = useState('face');
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    return {
        activeTab,
        setActiveTab,
        activeHelp,
        setActiveHelp
    };
}
