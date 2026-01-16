'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How accurate is this birth time analysis?',
    answer: 'Our AI-powered system achieves 95-98% accuracy when you provide exact dates for your life events. The accuracy depends on the precision of the event dates you enter - more exact dates lead to more accurate results.'
  },
  {
    question: 'What if I don\'t remember exact dates for my life events?',
    answer: 'Approximate dates still work, but accuracy may be lower (80-90%). We recommend providing as precise dates as possible. If you only have approximate dates, the analysis will still be valuable but may suggest a time range rather than an exact minute.'
  },
  {
    question: 'How long does the processing take?',
    answer: 'Usually 20-25 minutes from start to finish. The AI analysis takes the most time as it carefully examines each life event against planetary positions. You\'ll receive email confirmation when your analysis is complete.'
  },
  {
    question: 'Can I get a refund if I\'m not satisfied?',
    answer: 'Yes, we offer a 7-day money-back guarantee. If you\'re not satisfied with your analysis or believe there\'s an error, contact our support team within 7 days of purchase for a full refund, no questions asked.'
  },
  {
    question: 'What personal data do you store?',
    answer: 'We only store the information you provide during the analysis process. All data is encrypted and securely stored. We never share your personal information with third parties. Data is retained for 2 years for support purposes.'
  },
  {
    question: 'Can I consult with a human astrologer after getting results?',
    answer: 'Absolutely! We provide recommendations for qualified Vedic astrologers in your area. Many customers use our AI analysis as a starting point before consulting with human experts for deeper insights.'
  }
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Got Questions?
          </h2>
          <p className="text-xl text-gray-300">
            Find answers to common questions about our birth time rectification service
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-600/30 transition-colors duration-200"
              >
                <span className="text-white font-medium pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-600"
                  >
                    <div className="px-6 py-4 text-gray-300">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-6">
            Still have questions? We're here to help.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
