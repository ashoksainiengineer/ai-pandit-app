/**
 * Terms of Service Page
 * Comprehensive Terms for AI Pandit Services
 * Last Updated: January 2026
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, FileText, AlertCircle, BookOpen, Shield, Cpu, Globe, Ban, DollarSign, Brain } from 'lucide-react';
import '@/app/prism-design-system.css';

export const metadata: Metadata = {
  title: 'Terms of Service | AI Pandit',
  description: 'Comprehensive terms and conditions for using AI Pandit birth time rectification services. Includes AI processing consent, privacy practices, and user responsibilities.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-dia-bg">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-black/10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-black/60 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-dia-xl bg-black flex items-center justify-center">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-light text-black mb-4">
            Terms of Service
          </h1>
          <p className="text-black/60 max-w-2xl mx-auto">
            Please read these terms carefully before using AI Pandit services. By using our platform, you agree to be bound by these terms.
          </p>
          <p className="text-sm text-black/60 mt-4">
            Last updated: January 31, 2026 | Version 3.0
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-black/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Introduction & Acceptance
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              AI Pandit provides AI-powered birth time rectification services based on Vedic astrology principles. Our platform uses Skyfield ephemeris data and advanced machine learning algorithms to provide accurate astrological calculations.
            </p>
            <p className="text-black/60 leading-relaxed">
              By accessing or using AI Pandit, you agree to these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </section>

          {/* AI Processing Consent - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-indigo-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                AI Processing Consent
              </h2>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-dia-lg p-4 mb-4">
              <p className="text-indigo-800 font-medium text-sm mb-2">Important Notice About AI Processing</p>
              <p className="text-indigo-700 text-sm">
                Our birth time rectification service uses Artificial Intelligence to analyze your astrological data. By using our service, you explicitly consent to:
              </p>
            </div>
            <ul className="space-y-3 text-black/60">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span><strong>Data Processing:</strong> Your birth data (date, time, coordinates), life events, and forensic traits will be processed by AI systems to perform astrological analysis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span><strong>Anonymization:</strong> Your name and exact location are anonymized before being sent to AI systems. Real names are replaced with <code>[REDACTED_NAME]</code> markers, emails with <code>[REDACTED_EMAIL]</code>, and phone numbers with <code>[REDACTED_PHONE]</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span><strong>Third-Party AI Providers:</strong> Your anonymized astrological data may be processed by Groq (GPT-OSS-120B) or via OpenRouter (DeepSeek). Both providers process your data solely for birth time rectification.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span><strong>Data Exclusions:</strong> Health information is explicitly excluded from AI processing. Spouse names are anonymized; only birth data (DOB, time, coordinates) is shared for synastry analysis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span><strong>No Training Use:</strong> Your data is not used to train AI models or improve third-party AI services.</span>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Withdrawal of Consent:</strong> You may withdraw your AI processing consent at any time by deleting your account or contacting us. This will prevent future analyses but will not affect completed analyses.
              </p>
            </div>
          </section>

          {/* What Data is Shared with AI - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-blue-100 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Data Shared with AI Systems
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              For transparency, here is exactly what data is shared with AI systems during analysis:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-800 mb-2">✓ Data That IS Shared</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Anonymized data with PII redacted ([REDACTED_NAME])</li>
                  <li>• Anonymized data with PII redacted ([REDACTED_NAME])</li>
                  <li>• Birth date, time, coordinates</li>
                  <li>• Life event dates & descriptions</li>
                  <li>• Forensic traits (physical/psychological)</li>
                  <li>• Spouse birth data (DOB/time/coords)</li>
                  <li>• Skyfield ephemeris calculations</li>
                  <li>• Birth date, time, coordinates</li>
                  <li>• Life event dates & descriptions</li>
                  <li>• Forensic traits (physical/psychological)</li>
                  <li>• Spouse birth data (DOB/time/coords)</li>
                  <li>• Skyfield ephemeris calculations</li>
                  <li>• Anonymous user ID (pseudonym)</li>
                  <li>• Birth date, time, coordinates</li>
                  <li>• Life event dates & descriptions</li>
                  <li>• Forensic traits (physical/psychological)</li>
                  <li>• Spouse birth data (DOB/time/coords)</li>
                  <li>• Skyfield ephemeris calculations</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">✗ Data That is NEVER Shared</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your real name</li>
                  <li>• Exact address/location string</li>
                  <li>• Health conditions</li>
                  <li>• Spouse&apos;s real name</li>
                  <li>• Email address</li>
                  <li>• Phone number</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-black/60">
              All data shared with AI systems is anonymized and used solely for the purpose of birth time rectification. We do not share your data with AI providers for any other purpose.
            </p>
          </section>

          {/* Spiritual Guidance Disclaimer */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Spiritual Guidance Disclaimer
              </h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-dia-lg p-4 mb-4">
              <p className="text-amber-800 font-medium text-sm mb-2">Important Notice</p>
              <p className="text-amber-700 text-sm">
                The birth time rectification and astrological analysis provided by AI Pandit are for spiritual guidance and informational purposes only. They should not be considered as:
              </p>
            </div>
            <ul className="space-y-2 text-black/60">
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
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>A guarantee of specific results or outcomes</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-black/60">
              You acknowledge that astrology is a spiritual practice and results may vary. AI Pandit makes no warranties about the accuracy, reliability, or applicability of the analysis provided.
            </p>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                User Responsibilities
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              When using AI Pandit, you agree to:
            </p>
            <ul className="space-y-2 text-black/60">
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
                <span>Not attempt to reverse engineer, scrape, or misuse our AI systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Be at least 18 years of age or have parental consent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Obtain consent from your spouse before entering their birth data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Not use the service to process data about others without their consent</span>
              </li>
            </ul>
          </section>

          {/* Data Accuracy & Limitations */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <h2 className="text-2xl font-light text-black mb-4">
              Data Accuracy & Limitations
            </h2>
            <p className="text-black/60 leading-relaxed mb-4">
              While we strive for the highest accuracy in our calculations using Skyfield ephemeris data, please note:
            </p>
            <ul className="space-y-2 text-black/60">
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">•</span>
                <span>Rectification results depend on the accuracy of provided life events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">•</span>
                <span>AI analysis has inherent limitations and should be used as guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">•</span>
                <span>Historical timezone and location data may have uncertainties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">•</span>
                <span>Results are probabilistic, not deterministic</span>
              </li>
            </ul>
          </section>

          {/* Limitation of Liability - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-red-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Limitation of Liability
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              To the fullest extent permitted by applicable law:
            </p>
            <ul className="space-y-2 text-black/60">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>AI Pandit and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Our total liability shall not exceed the amount you paid for the specific analysis that gave rise to the liability.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>We are not responsible for decisions you make based on our analysis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>We do not guarantee continuous, uninterrupted, or secure access to our services.</span>
              </li>
            </ul>
          </section>

          {/* Refund Policy - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Payment & Refund Policy
              </h2>
            </div>
            <ul className="space-y-2 text-black/60">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>All payments are processed securely through Razorpay.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Once an analysis begins processing, refunds are not available as computational resources have been allocated.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>If technical issues prevent analysis completion, we will either reprocess at no charge or provide a full refund.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Refund requests must be made within 7 days of payment.</span>
              </li>
            </ul>
          </section>

          {/* Termination - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-orange-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Termination & Suspension
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to AI Pandit at our discretion, without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.
            </p>
            <p className="text-black/60 leading-relaxed">
              Upon termination, your right to use the service immediately ceases. Provisions of these terms that by their nature should survive termination shall survive.
            </p>
          </section>

          {/* Governing Law - NEW SECTION */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-dia-lg bg-black/5 flex items-center justify-center">
                <Globe className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Governing Law & Jurisdiction
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.
            </p>
          </section>

          {/* Service Availability */}
          <section className="bg-white/90 backdrop-blur-xl rounded-dia-xl p-8 border border-black/10">
            <h2 className="text-2xl font-light text-black mb-4">
              Service Availability
            </h2>
            <p className="text-black/60 leading-relaxed">
              We aim to maintain high availability of our services, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or factors beyond our control. Analysis processing times may vary based on system load.
            </p>
          </section>

          {/* Modifications */}
          <section className="bg-white rounded-dia-xl p-8 border border-black/10">
            <h2 className="text-2xl font-light text-black mb-4">
              Modifications to Terms
            </h2>
            <p className="text-black/60 mb-4">
              We may update these terms from time to time. We will notify users of significant changes via email or through our platform. Continued use of the service after changes constitutes acceptance of the updated terms.
            </p>
            <p className="text-black/60">
              For questions about these terms, please contact us at{' '}
              <a href="mailto:legal@aipandit.app" className="text-black hover:text-black/60 transition-colors font-medium">
                legal@aipandit.app
              </a>
            </p>
          </section>
        </div>

        <p className="text-center text-sm text-black/60 mt-12">
          © 2026 AI Pandit. All rights reserved.
        </p>
      </div>
    </main>
  );
}
