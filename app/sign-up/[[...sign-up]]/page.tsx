// app/sign-up/[[...sign-up]]/page.tsx
// Clerk Sign Up Page - Unified Design System

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
    return (
        <main className="min-h-screen bg-[#0A0F1C] flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-stars opacity-20" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

            {/* Logo */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 group z-20">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#E8C54D] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🕉️</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] bg-clip-text text-transparent">
                    AI Pandit
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md px-4">
                <SignUp
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'bg-[#1A1F2E] border border-[#2A3442] shadow-2xl rounded-2xl',
                            headerTitle: 'text-[#F5F0EB] font-bold text-xl',
                            headerSubtitle: 'text-[#8C7F72]',
                            formFieldLabel: 'text-[#C4B8AD] text-sm font-medium',
                            formFieldInput: 'bg-[#0F1419] border-[#2A3442] text-[#F5F0EB] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl',
                            formButtonPrimary: 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:opacity-90 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]',
                            footerActionLink: 'text-[#D4AF37] hover:text-[#E8C54D]',
                            identityPreviewEditButton: 'text-[#D4AF37]',
                            formFieldSuccessText: 'text-[#2D7A5C]',
                            alertText: 'text-[#EF4444]',
                            dividerLine: 'bg-[#2A3442]',
                            dividerText: 'text-[#5A6475]',
                            socialButtonsBlockButton: 'border-[#2A3442] text-[#C4B8AD] hover:bg-[#2A3442] hover:border-[#3A4555]',
                            socialButtonsBlockButtonText: 'text-[#C4B8AD]',
                            formFieldErrorText: 'text-[#EF4444]',
                            formResendCodeLink: 'text-[#D4AF37] hover:text-[#E8C54D]',
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    afterSignUpUrl="/dashboard"
                />
            </div>
        </main>
    );
}
