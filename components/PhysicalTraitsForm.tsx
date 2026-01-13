'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, Palette, Info, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { PhysicalDescription } from '@/types';

interface PhysicalTraitsFormProps {
  physicalDesc: Partial<PhysicalDescription>;
  setPhysicalDesc: (desc: Partial<PhysicalDescription>) => void;
}

export default function PhysicalTraitsForm({ physicalDesc, setPhysicalDesc }: PhysicalTraitsFormProps) {
  const [showWhyPanel, setShowWhyPanel] = useState(false);
  const [touched, setTouched] = useState({
    bodyStructure: false,
    height: false,
    faceShape: false,
    complexion: false
  });
  
  // Visual face shapes with geometric representations
  const faceShapes = [
    { id: 'round', name: 'Round', icon: '⭕', description: 'Soft, circular features', ascendant: 'Taurus, Cancer' },
    { id: 'oval', name: 'Oval', icon: '🥚', description: 'Elongated, balanced proportions', ascendant: 'Libra, Pisces' },
    { id: 'square', name: 'Square', icon: '⬜', description: 'Strong jawline, angular features', ascendant: 'Aries, Capricorn' },
    { id: 'angular', name: 'Angular', icon: '🔺', description: 'Sharp, defined features', ascendant: 'Leo, Scorpio' },
    { id: 'heart', name: 'Heart', icon: '💜', description: 'Wider forehead, pointed chin', ascendant: 'Gemini, Virgo' }
  ];
  
  // Body structure options
  const bodyStructures = [
    { id: 'slim', name: 'Slim', icon: '🧍', description: 'Lean build, narrow frame', color: 'from-blue-400 to-blue-600' },
    { id: 'average', name: 'Average', icon: '🧍', description: 'Medium build, balanced proportions', color: 'from-green-400 to-green-600' },
    { id: 'athletic', name: 'Athletic', icon: '💪', description: 'Muscular, well-defined physique', color: 'from-orange-400 to-orange-600' },
    { id: 'heavy', name: 'Heavy', icon: '🧍', description: 'Broader build, larger frame', color: 'from-purple-400 to-purple-600' }
  ];
  
  // Height categories
  const heights = [
    { id: 'short', name: 'Short', icon: '🧍', description: 'Under 5\'4" (162 cm)', height: 'short' },
    { id: 'average', name: 'Average', icon: '🧍', description: '5\'4" - 5\'9" (162-175 cm)', height: 'medium' },
    { id: 'tall', name: 'Tall', icon: '🧍', description: 'Over 5\'9" (175 cm)', height: 'tall' }
  ];
  
  // Complexion with color swatches
  const complexions = [
    { id: 'fair', name: 'Fair', color: 'bg-rose-200', description: 'Light skin tone', emoji: '🤍' },
    { id: 'wheatish', name: 'Wheatish', color: 'bg-amber-200', description: 'Medium skin tone', emoji: '🤎' },
    { id: 'dark', name: 'Dark', color: 'bg-amber-800', description: 'Deep skin tone', emoji: '🖤' }
  ];
  
  // Get current height selection for display
  const currentHeightIndex = heights.findIndex(h => h.id === physicalDesc.height);
  const currentHeight = currentHeightIndex >= 0 ? heights[currentHeightIndex] : heights[1];
  
  // Validation state
  const isValid = {
    bodyStructure: !!physicalDesc.bodyStructure,
    height: !!physicalDesc.height,
    faceShape: !!physicalDesc.faceShape,
    complexion: !!physicalDesc.complexion
  };
  
  // Progress calculation
  const progress = Object.values(isValid).filter(Boolean).length / Object.values(isValid).length * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Conversational Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            Now, tell us about yourself
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Physical traits help us verify the correct Ascendant sign
          </p>
        </motion.div>
      </div>
      
      {/* Why Physical Traits Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto"
      >
        <button
          onClick={() => setShowWhyPanel(!showWhyPanel)}
          className="flex items-center gap-3 text-amber-400 hover:text-amber-300 mb-4 w-full"
        >
          <Info className="w-5 h-5" />
          <span className="font-semibold">Why Physical Traits Matter</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showWhyPanel ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showWhyPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/80 space-y-3"
            >
              <p>In Vedic astrology, your Ascendant (Lagna) sign influences physical appearance:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl mb-2">♌</div>
                  <div className="font-semibold text-amber-400">Leo Ascendant</div>
                  <div className="text-sm text-white/70 mt-1">Broad shoulders, commanding presence</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl mb-2">♍</div>
                  <div className="font-semibold text-amber-400">Virgo Ascendant</div>
                  <div className="text-sm text-white/70 mt-1">Slim build, youthful appearance</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl mb-2">♉</div>
                  <div className="font-semibold text-amber-400">Taurus Ascendant</div>
                  <div className="text-sm text-white/70 mt-1">Sturdy build, pleasant features</div>
                </div>
              </div>
              <p className="text-sm text-white/60 mt-4">
                By matching your actual appearance with expected traits, we can verify if the rectified time is correct.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto"
      >
        <div className="space-y-8">
          
          {/* Body Structure - Visual Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-lg font-medium text-white mb-4">
              How would you describe your body type?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bodyStructures.map((structure) => (
                <motion.button
                  key={structure.id}
                  type="button"
                  onClick={() => setPhysicalDesc({ ...physicalDesc, bodyStructure: structure.id as any })}
                  className={`p-4 rounded-xl text-center transition-all duration-300 border-2
                    ${physicalDesc.bodyStructure === structure.id
                      ? `bg-gradient-to-br ${structure.color} border-white text-white shadow-lg`
                      : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">{structure.icon}</div>
                  <div className="text-lg font-semibold mb-1">{structure.name}</div>
                  <div className="text-sm text-white/80">{structure.description}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Height - Visual Slider with Value Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-lg font-medium text-white mb-4">
              What's your height?
            </label>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Short</span>
                <span className="text-amber-400 font-medium">{currentHeight.name}</span>
                <span>Tall</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={currentHeightIndex >= 0 ? currentHeightIndex : 1}
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    setPhysicalDesc({ ...physicalDesc, height: heights[index].id as any });
                    setTouched(prev => ({ ...prev, height: true }));
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider ${
                    touched.height && !isValid.height
                      ? 'bg-red-500/20'
                      : touched.height && isValid.height
                      ? 'bg-green-500/20'
                      : 'bg-white/20'
                  }`}
                  aria-label="Height selection"
                  aria-valuetext={currentHeight.name}
                />
                <div className="flex justify-between mt-4">
                  {heights.map((height, index) => (
                    <div key={height.id} className="text-center">
                      <div className="text-2xl mb-1">{height.icon}</div>
                      <div className={`text-sm font-medium ${
                        physicalDesc.height === height.id ? 'text-amber-400' : 'text-white'
                      }`}>{height.name}</div>
                      <div className="text-xs text-white/60">{height.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              {touched.height && !isValid.height && (
                <p className="text-sm text-red-400 mt-1">Please select your height</p>
              )}
            </div>
          </motion.div>
          
          {/* Face Shape - Visual Picker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <label className="block text-lg font-medium text-white mb-4">
              Which face shape is closest to yours?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {faceShapes.map((shape) => (
                <motion.button
                  key={shape.id}
                  type="button"
                  onClick={() => setPhysicalDesc({ ...physicalDesc, faceShape: shape.id as any })}
                  className={`p-4 rounded-xl text-center transition-all duration-300 aspect-square
                    ${physicalDesc.faceShape === shape.id
                      ? 'ring-2 ring-amber-500 bg-amber-500/20 text-white'
                      : 'bg-white/5 border border-white/20 text-white/70 hover:border-white/40'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-4xl mb-2">{shape.icon}</div>
                  <div className="text-lg font-semibold mb-1">{shape.name}</div>
                  <div className="text-sm text-white/80 mb-2">{shape.description}</div>
                  <div className="text-xs text-amber-400">{shape.ascendant}</div>
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-white/60 mt-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {"💡 Look in a mirror: Is your face wider or longer? Oval = Length > Width. Round = Equal dimensions."}
            </p>
          </motion.div>
          
          {/* Complexion - Color Chips */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <label className="block text-lg font-medium text-white mb-4 flex items-center gap-3">
              <Palette className="w-5 h-5 text-amber-400" />
              What's your complexion?
            </label>
            <div className="flex gap-4">
              {complexions.map((complexion) => (
                <motion.button
                  key={complexion.id}
                  type="button"
                  onClick={() => setPhysicalDesc({ ...physicalDesc, complexion: complexion.id as any })}
                  className={`flex-1 p-4 rounded-xl text-center transition-all duration-300 border-2
                    ${physicalDesc.complexion === complexion.id
                      ? 'ring-2 ring-amber-500 shadow-lg'
                      : 'border-white/20 hover:border-white/40'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-16 h-16 ${complexion.color} rounded-full mx-auto mb-3 border-2 border-white/30`} />
                  <div className="text-lg font-semibold mb-1">{complexion.name}</div>
                  <div className="text-sm text-white/70">{complexion.description}</div>
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-white/60 mt-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              ℹ️ Compare to unexposed skin (inside of arm)
            </p>
          </motion.div>
          
          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Physical Traits Complete</span>
              <span className="text-sm text-amber-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-white/60 mt-2">
              {progress === 100 ? '✅ All traits selected' : `Select ${Object.values(isValid).filter(v => !v).length} more trait${Object.values(isValid).filter(v => !v).length !== 1 ? 's' : ''}`}
            </p>
          </motion.div>
          
          {/* Distinctive Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              Any distinctive features? (Optional)
            </label>
            <textarea
              value={physicalDesc.distinctiveFeatures || ''}
              onChange={(e) => {
                // Sanitize input to prevent XSS
                const sanitized = e.target.value.replace(/[<>"']/g, '');
                setPhysicalDesc({ ...physicalDesc, distinctiveFeatures: sanitized });
              }}
              placeholder="Notable features like birthmarks, scars, dimples, etc."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 resize-none"
              rows={3}
              maxLength={200}
              aria-label="Distinctive physical features"
            />
            <div className="text-xs text-white/60 mt-1 text-right">
              {(physicalDesc.distinctiveFeatures || '').length}/200
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}