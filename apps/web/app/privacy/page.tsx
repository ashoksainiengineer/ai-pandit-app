/**
 * Privacy Policy Page - Comprehensive Data Protection Information
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, FileText, Server, Key, Cpu, UserX, CheckCircle, XCircle } from 'lucide-react';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Pandit',
  description: 'Learn how AI Pandit protects your personal data and birth information with military-grade encryption and AI anonymization.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-app-xl bg-black flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-light text-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-black/60 max-w-2xl mx-auto">
            Your trust is our highest priority. We employ military-grade encryption, strict anonymization for AI processing, and transparent data protection practices to safeguard your personal and astrological information.
          </p>
        </div>

        <div className="space-y-8">
          {/* End-to-End Encryption */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-emerald-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                End-to-End Encryption
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              All your personal data is protected with AES-256 end-to-end encryption. We use your unique authentication key to encrypt sensitive information, ensuring:
            </p>
            <ul className="space-y-2 text-black/60">
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

          {/* AI Processing & Anonymization */}
          <section className="bg-white rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-black/5 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black">
                AI Processing & Data Anonymization
              </h2>
            </div>

            <div className="p-4 bg-black/5 border border-black/10 rounded-lg mb-6">
              <p className="text-sm text-black">
                <strong>Critical Privacy Protection:</strong> We use advanced anonymization techniques to ensure your personally identifiable information (PII) is never exposed to AI systems or third-party AI providers.
              </p>
            </div>

            <h3 className="font-medium text-black mb-3 flex items-center gap-2">
              <UserX className="w-5 h-5 text-black" />
              How We Anonymize Your Data
            </h3>
            <p className="text-black/60 leading-relaxed mb-4">
              Before any data is sent to AI systems for birth time rectification analysis, we automatically remove personally identifiable information (PII) from your data:
            </p>
            <ul className="space-y-2 text-black/60 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">→</span>
                <span><strong>Names:</strong> Real names are replaced with <code>[REDACTED_NAME]</code> markers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">→</span>
                <span><strong>Spouse Name:</strong> Removed or replaced with <code>[REDACTED_NAME]</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">→</span>
                <span><strong>Birth Place Names:</strong> Only coordinates (latitude/longitude) are sent to AI</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black mt-1">→</span>
                <span><strong>Emails & Phones:</strong> Replaced with <code>[REDACTED_EMAIL]</code> and <code>[REDACTED_PHONE]</code></span>
              </li>
            </ul>

            <h3 className="font-medium text-black mb-3">Explicit Consent Required</h3>
            <p className="text-black/60 leading-relaxed mb-4">
              Before any AI analysis begins, you must provide explicit consent. You will see a clear modal explaining:
            </p>
            <ul className="space-y-2 text-black/60">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span>Exactly what astrological data will be analyzed by AI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span>That your name and PII will be anonymized before processing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span>Which third-party AI providers may process your anonymized data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span>That AI providers do not retain or train models on your data</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>You control your data:</strong> You can decline AI processing and request deletion of your data at any time through your dashboard.
              </p>
            </div>
          </section>

          {/* Data Shared with AI Systems */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-app-lg bg-indigo-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Data Shared with AI Systems
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-6">
              When you provide consent for AI analysis, only the following anonymized data is transmitted to our AI providers:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* SHARED WITH AI */}
              <div className="bg-emerald-50 rounded-app-lg p-5 border border-emerald-200">
                <h3 className="font-medium text-emerald-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Data Sent to AI (Anonymized)
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Skyfield Calculations:</strong> Planetary positions, house cusps, degrees, nakshatras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Dasha Periods:</strong> Vimshottari, Yogini, and Chara dasha calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Divisional Charts:</strong> Navamsa (D9), Dasamsa (D10), and other varga charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Life Events:</strong> Dates, categories, importance levels (descriptions anonymized)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Forensic Traits:</strong> Physical and behavioral characteristics mapped to astrological indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Transit Data:</strong> Planetary transits for event dates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span className="text-emerald-900"><strong>Anonymous ID:</strong> Pseudonym replacing your real name</span>
                  </li>
                </ul>
              </div>

              {/* NOT SHARED WITH AI */}
              <div className="bg-red-50 rounded-app-lg p-5 border border-red-200">
                <h3 className="font-medium text-red-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Data NEVER Sent to AI
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Your Real Name:</strong> Always anonymized before AI processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Spouse Name:</strong> Removed or anonymized</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Birth Place Names:</strong> Only coordinates sent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Email Address:</strong> Never shared with AI systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Health Information:</strong> Medical conditions and health details excluded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>Financial Details:</strong> Income, investments, specific amounts excluded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-red-900"><strong>IP Address:</strong> Not transmitted to AI providers</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> All data sent to AI systems is processed in real-time for analysis only. AI providers (Groq with GPT-OSS-120B, or DeepSeek via OpenRouter) do not retain, store, or use your data for model training. Processing is ephemeral and stateless.
              </p>
            </div>
          </section>

          {/* Third-Party AI Providers */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-cyan-100 flex items-center justify-center">
                <Server className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Third-Party AI Providers
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              We use multiple AI providers for birth time rectification analysis. Based on configuration, your anonymized data may be processed by one of the following providers:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">Groq (Primary Provider)</h4>
                <ul className="space-y-1 text-sm text-black/60">
                  <li>• Model: GPT-OSS-120B (open-source, 120 billion parameters)</li>
                  <li>• Processes anonymized astrological data only</li>
                  <li>• No access to your real name, email, or PII</li>
                  <li>• Does not train models on your data</li>
                  <li>• Ultra-fast inference with low latency</li>
                  <li>• Privacy Policy: <a href="https://groq.com/privacy" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">groq.com/privacy</a></li>
                </ul>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">OpenRouter (Alternative Gateway)</h4>
                <ul className="space-y-1 text-sm text-black/60">
                  <li>• Routes anonymized requests to various AI models (including DeepSeek)</li>
                  <li>• Does not store request content or responses</li>
                  <li>• Provides model failover and routing optimization</li>
                  <li>• Privacy Policy: <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">openrouter.ai/privacy</a></li>
                </ul>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">DeepSeek (via OpenRouter)</h4>
                <ul className="space-y-1 text-sm text-black/60">
                  <li>• Model: DeepSeek V3 / Reasoner (when configured via OpenRouter)</li>
                  <li>• Processes anonymized astrological data only</li>
                  <li>• No access to your real name, email, or PII</li>
                  <li>• Does not train models on your data</li>
                  <li>• Data retention: Ephemeral (not stored)</li>
                  <li>• Privacy Policy: <a href="https://www.deepseek.com/privacy" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">deepseek.com/privacy</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Data Processing Agreement:</strong> All third-party providers are bound by data processing agreements that prohibit retention, sale, or secondary use of your data. They may only process data for the specific purpose of generating your birth time rectification analysis.
              </p>
            </div>
          </section>

          {/* Data We Collect - Detailed Table */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-app-lg bg-blue-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Data We Collect & Store
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-6">
              We collect only the information necessary for birth time rectification. Below is a complete breakdown of what data we store and how it&apos;s protected:
            </p>

            {/* Data Collection Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black/5 border-b border-black/10">
                    <th className="text-left p-3 font-medium text-black">Data Category</th>
                    <th className="text-left p-3 font-medium text-black">Fields</th>
                    <th className="text-left p-3 font-medium text-black">Storage</th>
                    <th className="text-left p-3 font-medium text-black">Sent to AI</th>
                    <th className="text-left p-3 font-medium text-black">Encrypted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Birth Information</td>
                    <td className="p-3 text-black/60">Full Name, Date of Birth, Birth Time</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">Anonymized</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Location Coordinates</td>
                    <td className="p-3 text-black/60">Latitude, Longitude, Timezone</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">Yes</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain (needed for calculations)</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Personal Traits</td>
                    <td className="p-3 text-black/60">Height, Build, Complexion, Eye Color, Hair Type</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">Yes</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Forensic Traits</td>
                    <td className="p-3 text-black/60">Facial Structure, Psychographic, Biological, Family Details</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">Yes</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Life Events</td>
                    <td className="p-3 text-black/60">Category, Date, Description, Importance, Time Precision</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">Anonymized</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Spouse Data</td>
                    <td className="p-3 text-black/60">Name, Date of Birth, Birth Time, Birth Place</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">No</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Analysis Settings</td>
                    <td className="p-3 text-black/60">Time Offset Preset, Custom Minutes</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">Yes</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Account Info</td>
                    <td className="p-3 text-black/60">Email, Full Name (from Clerk authentication)</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">No</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">Plain</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 text-black/60 font-medium">Consent Records</td>
                    <td className="p-3 text-black/60">AI Consent Status, Timestamp, IP Address</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Database</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">No</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">✓ AES-256</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only location coordinates (latitude/longitude) and analysis settings are stored unencrypted, as they are required for astrological calculations. All personal identifying information is always encrypted. Data marked &quot;Anonymized&quot; for AI is stripped of PII before transmission.
              </p>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-indigo-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                How We Use Your Data
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/5 rounded-lg">
                <h3 className="font-medium text-black mb-2">Birth Time Rectification</h3>
                <p className="text-sm text-black/60">Your anonymized birth data and life events are analyzed by our AI to determine your precise birth time.</p>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h3 className="font-medium text-black mb-2">Session Management</h3>
                <p className="text-sm text-black/60">Your draft data is saved so you can resume your analysis later.</p>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h3 className="font-medium text-black mb-2">Account Authentication</h3>
                <p className="text-sm text-black/60">Email and name from Clerk are used for login and account identification only.</p>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h3 className="font-medium text-black mb-2">What We DON&apos;T Do</h3>
                <p className="text-sm text-black/60">We never sell, share, or use your data for advertising or third-party analytics.</p>
              </div>
            </div>
          </section>

          {/* Technical Security */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-black/5 flex items-center justify-center">
                <Server className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Technical Security Measures
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-black">Encryption at Rest</h4>
                  <p className="text-sm text-black/60">All database storage uses AES-256 encryption. Encryption keys are derived from your unique Clerk authentication ID.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-black">Secure Infrastructure</h4>
                  <p className="text-sm text-black/60">Data is stored in Neon Postgres databases with industry-leading security practices, regular audits, and penetration testing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-black">Secure Transmission</h4>
                  <p className="text-sm text-black/60">All data transmitted between your browser and our servers uses TLS 1.3 encryption (HTTPS).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserX className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-black">AI Anonymization Layer</h4>
                  <p className="text-sm text-black/60">Before any data reaches AI systems, our anonymization engine removes all PII and replaces names with pseudonyms.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-orange-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Data Retention
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="space-y-2 text-black/60">
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
                <span><strong>AI Processing Logs:</strong> Ephemeral only — no retention by AI providers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Consent Records:</strong> Retained for 3 years for legal compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span><strong>Audit Logs:</strong> Kept for 1 year for security purposes</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Your Rights (GDPR, CCPA & DPDP)
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              You have complete control over your personal data:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Access:</strong> Request a copy of all your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Rectification:</strong> Update inaccurate information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Erasure:</strong> Delete all your data permanently</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Portability:</strong> Export your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Restrict Processing:</strong> Pause data usage</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Object:</strong> Opt-out of AI processing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Withdraw Consent:</strong> Revoke AI processing consent anytime</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✓</span>
                <span className="text-black/60"><strong>Right to Explanation:</strong> Understand how AI uses your data</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-black/60">
              To exercise any of these rights, contact us at <a href="mailto:app.aipandit@gmail.com" className="text-black hover:underline">app.aipandit@gmail.com</a> or use the delete option in your dashboard.
            </p>
          </section>

          {/* Legal Compliance */}
          <section className="bg-white/90 backdrop-blur-xl rounded-app-xl p-8 border border-black/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-app-lg bg-gray-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-light text-black">
                Legal Compliance
              </h2>
            </div>
            <p className="text-black/60 leading-relaxed mb-4">
              Our data processing practices comply with major global privacy regulations:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">GDPR (EU)</h4>
                <p className="text-sm text-black/60">Full compliance with EU data protection standards. We process data on the basis of explicit consent and legitimate interest.</p>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">CCPA (California)</h4>
                <p className="text-sm text-black/60">California residents have the right to know what data is collected and request deletion.</p>
              </div>
              <div className="p-4 bg-black/5 rounded-lg">
                <h4 className="font-medium text-black mb-2">DPDP (India)</h4>
                <p className="text-sm text-black/60">Compliant with India&apos;s Digital Personal Data Protection Act, 2023.</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-app-xl p-8 border border-black/10">
            <h2 className="text-2xl font-light text-black mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-black/60 mb-4">
              If you have any questions about our privacy practices, AI data processing, or would like to exercise your data rights, please contact our Data Protection Officer:
            </p>
            <a
              href="mailto:app.aipandit@gmail.com"
              className="inline-flex items-center gap-2 text-black hover:text-black/60 transition-colors font-medium"
            >
              app.aipandit@gmail.com
            </a>
          </section>
        </div>

        <p className="text-center text-sm text-black/60 mt-12">
          Last updated: January 2026 | Version 3.0 (AI Processing Update)
        </p>
      </div>
    </main>
  );
}
