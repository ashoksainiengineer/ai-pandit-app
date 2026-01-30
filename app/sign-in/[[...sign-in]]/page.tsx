// app/sign-in/[[...sign-in]]/page.tsx
// Clerk Sign In Page - Sacred Ivory Light Theme

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center relative overflow-hidden">
            {/* Sacred Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(184,134,11,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(107,31,122,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,124,111,0.02)_0%,transparent_60%)]" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#B8860B]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6B1F7A]/5 rounded-full blur-3xl" />

            {/* Logo */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 group z-20">
                <span className="font-bold text-xl bg-gradient-to-r from-[#B8860B] to-[#D4A853] bg-clip-text text-transparent font-[family-name:var(--font-cormorant)]">
                    AI Pandit
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md px-4">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'bg-white border border-[#F0E8DE] shadow-xl shadow-[#B8860B]/5 rounded-2xl',
                            headerTitle: 'text-[#1A1612] font-bold text-xl font-[family-name:var(--font-cormorant)]',
                            headerSubtitle: 'text-[#7A756F]',
                            formFieldLabel: 'text-[#4A453F] text-sm font-medium',
                            formFieldInput: 'bg-[#FDF8F3] border-[#EBE2D6] text-[#1A1612] focus:border-[#B8860B] focus:ring-[#B8860B]/10 rounded-xl',
                            formButtonPrimary: 'bg-gradient-to-r from-[#B8860B] to-[#D4A853] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg shadow-[#B8860B]/20',
                            footerActionLink: 'text-[#B8860B] hover:text-[#D4A853]',
                            identityPreviewEditButton: 'text-[#B8860B]',
                            formFieldSuccessText: 'text-[#2D7A5C]',
                            alertText: 'text-[#C65D3B]',
                            dividerLine: 'bg-[#F0E8DE]',
                            dividerText: 'text-[#A8A39D]',
                            socialButtonsBlockButton: 'border-[#EBE2D6] text-[#4A453F] hover:bg-[#F5EFE7] hover:border-[#D4A853]/30',
                            socialButtonsBlockButtonText: 'text-[#4A453F]',
                            formFieldErrorText: 'text-[#C65D3B]',
                            formResendCodeLink: 'text-[#B8860B] hover:text-[#D4A853]',
                        }
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    afterSignInUrl="/dashboard"
                />
            </div>
        </main>
    );
}
