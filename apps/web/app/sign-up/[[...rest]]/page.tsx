// app/sign-up/[[...sign-up]]/page.tsx
// Clerk Sign Up Page - Unified Design System

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import '@/app/prism-design-system.css';

export default function SignUpPage() {
    return (
        <main className="min-h-screen bg-prism-canvas flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(198,121,196,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(3,88,247,0.03)_0%,transparent_50%)]" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-prism-rose-quartz/5 via-prism-marigold/5 to-prism-signal-blue/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-prism-crimson/5 via-prism-lavender/5 to-prism-hot-pink/5 rounded-full blur-3xl" />

            {/* Logo */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 group z-20">
                <span className="font-prism font-medium text-2xl text-prism-ink">
                    AI Pandit
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md px-4 mt-8">
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: '#000000',
                            colorBackground: '#FFFFFF',
                            colorInputBackground: '#f8f8f8',
                            colorInputText: '#000000',
                            colorText: '#000000',
                            colorTextSecondary: '#636363',
                            colorNeutral: '#d9d9d9',
                            colorDanger: '#C65D3B',
                            colorSuccess: '#184131',
                            borderRadius: '1rem',
                        },
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'bg-white border-2 border-prism-pebble shadow-xl rounded-2xl overflow-hidden',
                            
                            // Header
                            header: 'p-6 pb-4',
                            headerTitle: 'text-prism-ink font-medium text-2xl mb-1',
                            headerSubtitle: 'text-prism-graphite text-sm',
                            
                            // Form
                            form: 'p-6 pt-2',
                            formButtonPrimary: 'w-full bg-gradient-to-r from-[#000000] to-[#000000] hover:from-[#9A7609] hover:to-[#C49843] text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-[#000000]/20',
                            
                            // Input fields - CRITICAL FOR VISIBILITY
                            formFieldLabel: 'text-prism-ink text-sm font-medium mb-2 block',
                            formFieldInput: 'w-full bg-white border-2 border-prism-pebble text-prism-ink placeholder-prism-slate focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 rounded-xl py-3 px-4 text-base outline-none transition-all',
                            formFieldInputShowPassword: 'text-prism-graphite hover:text-[#000000]',
                            formFieldInputWrapper: 'relative',
                            
                            // Required/Optional indicators - hide optional text completely
                            formFieldLabel__optional: 'hidden',
                            
                            // Error/Success states
                            formFieldErrorText: 'text-[#C65D3B] text-xs mt-1 font-medium',
                            formFieldSuccessText: 'text-[#184131] text-xs mt-1 font-medium',
                            formFieldHintText: 'text-prism-graphite text-xs mt-1',
                            alertText: 'text-[#C65D3B] text-sm',
                            alert: 'bg-red-50 border border-red-200 rounded-xl p-4 mb-4',
                            
                            // Links
                            footer: 'p-6 pt-4 bg-prism-canvas border-t border-prism-pebble',
                            footerAction: 'text-center text-sm text-prism-graphite',
                            footerActionLink: 'text-[#000000] font-medium hover:text-[#9A7609] transition-colors',
                            
                            // Social buttons
                            socialButtonsBlockButton: 'w-full border-2 border-prism-pebble bg-white text-prism-graphite hover:bg-prism-canvas hover:border-[#000000]/30 py-3 rounded-xl transition-all font-medium',
                            socialButtonsBlockButtonText: 'text-prism-graphite font-medium',
                            socialButtonsProviderIcon: 'w-5 h-5',
                            
                            // Divider
                            dividerLine: 'bg-prism-pebble',
                            dividerText: 'text-prism-graphite text-sm bg-white px-4',
                            dividerRow: 'my-4',
                            
                            // Identity preview
                            identityPreview: 'bg-prism-canvas border border-prism-pebble rounded-xl p-4 mb-4',
                            identityPreviewText: 'text-prism-ink',
                            identityPreviewEditButton: 'text-[#000000] font-medium hover:text-[#9A7609]',
                            
                            // Other
                            formResendCodeLink: 'text-[#000000] font-medium hover:text-[#9A7609]',
                            otpCodeField: 'text-prism-ink text-xl font-medium text-center',
                            otpCodeFieldInput: 'bg-white border-2 border-prism-pebble rounded-xl text-prism-ink text-xl font-medium',
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-prism-graphite z-10">
                <Link href="/" className="hover:text-prism-ink transition-colors">← Back to Home</Link>
            </div>
        </main>
    );
}
