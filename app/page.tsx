// app/page.tsx
// Landing Page - Premium Hero, Features, How It Works (NO Pricing)

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[#0F1419]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1419]/80 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">🕉️</span>
                        <span className="font-bold text-xl text-[#D4AF37]">AI Pandit</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">Features</a>
                        <a href="#how-it-works" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">How It Works</a>
                        <a href="#faq" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                            <Link
                                href="/sign-up"
                                className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                            >
                                Get Started
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link
                                href="/dashboard"
                                className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: 'w-10 h-10 border-2 border-[#D4AF37]/50'
                                    }
                                }}
                            />
                        </SignedIn>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Stars */}
                <div className="absolute inset-0 bg-stars opacity-30" />

                {/* Gradient Orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#6A0572]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 bg-[#2D7A5C] rounded-full animate-pulse" />
                        <span className="text-sm text-[#D4AF37]">World's Most Accurate BTR System</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <span className="text-[#F5F0EB]">Seconds-Level</span>
                        <br />
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] bg-clip-text text-transparent">
                            Birth Time Rectification
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-[#C4B8AD] mb-4 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <span className="text-[#D4AF37] font-mono font-bold">±3-5 Seconds</span> Accuracy.
                        <span className="text-[#2D7A5C] font-semibold"> 97-99%</span> Confidence.
                    </p>
                    <p className="text-lg text-[#8C7F72] mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Using 15 Vedic astrology methods verified by advanced AI analysis.
                        Finally know your exact birth time with precision.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <SignedOut>
                            <Link
                                href="/sign-up"
                                className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-10 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all hover:-translate-y-1"
                            >
                                Get Your Precise Birth Time →
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link
                                href="/rectify"
                                className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-10 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all hover:-translate-y-1"
                            >
                                Start New Analysis →
                            </Link>
                        </SignedIn>
                        <a
                            href="#how-it-works"
                            className="w-full sm:w-auto border-2 border-[#D4AF37]/50 text-[#D4AF37] px-8 py-4 rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all"
                        >
                            See How It Works
                        </a>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-16 flex flex-wrap justify-center gap-8 text-[#8C7F72] animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="flex items-center gap-2">
                            <span className="text-[#2D7A5C]">✓</span>
                            <span>10-Stage Algorithm</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#2D7A5C]">✓</span>
                            <span>15 Vedic Methods</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#2D7A5C]">✓</span>
                            <span>AI-Verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#2D7A5C]">✓</span>
                            <span>HH:MM:SS Precision</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F0EB] mb-4">
                            Why Choose AI Pandit?
                        </h2>
                        <p className="text-[#C4B8AD] text-lg max-w-2xl mx-auto">
                            The most advanced birth time rectification system ever built
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-card p-8 hover:border-[#D4AF37]/40 transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-3xl">⏱️</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">
                                Seconds-Level Precision
                            </h3>
                            <p className="text-[#C4B8AD]">
                                Not minutes, not hours — we calculate your birth time down to
                                <span className="text-[#D4AF37] font-semibold"> ±3-5 seconds</span>.
                                Output in HH:MM:SS format.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass-card p-8 hover:border-[#D4AF37]/40 transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#6A0572]/20 to-[#6A0572]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-3xl">🔮</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">
                                15-Method Verification
                            </h3>
                            <p className="text-[#C4B8AD]">
                                Vimshottari, Yogini, Chara Dasha, divisional charts, transits,
                                Nakshatra analysis — all cross-verified for
                                <span className="text-[#2D7A5C] font-semibold"> 97-99% confidence</span>.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass-card p-8 hover:border-[#D4AF37]/40 transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#2D7A5C]/20 to-[#2D7A5C]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="text-3xl">🧠</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-3">
                                AI-Powered Analysis
                            </h3>
                            <p className="text-[#C4B8AD]">
                                Advanced AI with 48K thinking tokens analyzes your chart
                                at 3 progressive levels, each more precise than the last.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-[#1A1F2E]/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F0EB] mb-4">
                            10-Stage Algorithm
                        </h2>
                        <p className="text-[#C4B8AD] text-lg max-w-2xl mx-auto">
                            Progressive refinement from minutes to seconds precision
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { num: 1, title: 'Coarse Grid', desc: '5-15 min intervals', icon: '📍' },
                            { num: 2, title: 'AI Level 1', desc: '88-92% accuracy', icon: '🤖' },
                            { num: 3, title: 'Convergence', desc: 'Find best window', icon: '🎯' },
                            { num: 4, title: 'Fine Grid', desc: '30-sec intervals', icon: '⏲️' },
                            { num: 5, title: 'AI Level 2', desc: '92-96% accuracy', icon: '🧠' },
                            { num: 6, title: 'Micro Grid', desc: '6-sec intervals', icon: '🔬' },
                            { num: 7, title: 'AI Level 3', desc: '96-99% accuracy', icon: '✨' },
                            { num: 8, title: 'Verification', desc: '15 methods check', icon: '✅' },
                            { num: 9, title: 'Boundary Check', desc: 'Safety validation', icon: '🛡️' },
                            { num: 10, title: 'Final Result', desc: 'HH:MM:SS output', icon: '🏆' },
                        ].map((stage, i) => (
                            <div
                                key={stage.num}
                                className={`glass-card p-4 text-center ${i === 9 ? 'md:col-span-2 lg:col-span-1 border-[#D4AF37]/40' : ''}`}
                            >
                                <div className="text-2xl mb-2">{stage.icon}</div>
                                <div className="text-xs text-[#D4AF37] font-mono mb-1">Stage {stage.num}</div>
                                <h4 className="font-semibold text-[#F5F0EB] text-sm">{stage.title}</h4>
                                <p className="text-xs text-[#8C7F72] mt-1">{stage.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F0EB] mb-4">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: 'What is birth time rectification?',
                                a: 'Birth time rectification (BTR) is the process of determining your exact birth time using astrological analysis of life events. Many people have uncertain or incorrect birth times, which affects all astrological predictions.'
                            },
                            {
                                q: 'How accurate is ±3-5 seconds?',
                                a: 'This level of precision means we can determine your birth time to within 3-5 seconds of the actual time. This is unprecedented accuracy that matters for precise dasha calculations and divisional charts.'
                            },
                            {
                                q: 'What information do I need to provide?',
                                a: 'You\'ll need your approximate birth date, a rough estimate of birth time (even "morning" or "afternoon" works), birth location, and 2-3 major life events with dates (like marriage, career changes, etc).'
                            },
                            {
                                q: 'How long does the analysis take?',
                                a: 'The 10-stage analysis typically takes 10-60 minutes depending on the complexity. You can close the browser and check back - we\'ll notify you when complete.'
                            },
                            {
                                q: 'What methods are used for verification?',
                                a: 'We use 15 Vedic methods including Vimshottari Dasha, Yogini Dasha, Chara Dasha, all divisional charts (D2, D7, D9, D10, D30), transit analysis, Nakshatra verification, physical traits matching, and more.'
                            },
                        ].map((item, i) => (
                            <details
                                key={i}
                                className="glass-card group"
                            >
                                <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
                                    <span className="font-semibold text-[#F5F0EB]">{item.q}</span>
                                    <span className="text-[#D4AF37] group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-6 pb-6 text-[#C4B8AD]">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6A0572]/20 to-[#D4AF37]/10" />
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#F5F0EB] mb-6">
                        Ready to Discover Your Precise Birth Time?
                    </h2>
                    <p className="text-xl text-[#C4B8AD] mb-8">
                        Join thousands who have finally discovered their exact birth time with AI Pandit.
                    </p>
                    <SignedOut>
                        <Link
                            href="/sign-up"
                            className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-12 py-5 rounded-xl font-bold text-xl hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all hover:-translate-y-1"
                        >
                            Start Your Analysis Now →
                        </Link>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href="/rectify"
                            className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-12 py-5 rounded-xl font-bold text-xl hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all hover:-translate-y-1"
                        >
                            Start New Analysis →
                        </Link>
                    </SignedIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🕉️</span>
                            <span className="font-bold text-lg text-[#D4AF37]">AI Pandit</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-[#8C7F72]">
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-[#D4AF37] transition-colors">Contact</Link>
                        </div>
                        <p className="text-sm text-[#8C7F72]">
                            © 2025 AI Pandit. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
