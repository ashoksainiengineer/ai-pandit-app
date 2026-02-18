import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(184,134,11,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(184,134,11,0.03)_0%,transparent_50%)]" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#B8860B]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4A853]/5 rounded-full blur-3xl" />

            {/* Logo */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 group z-20">
                <span className="font-bold text-2xl bg-gradient-to-r from-[#B8860B] to-[#D4A853] bg-clip-text text-transparent">
                    AI Pandit
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md px-4 mt-8">
                <SignIn
                    appearance={{
                        variables: {
                            colorPrimary: '#B8860B',
                            colorBackground: '#FFFFFF',
                            colorInputBackground: '#FDF8F3',
                            colorInputText: '#1A1612',
                            colorText: '#1A1612',
                            colorTextSecondary: '#7A756F',
                            colorNeutral: '#F0E8DE',
                            colorDanger: '#C65D3B',
                            colorSuccess: '#2D7A5C',
                            borderRadius: '0.75rem',
                        },
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'bg-white border-2 border-[#F0E8DE] shadow-xl rounded-2xl overflow-hidden',
                            
                            // Header
                            header: 'p-6 pb-4',
                            headerTitle: 'text-[#1A1612] font-bold text-2xl mb-1',
                            headerSubtitle: 'text-[#7A756F] text-sm',
                            
                            // Form
                            form: 'p-6 pt-2',
                            formButtonPrimary: 'w-full bg-gradient-to-r from-[#B8860B] to-[#D4A853] hover:from-[#9A7609] hover:to-[#C49843] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#B8860B]/20',
                            
                            // Input fields - CRITICAL FOR VISIBILITY
                            formFieldLabel: 'text-[#1A1612] text-sm font-semibold mb-2 block',
                            formFieldInput: 'w-full bg-white border-2 border-[#E5E0D8] text-[#1A1612] placeholder-[#A8A39D] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 rounded-xl py-3 px-4 text-base outline-none transition-all',
                            formFieldInputShowPassword: 'text-[#7A756F] hover:text-[#B8860B]',
                            formFieldInputWrapper: 'relative',
                            
                            // Required/Optional indicators - hide optional text completely
                            formFieldLabel__optional: 'hidden',
                            
                            // Error/Success states
                            formFieldErrorText: 'text-[#C65D3B] text-xs mt-1 font-medium',
                            formFieldSuccessText: 'text-[#2D7A5C] text-xs mt-1 font-medium',
                            formFieldHintText: 'text-[#7A756F] text-xs mt-1',
                            alertText: 'text-[#C65D3B] text-sm',
                            alert: 'bg-red-50 border border-red-200 rounded-xl p-4 mb-4',
                            
                            // Links
                            footer: 'p-6 pt-4 bg-[#FAF8F5] border-t border-[#F0E8DE]',
                            footerAction: 'text-center text-sm text-[#7A756F]',
                            footerActionLink: 'text-[#B8860B] font-semibold hover:text-[#9A7609] transition-colors',
                            
                            // Social buttons
                            socialButtonsBlockButton: 'w-full border-2 border-[#E5E0D8] bg-white text-[#4A453F] hover:bg-[#FDF8F3] hover:border-[#D4A853]/30 py-3 rounded-xl transition-all font-medium',
                            socialButtonsBlockButtonText: 'text-[#4A453F] font-medium',
                            socialButtonsProviderIcon: 'w-5 h-5',
                            
                            // Divider
                            dividerLine: 'bg-[#E5E0D8]',
                            dividerText: 'text-[#7A756F] text-sm bg-[#FFFFFF] px-4',
                            dividerRow: 'my-4',
                            
                            // Identity preview
                            identityPreview: 'bg-[#FDF8F3] border border-[#E5E0D8] rounded-xl p-4 mb-4',
                            identityPreviewText: 'text-[#1A1612]',
                            identityPreviewEditButton: 'text-[#B8860B] font-medium hover:text-[#9A7609]',
                            
                            // Other
                            formResendCodeLink: 'text-[#B8860B] font-medium hover:text-[#9A7609]',
                            otpCodeField: 'text-[#1A1612] text-xl font-bold text-center',
                            otpCodeFieldInput: 'bg-white border-2 border-[#E5E0D8] rounded-xl text-[#1A1612] text-xl font-bold',
                        }
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#7A756F] z-10">
                <Link href="/" className="hover:text-[#B8860B] transition-colors">← Back to Home</Link>
            </div>
        </main>
    );
}
