/**
 * WhyForensicTraits - Vedic Science Explanation for Users
 * Explains the astrological basis behind physical trait analysis
 * Sacred Ivory Light Theme - God Tier Design
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronDown, BookOpen, ScanFace,
  Activity, Speech, Users, Brain, Target
} from 'lucide-react';

export default function WhyForensicTraits() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<'intro' | 'traits' | 'science'>('intro');

  const traitScience = [
    {
      trait: 'Forehead (Lalat)',
      icon: Brain,
      planet: 'Sun & Jupiter',
      houses: '1st & 10th House',
      meaning: 'Authority, wisdom, and mental prowess',
      verification: 'Broad forehead → Sun/Jupiter influence → Leadership roles in Sun Dasha',
      accuracy: 'High'
    },
    {
      trait: 'Eyes (Netra)',
      icon: ScanFace,
      planet: 'Moon, Mars, Venus',
      houses: '2nd & 12th House',
      meaning: 'Emotional depth, intensity, and attraction',
      verification: 'Deep-set eyes → Saturn influence → Introspective nature',
      accuracy: 'Very High'
    },
    {
      trait: 'Voice (Vani)',
      icon: Speech,
      planet: 'Saturn & Mercury',
      houses: '2nd & 3rd House',
      meaning: 'Communication style and authority',
      verification: 'Deep voice → Saturn in 2nd house → Deliberate speech patterns',
      accuracy: 'High'
    },
    {
      trait: 'Body Type (Prakriti)',
      icon: Activity,
      planet: 'All planets by dosha',
      houses: '1st House (Lagna)',
      meaning: 'Constitutional nature: Vata/Pitta/Kapha',
      verification: 'Vata → Air signs → Gemini/Libra/Aquarius Lagna',
      accuracy: 'Very High'
    },
    {
      trait: 'Birth Order',
      icon: Users,
      planet: 'Sun & Moon',
      houses: '3rd & 11th House',
      meaning: 'Sibling position and family dynamics',
      verification: 'Eldest → Strong Sun → Authority from birth',
      accuracy: 'Very High'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#ffffff] to-white rounded-2xl border border-[#000000]/30 overflow-hidden shadow-lg shadow-[#000000]/5"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer hover:bg-[#f8f8f8]/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#000000] to-[#000000]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className=" text-xl font-medium text-[#000000]">
                Why Do Physical Traits Matter?
              </h3>
            </div>
            <p className="text-sm text-[#636363] leading-relaxed">
              <span className="font-medium text-[#000000]">Your body is a cosmic map.</span> Every feature—forehead, eyes, voice—is
              <span className="font-medium text-[#000000]"> encoded by planets at birth</span>.
              We verify: Does your body match your chart?
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 rounded-lg bg-[#f8f8f8] text-[#636363]"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#000000]/10 text-[#000000] border border-[#000000]/20">
            <Target className="w-3.5 h-3.5 inline mr-1" />
            ±3-5 min accuracy
          </div>
          <div className="text-xs text-[#636363]">
            8 forensic markers • Vedic verification
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[rgba(0,0,0,0.08)]"
          >
            {/* Tab Navigation */}
            <div className="flex p-1 bg-[#f8f8f8] mx-4 mt-4 rounded-xl">
              {[
                { id: 'intro', label: 'The Science', icon: BookOpen },
                { id: 'traits', label: '8 Markers', icon: ScanFace }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(tab.id as any);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${activeSection === tab.id
                    ? 'bg-white text-[#000000] shadow-sm'
                    : 'text-[#636363] hover:text-[#636363]'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 max-h-[500px] overflow-y-auto">
              {activeSection === 'intro' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-gradient-to-br from-[#000000]/10 to-[#000000]/10 rounded-xl border border-[#000000]/20">
                    <h4 className="font-medium text-[#000000] mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#000000]" />
                      The Body is a Cosmic Text
                    </h4>
                    <p className="text-sm text-[#636363] leading-relaxed">
                      According to <span className="italic">Brihat Parashara Hora Shastra</span>, your physical body is
                      <span className="font-medium text-[#000000]"> NOT random</span>. It is a manifestation of your
                      <span className="font-medium text-[#000000]"> Lagna (Ascendant)</span> and its ruling planet at the moment of birth.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-[#000000]">The Lagna-Body Connection:</h5>

                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="font-medium text-sm text-[#000000] mb-1">1st House (Lagna)</div>
                        <p className="text-xs text-[#636363]">
                          Determines overall body type, appearance, and constitution.
                          Wrong Lagna = Wrong physical description.
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="font-medium text-sm text-[#000000] mb-1">Lagna Lord</div>
                        <p className="text-xs text-[#636363]">
                          The ruling planet of your ascendant stamps its qualities on your body.
                          Mars Lagna → Athletic build. Venus Lagna → Beautiful features.
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="font-medium text-sm text-[#000000] mb-1">Planets in Lagna</div>
                        <p className="text-xs text-[#636363]">
                          Any planets sitting in the 1st house physically modify your appearance.
                          Saturn in Lagna → Lean, mature appearance. Moon in Lagna → Soft, round face.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#C65D3B]/5 rounded-lg border border-[#C65D3B]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-[#C65D3B]" />
                      <span className="font-medium text-sm text-[#C65D3B]">Birth Time Discrepancy</span>
                    </div>
                    <p className="text-xs text-[#636363]">
                      If your chart says Aries Lagna (Pitta, athletic, competitive) but you have
                      a thin, nervous, intellectual build (Vata, Gemini traits), your birth time is likely
                      off by <span className="font-medium">12-15 minutes</span>.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeSection === 'traits' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <h4 className="font-medium text-[#000000] text-sm flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-[#000000]" />
                    8 Forensic Markers
                  </h4>
                  <p className="text-xs text-[#636363]">
                    Each trait corresponds to specific planetary and house influences
                  </p>

                  <div className="space-y-3">
                    {traitScience.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#000000]/10">
                            <item.icon className="w-4 h-4 text-[#000000]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm text-[#000000]">{item.trait}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.accuracy === 'Very High'
                                ? 'bg-[#184131]/10 text-[#184131]'
                                : 'bg-[#000000]/10 text-[#000000]'
                                }`}>
                                {item.accuracy} Accuracy
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-[#636363]">
                                <span className="text-[#000000] font-medium">Planet:</span> {item.planet}
                              </p>
                              <p className="text-xs text-[#636363]">
                                <span className="text-[#000000] font-medium">House:</span> {item.houses}
                              </p>
                              <p className="text-xs text-[#636363]">
                                <span className="text-[#000000] font-medium">Meaning:</span> {item.meaning}
                              </p>
                              <p className="text-[10px] text-[#184131] bg-[#184131]/5 p-2 rounded mt-2">
                                <span className="font-medium">Verification:</span> {item.verification}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Footer Quote */}
            <div className="p-4 bg-gradient-to-r from-[#000000]/10 to-[#000000]/10 border-t border-[#000000]/20">
              <p className="text-sm text-center text-[#636363] italic">
                &quot;The body never lies. It holds the memory of the stars at birth.
                Learn to read it, and you hold the key to time itself.&quot;
              </p>
              <p className="text-xs text-center text-[#636363] mt-1">
                — Ancient Vedic Seer
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
