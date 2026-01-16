// app/sign-in/[[...sign-in]]/page.tsx
// Clerk Sign In Page

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[#0F1419] flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-stars opacity-20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6A0572]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'bg-[#1A1F2E] border border-[#D4AF37]/20 shadow-2xl',
                            headerTitle: 'text-[#F5F0EB]',
                            headerSubtitle: 'text-[#C4B8AD]',
                            formFieldLabel: 'text-[#C4B8AD]',
                            formFieldInput: 'bg-[#2A3442] border-[#D4AF37]/20 text-[#F5F0EB] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
                            formButtonPrimary: 'bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:opacity-90 text-[#0F1419] font-semibold',
                            footerActionLink: 'text-[#D4AF37] hover:text-[#E8C54D]',
                            identityPreviewEditButton: 'text-[#D4AF37]',
                            formFieldSuccessText: 'text-[#2D7A5C]',
                            alertText: 'text-[#EF4444]',
                            dividerLine: 'bg-[#D4AF37]/20',
                            dividerText: 'text-[#8C7F72]',
                            socialButtonsBlockButton: 'border-[#D4AF37]/30 text-[#C4B8AD] hover:bg-[#D4AF37]/10',
                            socialButtonsBlockButtonText: 'text-[#C4B8AD]',
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
