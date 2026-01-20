// app/page.tsx
// Landing Page - "God Tier" Marketer Edition
// Focus: Factual, High-Trust, High-Conversion, Scientific Authority

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import TestimonialsSection from '@/components/landing/Testimonials';
import { Database, Cpu, Globe, Zap, Shield, Search } from 'lucide-react';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[#0F1419] text-[#F5F0EB]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1419]/90 backdrop-blur-md border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">🕉️</span>
                        <span className="font-bold text-xl text-[#F5F0EB] tracking-tight">AI Pandit</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#C4B8AD]">
                        <a href="#accuracy" className="hover:text-[#D4AF37] transition-colors">Accuracy</a>
                        <a href="#methodology" className="hover:text-[#D4AF37] transition-colors">Methodology</a>
                        <a href="#testimonials" className="hover:text-[#D4AF37] transition-colors">Case Studies</a>
                        <a href="#pricing" className="hover:text-[#D4AF37] transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-[#C4B8AD] hover:text-[#D4AF37] text-sm font-medium transition-colors">
                                    Login
                                </button>
                            </SignInButton>
                            <Link
                                href="/sign-up"
                                className="bg-[#D4AF37] hover:bg-[#C9A961] text-[#0F1419] px-5 py-2 rounded-lg font-bold text-sm transition-all"
                            >
                                Start Analysis
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link
                                href="/dashboard"
                                className="text-[#D4AF37] text-sm font-medium border border-[#D4AF37]/30 px-4 py-1.5 rounded-lg hover:bg-[#D4AF37]/10 transition-all"
                            >
                                Dashboard
                            </Link>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: 'w-8 h-8 rounded-lg'
                                    }
                                }}
                            />
                        </SignedIn>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2D7A5C]/10 border border-[#2D7A5C]/20 rounded-full text-[#2D7A5C] text-xs font-semibold tracking-wide mb-8">
                        <span className="w-1.5 h-1.5 bg-[#2D7A5C] rounded-full animate-pulse"></span>
                        SYSTEM ONLINE: SWISS EPHEMERIS ACTIVE
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-white">
                        Astrology is Math.<br />
                        <span className="text-[#D4AF37]">Most Birth Times Are Wrong.</span>
                    </h1>

                    <p className="text-xl text-[#C4B8AD] mb-10 max-w-2xl mx-auto leading-relaxed">
                        We use <span className="text-[#F5F0EB] font-semibold">Swiss Ephemeris</span> astronomy and <span className="text-[#F5F0EB] font-semibold">DeepSeek AI</span> to mathematically verify your birth time down to the second against your life events.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/sign-up"
                            className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#C9A961] text-[#0F1419] px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-lg shadow-[#D4AF37]/20"
                        >
                            Fix My Birth Time →
                        </Link>
                        <a
                            href="#methodology"
                            className="w-full sm:w-auto bg-[#1A1F2E] text-[#F5F0EB] border border-[#3A4452] px-8 py-4 rounded-xl font-semibold hover:border-[#D4AF37]/50 transition-all"
                        >
                            How It Works
                        </a>
                    </div>

                    <p className="mt-6 text-sm text-[#8C7F72]">
                        100% Automated • Instant Results • Mathematical Precision
                    </p>
                </div>
            </section>

            {/* Trust/Tech Grid */}
            <section className="border-y border-[#1A1F2E] bg-[#0A0C10]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <p className="text-center text-xs font-mono text-[#8C7F72] uppercase tracking-widest mb-8">
                        Powered By Industry Standard Technologies
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Swiss Eph */}
                        <div className="flex flex-col items-center gap-2">
                            <Globe className="w-8 h-8 text-[#D4AF37]" />
                            <span className="font-bold text-[#F5F0EB]">Swiss Ephemeris</span>
                            <span className="text-xs text-[#8C7F72]">Planetary Computing</span>
                        </div>
                        {/* DeepSeek */}
                        <div className="flex flex-col items-center gap-2">
                            <Cpu className="w-8 h-8 text-[#D4AF37]" />
                            <span className="font-bold text-[#F5F0EB]">DeepSeek R1</span>
                            <span className="text-xs text-[#8C7F72]">Reasoning Engine</span>
                        </div>
                        {/* Vercel/Next */}
                        <div className="flex flex-col items-center gap-2">
                            <Zap className="w-8 h-8 text-[#D4AF37]" />
                            <span className="font-bold text-[#F5F0EB]">Real-Time Core</span>
                            <span className="text-xs text-[#8C7F72]">Latency &lt; 50ms</span>
                        </div>
                        {/* Security */}
                        <div className="flex flex-col items-center gap-2">
                            <Database className="w-8 h-8 text-[#D4AF37]" />
                            <span className="font-bold text-[#F5F0EB]">AES-256</span>
                            <span className="text-xs text-[#8C7F72]">Encrypted Data</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Problem */}
            <section id="accuracy" className="py-24 bg-[#0F1419]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-[#D4AF37] font-bold tracking-wider text-sm uppercase mb-2 block">The Hidden Problem</span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Your Chart is Likely<br />Incorrect.</h2>
                            <p className="text-[#C4B8AD] text-lg mb-6 leading-relaxed">
                                Most people round their birth time to the nearest 5 or 15 minutes. In Vedic Astrology, a <strong>2-minute error</strong> changes your Divisional Charts (D9, D10, D60).
                            </p>
                            <p className="text-[#C4B8AD] text-lg mb-8 leading-relaxed">
                                This means the predictions you receive about career, marriage, and health are often based on a completely different chart.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-[#1A1F2E] rounded-xl border border-[#D4AF37]/10">
                                    <div className="mt-1 bg-[#EF4444]/10 p-2 rounded-lg text-[#EF4444]">⚠️</div>
                                    <div>
                                        <h4 className="font-bold text-[#F5F0EB] text-sm">Wrong D9 / D60 Charts</h4>
                                        <p className="text-xs text-[#8C7F72] mt-1">High-level charts change every 1-2 minutes. Finer details are lost.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-[#1A1F2E] rounded-xl border border-[#D4AF37]/10">
                                    <div className="mt-1 bg-[#F97316]/10 p-2 rounded-lg text-[#F97316]">📉</div>
                                    <div>
                                        <h4 className="font-bold text-[#F5F0EB] text-sm">Inaccurate Dasha Timing</h4>
                                        <p className="text-xs text-[#8C7F72] mt-1">1 degree of Moon error = months of timing error in predictions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            {/* Abstract Chart Graphic */}
                            <div className="aspect-square rounded-full border border-[#D4AF37]/20 relative animate-spin-slow">
                                <div className="absolute inset-4 rounded-full border border-[#D4AF37]/10 border-dashed"></div>
                                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#D4AF37] rounded-full shadow-[0_0_30px_#D4AF37]"></div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-[#0F1419]/90 backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-2xl">
                                <div className="text-sm text-[#8C7F72] mb-1">Time Precision</div>
                                <div className="text-4xl font-mono font-bold text-[#D4AF37]">±3s</div>
                                <div className="text-xs text-[#2D7A5C] mt-2 font-medium">● Verified</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Methodology */}
            <section id="methodology" className="py-24 bg-[#1A1F2E]/30 border-y border-[#333]/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-[#D4AF37] font-bold tracking-wider text-sm uppercase mb-2 block">Our Technology</span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">How We Fix It.</h2>
                        <p className="text-[#C4B8AD] max-w-2xl mx-auto">
                            We don't guess. We calculate. Our engine runs your chart through 15 layers of verification.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="glass-card p-8 group hover:border-[#D4AF37]/30 transition-colors">
                            <div className="bg-[#D4AF37]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-[#D4AF37]">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">Swiss Ephemeris Engine</h3>
                            <p className="text-sm text-[#C4B8AD] leading-relaxed">
                                We use the actual NASA JPL data (DE431) for planetary positions. This is the same engine used by professional astronomy software, accurate to <span className="text-[#D4AF37]">0.0001 arc-seconds</span>.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="glass-card p-8 group hover:border-[#D4AF37]/30 transition-colors">
                            <div className="bg-[#6A0572]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-[#D4AF37]">
                                <Search className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">Multi-Dasha Sync</h3>
                            <p className="text-sm text-[#C4B8AD] leading-relaxed">
                                A correct birth time must match events across multiple systems. We simultaneously verify <strong>Vimshottari, Yogini, and Chara Dasha</strong> to find the single second where all three align.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="glass-card p-8 group hover:border-[#D4AF37]/30 transition-colors">
                            <div className="bg-[#2D7A5C]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-[#D4AF37]">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">Tattwa Shodhana</h3>
                            <p className="text-sm text-[#C4B8AD] leading-relaxed">
                                We apply the ancient "Tattwa Shodhana" (Elemental Verification) method to cross-verify your gender and birth day with the ruling element of the time, acting as a final fail-safe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <TestimonialsSection />

            {/* Final CTA */}
            <section className="py-24 relative overflow-hidden bg-[#0F1419]">
                <div className="absolute inset-0 bg-[#D4AF37]/5" />
                <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Stop Trusting a Broken Chart.
                    </h2>
                    <p className="text-xl text-[#C4B8AD] mb-10">
                        Get the precision you need for accurate predictions.
                        <br />
                        Rectify your birth time to the second now.
                    </p>
                    <Link
                        href="/sign-up"
                        className="inline-block bg-[#D4AF37] hover:bg-[#C9A961] text-[#0F1419] px-10 py-5 rounded-xl font-bold text-xl transition-transform hover:-translate-y-1 shadow-[0_10px_40px_rgba(212,175,55,0.2)]"
                    >
                        Start Rectification Analysis →
                    </Link>
                    <p className="mt-6 text-sm text-[#555]">
                        Secure. Private. Verified.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-[#333] bg-[#0A0C10] text-[#666] text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <span className="font-bold text-[#888]">AI Pandit</span> © 2025
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[#D4AF37]">Privacy</a>
                        <a href="#" className="hover:text-[#D4AF37]">Terms</a>
                        <a href="#" className="hover:text-[#D4AF37]">Contact</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
