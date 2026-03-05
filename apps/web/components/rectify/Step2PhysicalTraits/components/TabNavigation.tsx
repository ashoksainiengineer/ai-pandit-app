import { TABS } from '../constants';

interface TabNavigationProps {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
    return (
        <div className="flex p-1 bg-[#F5EFE7] border border-[#F0E8DE] rounded-xl mb-8 sticky top-4 z-20 shadow-xl backdrop-blur-xl">
            {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isActive
                            ? 'bg-[#78611D] text-white shadow-lg'
                            : 'text-[#7A756F] hover:text-[#1A1612] hover:bg-white'
                            }`}
                    >
                        <TabIcon className="w-4 h-4" />
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
