/**
 * Privacy Policy Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Pandit',
  description: 'Learn how AI Pandit protects your personal data and birth information with end-to-end encryption.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FFFCF8]">
      {/* Header */}
      <div className="bg-white border-b border-[#F0E8DE]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#7A756F] hover:text-[#B8860B] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#6B1F7A] to-[#8B4A9C] flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-[#1A1612] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#7A756F] max-w-2xl mx-auto">
            Your trust is our highest priority. We employ military-grade encryption and strict data protection practices to safeguard your personal and astrological information.
          </p>
        </div>

        <div className="space-y-8">
          {/* End-to-End Encryption */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                End-to-End Encryption
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              All your personal data—including birth details, life events, and astrological calculations—is protected with AES-256 end-to-end encryption. This means:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Your data is encrypted before it leaves your device</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Only you can decrypt and access your information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Even our team cannot access your decrypted data</span>
              </li>
            </ul>
          </section>

          {/* Data Collection */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                What We Collect
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              We only collect information necessary for birth time rectification:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-[#B8860B] mt-1">•</span>
                <span>Birth date, time (approximate), and location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B8860B] mt-1">•</span>
                <span>Life events for correlation (optional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B8860B] mt-1">•</span>
                <span>Contact information for account management</span>
              </li>
            </ul>
          </section>

          {/* Data Storage */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Data Storage & Security
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              Your encrypted data is stored on secure servers with industry-leading security practices:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Turso (libSQL) database with encryption at rest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Regular security audits and penetration testing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>GDPR and CCPA compliant data handling</span>
              </li>
            </ul>
          </section>

          {/* Data Deletion */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Your Right to Delete
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed">
              You have complete control over your data. You can request deletion of all your personal information at any time through your dashboard or by contacting our support team. Upon deletion, all your encrypted data is permanently removed from our servers within 30 days.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl p-8 border border-[#F0E8DE]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-[#4A453F] mb-4">
              If you have any questions about our privacy practices or would like to exercise your data rights, please contact us:
            </p>
            <a 
              href="mailto:privacy@aipandit.app" 
              className="inline-flex items-center gap-2 text-[#B8860B] hover:text-[#6B1F7A] transition-colors font-medium"
            >
              privacy@aipandit.app
            </a>
          </section>
        </div>

        <p className="text-center text-sm text-[#A8A39D] mt-12">
          Last updated: January 2026
        </p>
      </div>
    </main>
  );
}
