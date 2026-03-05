import { ScanFace } from 'lucide-react';

export function Header() {
    return (
        <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78611D]/10 border border-[#78611D]/20 text-[#78611D] text-xs font-bold uppercase tracking-widest mb-4">
                <ScanFace className="w-3 h-3" />
                Samudrika Shastra 2.0
            </div>
            <h1 className="text-3xl font-black text-[#1A1612] mb-2">Biometric Verification</h1>
            <p className="text-[#7A756F] text-sm max-w-xl mx-auto">
                Your physical form is a map of your karma. Providing accurate details helps us fingerprint your true Ascendant.
            </p>
        </div>
    );
}
