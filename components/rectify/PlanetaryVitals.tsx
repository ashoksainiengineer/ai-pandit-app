import React from 'react';
import { Compass, Table } from 'lucide-react';

interface PlanetaryProps {
    ephemeris: any;
    divCharts: any;
}

export const PlanetaryVitals: React.FC<PlanetaryProps> = ({ ephemeris, divCharts }) => {
    const planets = Object.entries(ephemeris.planets);

    return (
        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6 h-full">
            <h4 className="text-[#F5F0EB] font-bold mb-6 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D4AF37]" />
                Planetary Vitals (Nirayana)
            </h4>

            <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-[#3A4452] text-[#8C7F72]">
                            <th className="py-2 text-left">Planet</th>
                            <th className="py-2 text-left">Sign</th>
                            <th className="py-2 text-right">Arc-Sec Precision</th>
                            <th className="py-2 text-right">D9</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[#3A4452]/50 hover:bg-[#151a21]">
                            <td className="py-3 text-[#D4AF37] font-bold">ASCENDANT</td>
                            <td className="py-3 text-white">{ephemeris.ascendant.sign}</td>
                            <td className="py-3 text-right text-[#8C7F72]">{(ephemeris.ascendant.longitude % 30).toFixed(6)}°</td>
                            <td className="py-3 text-right text-white">{divCharts.D9.ascendant.sign.slice(0, 3)}</td>
                        </tr>
                        {planets.map(([name, data]: [string, any]) => (
                            <tr key={name} className="border-b border-[#3A4452]/50 hover:bg-[#0F1419]">
                                <td className="py-2 text-white capitalize">{name}</td>
                                <td className="py-2 text-[#8C7F72]">{data.sign}</td>
                                <td className="py-2 text-right text-white">{(data.longitude % 30).toFixed(4)}°</td>
                                <td className="py-2 text-right text-[#8C7F72]">{divCharts.D9.planets[name]?.sign.slice(0, 3) || '??'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex gap-4">
                <div className="flex-1 bg-[#0F1419] p-3 rounded-lg border border-[#3A4452] text-center">
                    <div className="text-[10px] text-[#8C7F72] uppercase mb-1">D10 Lagnat</div>
                    <div className="text-[#F5F0EB] font-bold">{divCharts.D10.ascendant.sign}</div>
                </div>
                <div className="flex-1 bg-[#0F1419] p-3 rounded-lg border border-[#3A4452] text-center">
                    <div className="text-[10px] text-[#8C7F72] uppercase mb-1">D60 Amsha</div>
                    <div className="text-[#F5F0EB] font-bold">{divCharts.D60?.ascendant.sign || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};
