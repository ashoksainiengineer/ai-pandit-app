import Link from 'next/link';
import { Check, Clock, Target, FileText, Mail, Shield } from 'lucide-react';

const features = [
  {
    icon: Target,
    text: 'AI-powered deep analysis with Vedic astrology'
  },
  {
    icon: FileText,
    text: '15-20 page detailed report with charts'
  },
  {
    icon: Check,
    text: 'Event-by-event planetary breakdown'
  },
  {
    icon: Target,
    text: 'Alternative time suggestions'
  },
  {
    icon: Mail,
    text: 'Email support and follow-up consultation'
  },
  {
    icon: Shield,
    text: '7-day money-back guarantee'
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300">
            One-time payment, lifetime access to your analysis
          </p>
        </div>

        <div
          className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-2xl p-8 md:p-12 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Premium Birth Time Analysis
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-5xl font-bold text-blue-400">₹799</span>
              <span className="text-gray-400">one-time</span>
            </div>
            <p className="text-gray-300">Lifetime access to your detailed analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-3 p-4 bg-slate-600/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-gray-300">Processing time: ~20-25 minutes</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-600/30 rounded-lg">
              <Target className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">Accuracy: 95-98%</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="text-lg font-semibold text-white mb-4">What&apos;s Included:</h4>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600/20 rounded-full flex-shrink-0">
                    <IconComponent className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300">{feature.text}</span>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/rectify">
              <button
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
              >
                Get Your Analysis
              </button>
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              No hidden charges • Secure payment • Instant access
            </p>
          </div>
        </div>

        <div
          className="text-center mt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-600/20 rounded-full text-green-400 text-sm">
            <Shield className="w-4 h-4" />
            Trusted by 10,000+ customers worldwide
          </div>
        </div>
      </div>
    </section>
  );
}
