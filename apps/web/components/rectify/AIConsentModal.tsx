'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ isOpen, onAccept, onDecline }: AIConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
            <h2 className="text-2xl font-bold">🔒 AI Processing Consent</h2>
            <p className="text-amber-100 mt-1">
              Before we begin the analysis
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* What we process */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What our AI will analyze:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Planetary positions calculated from your birth data</li>
                <li>✓ Dasha (planetary period) sequences</li>
                <li>✓ Divisional charts (D9, D10, D60)</li>
                <li>✓ Life event dates and descriptions</li>
                <li>✓ Physical/psychological traits for forensic matching</li>
              </ul>
            </div>

            {/* What's protected */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2">🛡️ Your privacy is protected:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Your name is anonymized before AI processing</li>
                <li>✓ Only coordinates used, not exact address</li>
                <li>✓ Health information is excluded</li>
                <li>✓ Data is not used to train AI models</li>
              </ul>
            </div>

            {/* Consent checkbox */}
            <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-amber-600 rounded"
                />
                <span className="text-sm text-gray-800">
                  I consent to the processing of my astrological data by AI systems 
                  for birth time rectification. I understand my personal identifiers 
                  (name, exact location) will be anonymized before processing.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onDecline}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onAccept}
                disabled={!isChecked}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isChecked
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                I Consent - Start Analysis
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
