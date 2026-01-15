'use client';

import { useAuth, SignInButton, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  onAuthRequired?: () => void;
}

export default function AuthWrapper({ children, onAuthRequired }: AuthWrapperProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Check if we have form data in storage
      const hasFormData = 
        localStorage.getItem('btr_birth_data') || 
        localStorage.getItem('btr_physical_data') || 
        localStorage.getItem('btr_events_data');
      
      if (hasFormData) {
        setShowAuthPrompt(true);
        onAuthRequired?.();
      }
    }
  }, [isLoaded, isSignedIn, onAuthRequired]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuthPrompt && !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-8">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-4">Sign in to See Your Results</h2>
          <p className="text-slate-400 mb-8">
            We need to save your birth time rectification analysis. Please sign in to continue.
          </p>
          <SignInButton mode="modal">
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Sign In to Continue
            </button>
          </SignInButton>
          <p className="text-sm text-slate-500 mt-4">
            Your data is secure and will be saved to your account.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}