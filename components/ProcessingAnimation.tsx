'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Sigma, FunctionSquare, Atom, Target } from 'lucide-react';
import FibonacciSpiral from '@/components/FibonacciSpiral';

const processingStages = [
  {
    text: 'Initializing Swiss Ephemeris...',
    icon: Atom,
    duration: 2000,
    description: 'Loading high-precision astronomical data for planetary calculations'
  },
  {
    text: 'Calculating planetary positions...',
    icon: FunctionSquare,
    duration: 2500,
    description: 'Computing exact celestial coordinates using Swiss Ephemeris algorithms'
  },
  {
    text: 'Connecting to Moonshot AI...',
    icon: Sparkles,
    duration: 2000,
    description: 'Establishing connection with Kimi AI model for advanced analysis'
  },
  {
    text: 'AI analyzing life events...',
    icon: Target,
    duration: 3000,
    description: 'Moonshot AI correlating your life events with planetary movements'
  },
  {
    text: 'AI thinking process...',
    icon: Sigma,
    duration: 2500,
    description: 'Advanced machine learning algorithms processing astrological patterns'
  },
  {
    text: 'Cross-validating with multiple methods...',
    icon: Atom,
    duration: 2000,
    description: 'KP system, Tattwa Shodhana, and divisional chart verification'
  },
  {
    text: 'Finalizing rectified time...',
    icon: Sparkles,
    duration: 2000,
    description: 'AI determining the most accurate birth time with confidence scoring'
  }
];

export default function ProcessingAnimation() {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [spiralRotation, setSpiralRotation] = useState(0);
  
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % processingStages.length);
    }, 2300);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.8, 100));
    }, 100);
    
    const spiralTimer = setInterval(() => {
      setSpiralRotation(prev => prev + 1.618);
    }, 50);
    
    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
      clearInterval(spiralTimer);
    };
  }, []);
  
  const CurrentIcon = processingStages[currentStage].icon;
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.618, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <Sigma className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-bold text-white">
            Mathematical Analysis
          </h2>
          <FunctionSquare className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-lg text-white/70">
          Converging on your exact birth moment through mathematical precision
        </p>
      </motion.div>
      
      <motion.div
        className="relative w-64 h-64 mx-auto mb-8"
        initial={{ scale: 0.618, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.618, ease: "easeOut" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: spiralRotation }}
            transition={{ duration: 0, ease: "linear" }}
          >
            <FibonacciSpiral size={144} opacity={0.382} animated={true} />
          </motion.div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative w-40 h-40 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "linear" }
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentIcon className="w-10 h-10 text-white" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        
        {[...Array(8)].map((_, i) => {
          const angle = (i * 137.5) * (Math.PI / 180);
          const radius = 55 + (i * 13);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-amber-500 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                x: x,
                y: y,
                marginLeft: '-6.5px',
                marginTop: '-6.5px'
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2 + (i * 0.236),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          );
        })}
      </motion.div>
      
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 13 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -13 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <CurrentIcon className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-semibold text-white">
                {processingStages[currentStage].text}
              </h3>
            </div>
            <p className="text-sm text-white/70">
              {processingStages[currentStage].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 21 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Analysis Progress</span>
          <span className="text-lg font-mono text-amber-500">
            {progress.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-white/60">
            Estimated time: 14-20 seconds (AI analysis requires more time)
          </p>
        </div>
      </motion.div>
      
      <motion.div
        className="grid grid-cols-3 gap-4 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-lg font-mono text-amber-500 mb-1">φ</div>
          <div className="text-sm text-white/70">Golden Ratio</div>
        </div>
        <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-lg font-mono text-amber-500 mb-1">0.001"</div>
          <div className="text-sm text-white/70">Precision</div>
        </div>
        <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-lg font-mono text-amber-500 mb-1">{currentStage + 1}/7</div>
          <div className="text-sm text-white/70">Stage</div>
        </div>
      </motion.div>
      
      {[...Array(13)].map((_, i) => {
        const size = 3 + (i * 2);
        const delay = i * 0.236;
        const duration = 3 + (i * 0.382);
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-500/30"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${(i * 13.75) % 100}%`,
              top: `${(i * 16.18) % 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.618, 1],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </div>
  );
}
