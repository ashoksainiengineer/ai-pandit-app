import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import '@/app/prism-design-system.css';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-prism-canvas flex items-center justify-center relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md px-4">
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </main>
    );
}
