/**
 * Terms of Service Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, FileText, AlertCircle, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | AI Pandit',
  description: 'Terms and conditions for using AI Pandit birth time rectification services.',
};

export default function TermsPage() {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#B8860B] to-[#D4A853] flex items-center justify-center">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-[#1A1612] mb-4">
            Terms of Service
          </h1>
          <p className="text-[#7A756F] max-w-2xl mx-auto">
            Please read these terms carefully before using AI Pandit services. By using our platform, you agree to these terms.
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#B8860B]" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Introduction
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed">
              AI Pandit provides AI-powered birth time rectification services based on Vedic astrology principles. Our platform uses Swiss Ephemeris data and advanced machine learning algorithms to provide accurate astrological calculations. These terms govern your use of our website, services, and any related applications.
            </p>
          </section>

          {/* Spiritual Guidance Disclaimer */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Spiritual Guidance Disclaimer
              </h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-800 font-medium text-sm mb-2">Important Notice</p>
              <p className="text-amber-700 text-sm">
                The birth time rectification and astrological analysis provided by AI Pandit are for spiritual guidance and informational purposes only. They should not be considered as:
              </p>
            </div>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>A substitute for professional astrological consultation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Legal, medical, financial, or professional advice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>A basis for making critical life decisions without human consultation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>Scientific or factual predictions about future events</span>
              </li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                User Responsibilities
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              When using AI Pandit, you agree to:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Provide accurate birth information to the best of your knowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Use the service for lawful purposes only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Respect the intellectual property rights of our platform</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Not attempt to reverse engineer or misuse our AI systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Be at least 18 years of age or have parental consent</span>
              </li>
            </ul>
          </section>

          {/* Data Accuracy */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-4">
              Data Accuracy & Limitations
            </h2>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              While we strive for the highest accuracy in our calculations using Swiss Ephemeris data, please note:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-[#6B1F7A] mt-1">•</span>
                <span>Rectification results depend on the accuracy of provided life events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6B1F7A] mt-1">•</span>
                <span>AI analysis has inherent limitations and should be used as guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6B1F7A] mt-1">•</span>
                <span>Historical timezone and location data may have uncertainties</span>
              </li>
            </ul>
          </section>

          {/* Service Availability */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-4">
              Service Availability
            </h2>
            <p className="text-[#4A453F] leading-relaxed">
              We aim to maintain high availability of our services, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or factors beyond our control. Analysis processing times may vary based on system load.
            </p>
          </section>

          {/* Modifications */}
          <section className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl p-8 border border-[#F0E8DE]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-4">
              Modifications to Terms
            </h2>
            <p className="text-[#4A453F] mb-4">
              We may update these terms from time to time. We will notify users of significant changes via email or through our platform. Continued use of the service after changes constitutes acceptance of the updated terms.
            </p>
            <p className="text-[#4A453F]">
              For questions about these terms, please contact us at{' '}
              <a href="mailto:legal@aipandit.app" className="text-[#B8860B] hover:text-[#6B1F7A] transition-colors font-medium">
                legal@aipandit.app
              </a>
            </p>
          </section>
        </div>

        <p className="text-center text-sm text-[#A8A39D] mt-12">
          Last updated: January 2026
        </p>
      </div>
    </main>
  );
}
