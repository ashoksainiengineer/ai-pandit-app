/**
 * Privacy Policy Page - Comprehensive Data Protection Information
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, FileText, Server, Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Pandit',
  description: 'Learn how AI Pandit protects your personal data and birth information with military-grade encryption.',
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
              All your personal data is protected with AES-256 end-to-end encryption. We use your unique authentication key to encrypt sensitive information, ensuring:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Your data is encrypted before storage in our database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Only you can decrypt and access your information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Even our team cannot access your decrypted data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">✓</span>
                <span>Encryption keys are never stored alongside encrypted data</span>
              </li>
            </ul>
          </section>

          {/* Data We Collect - Detailed Table */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Data We Collect & Store
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-6">
              We collect only the information necessary for birth time rectification. Below is a complete breakdown of what data we store and how it's protected:
            </p>

            {/* Data Collection Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FDF8F3] border-b border-[#E8E0D5]">
                    <th className="text-left p-3 font-semibold text-[#1A1612]">Data Category</th>
                    <th className="text-left p-3 font-semibold text-[#1A1612]">Fields</th>
                    <th className="text-left p-3 font-semibold text-[#1A1612]">Storage</th>
                    <th className="text-left p-3 font-semibold text-[#1A1612]">Encrypted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8DE]">
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Birth Information</td>
                    <td className="p-3 text-[#7A756F]">Full Name, Date of Birth, Birth Time, Birth Place</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Location Coordinates</td>
                    <td className="p-3 text-[#7A756F]">Latitude, Longitude, Timezone</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain (needed for calculations)</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Personal Traits</td>
                    <td className="p-3 text-[#7A756F]">Height, Build, Complexion, Eye Color, Hair Type, Special Features</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Forensic Traits</td>
                    <td className="p-3 text-[#7A756F]">Facial Structure, Skin/Hair, Psychographic, Biological, Family Details</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Life Events</td>
                    <td className="p-3 text-[#7A756F]">Category, Date, Description, Importance, Time Precision</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Spouse Data</td>
                    <td className="p-3 text-[#7A756F]">Name, Date of Birth, Birth Time, Birth Place (optional)</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Analysis Settings</td>
                    <td className="p-3 text-[#7A756F]">Time Offset Preset, Custom Minutes</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#4A453F] font-medium">Account Info</td>
                    <td className="p-3 text-[#7A756F]">Email, Full Name (from Clerk authentication)</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only location coordinates (latitude/longitude) and analysis settings are stored unencrypted, as they are required for astrological calculations. All personal identifying information is always encrypted.
              </p>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                How We Use Your Data
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FDF8F3] rounded-lg">
                <h3 className="font-semibold text-[#1A1612] mb-2">Birth Time Rectification</h3>
                <p className="text-sm text-[#7A756F]">Your birth data and life events are analyzed by our AI to determine your precise birth time.</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-lg">
                <h3 className="font-semibold text-[#1A1612] mb-2">Session Management</h3>
                <p className="text-sm text-[#7A756F]">Your draft data is saved so you can resume your analysis later.</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-lg">
                <h3 className="font-semibold text-[#1A1612] mb-2">Account Authentication</h3>
                <p className="text-sm text-[#7A756F]">Email and name from Clerk are used for login and account identification only.</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-lg">
                <h3 className="font-semibold text-[#1A1612] mb-2">What We DON'T Do</h3>
                <p className="text-sm text-[#7A756F]">We never sell, share, or use your data for advertising or third-party analytics.</p>
              </div>
            </div>
          </section>

          {/* Technical Security */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Technical Security Measures
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#1A1612]">Encryption at Rest</h4>
                  <p className="text-sm text-[#7A756F]">All database storage uses AES-256 encryption. Encryption keys are derived from your unique Clerk authentication ID.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#1A1612]">Secure Infrastructure</h4>
                  <p className="text-sm text-[#7A756F]">Data is stored in Turso (libSQL) databases with industry-leading security practices, regular audits, and penetration testing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#1A1612]">Secure Transmission</h4>
                  <p className="text-sm text-[#7A756F]">All data transmitted between your browser and our servers uses TLS 1.3 encryption (HTTPS).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Data Retention
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="space-y-2 text-[#4A453F]">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Active Sessions:</strong> Stored indefinitely until you delete them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Completed Analyses:</strong> Retained for 7 years (for your reference)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Deleted Data:</strong> Permanently removed within 30 days of deletion request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Audit Logs:</strong> Kept for 1 year for security purposes</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-white rounded-2xl p-8 border border-[#F0E8DE]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612]">
                Your Rights (GDPR & CCPA)
              </h2>
            </div>
            <p className="text-[#4A453F] leading-relaxed mb-4">
              You have complete control over your personal data:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Access:</strong> Request a copy of all your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Rectification:</strong> Update inaccurate information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Erasure:</strong> Delete all your data permanently</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Portability:</strong> Export your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Restrict Processing:</strong> Pause data usage</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-[#4A453F]"><strong>Right to Object:</strong> Opt-out of data processing</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#7A756F]">
              To exercise any of these rights, contact us at <a href="mailto:privacy@aipandit.app" className="text-[#B8860B] hover:underline">privacy@aipandit.app</a> or use the delete option in your dashboard.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl p-8 border border-[#F0E8DE]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-[#4A453F] mb-4">
              If you have any questions about our privacy practices or would like to exercise your data rights, please contact our Data Protection Officer:
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
          Last updated: January 2026 | Version 2.0
        </p>
      </div>
    </main>
  );
}
