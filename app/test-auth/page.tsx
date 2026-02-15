import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md px-4">
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    afterSignInUrl="/dashboard"
                />
            </div>
        </main>
    );
}
