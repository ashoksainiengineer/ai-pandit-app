import React from 'react';
import { Compass, Table } from 'lucide-react';
import type { EphemerisData, DivisionalChart, PlanetPosition } from '@ai-pandit/shared';

interface PlanetaryProps {
    ephemeris: EphemerisData;
    divCharts: Record<string, DivisionalChart>;
}

export const PlanetaryVitals: React.FC<PlanetaryProps> = ({ ephemeris, divCharts }) => {
    const planets = Object.entries(ephemeris.planets) as [string, PlanetPosition][];

    return (
        <div className="bg-white border border-[#F0E8DE] rounded-xl p-6 h-full">
            <h4 className="text-[#1A1612] font-bold mb-6 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D4AF37]" />
                Planetary Vitals (Nirayana)
            </h4>

            <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-[#F0E8DE] text-[#7A756F]">
                            <th className="py-2 text-left">Planet</th>
                            <th className="py-2 text-left">Sign</th>
                            <th className="py-2 text-right">Arc-Sec Precision</th>
                            <th className="py-2 text-right">D9</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[#F0E8DE]/50 hover:bg-[#F5EFE7]">
                            <td className="py-3 text-[#D4AF37] font-bold">ASCENDANT</td>
                            <td className="py-3 text-[#1A1612]">{ephemeris.ascendant.sign}</td>
                            <td className="py-3 text-right text-[#7A756F]">{(ephemeris.ascendant.longitude % 30).toFixed(6)}°</td>
                            <td className="py-3 text-right text-[#1A1612]">{divCharts.D9.ascendant.sign.slice(0, 3)}</td>
                        </tr>
                        {planets.map(([name, data]) => (
                            <tr key={name} className="border-b border-[#F0E8DE]/50 hover:bg-[#F5EFE7]">
                                <td className="py-2 text-[#1A1612] capitalize">{name}</td>
                                <td className="py-2 text-[#7A756F]">{data.sign}</td>
                                <td className="py-2 text-right text-[#1A1612]">{(data.longitude % 30).toFixed(4)}°</td>
                                <td className="py-2 text-right text-[#7A756F]">{divCharts.D9.planets[name]?.sign.slice(0, 3) || '??'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex gap-4">
                <div className="flex-1 bg-[#FDF8F3] p-3 rounded-lg border border-[#F0E8DE] text-center">
                    <div className="text-[10px] text-[#7A756F] uppercase mb-1">D10 Lagnat</div>
                    <div className="text-[#1A1612] font-bold">{divCharts.D10.ascendant.sign}</div>
                </div>
                <div className="flex-1 bg-[#FDF8F3] p-3 rounded-lg border border-[#F0E8DE] text-center">
                    <div className="text-[10px] text-[#7A756F] uppercase mb-1">D60 Amsha</div>
                    <div className="text-[#1A1612] font-bold">{divCharts.D60?.ascendant.sign || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};
