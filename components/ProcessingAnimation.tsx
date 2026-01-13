'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Sigma, FunctionSquare, Atom, Target } from 'lucide-react';
import FibonacciSpiral from '@/components/FibonacciSpiral';

const processingStages = [
  { 
    text: 'Calculating planetary positions...', 
    icon: Atom,
    duration: 2000,
    description: 'Computing celestial coordinates with Swiss Ephemeris'
  },
  { 
    text: 'Running Swiss Ephemeris...', 
    icon: FunctionSquare,
    duration: 2000,
    description: 'High-precision astronomical calculations'
  },
  { 
    text: 'Correlating life events...', 
    icon: Target,
    duration: 2000,
    description: 'Matching events with planetary periods'
  },
  { 
    text: 'Triangulating exact moment...', 
    icon: Sigma,
    duration: 2000,
    description: 'Mathematical convergence algorithms'
  },
  { 
    text: 'Verifying with Tattwa Shodhana...', 
    icon: Sparkles,
    duration: 2000,
    description: 'Physical trait correlation analysis'
  }
];

export default function ProcessingAnimation() {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [spiralRotation, setSpiralRotation] = useState(0);
  
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % processingStages.length);
    }, 2000);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 100);
    
    const spiralTimer = setInterval(() => {
      setSpiralRotation(prev => prev + 1.618); // Golden ratio rotation
    }, 50);
    
    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
      clearInterval(spiralTimer);
    };
  }, []);
  
  const CurrentIcon = processingStages[currentStage].icon;
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-fib-8">
      {/* Mathematical Header */}
      <motion.div
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.618, ease: "easeOut" }}
        className="text-center mb-fib-8"
      >
        <div className="flex items-center justify-center gap-fib-3 mb-fib-5">
          <Sigma className="w-fib-5 h-fib-5 text-vedic-saffron" />
          <h2 className="math-title-h2">
            Mathematical Analysis
          </h2>
          <FunctionSquare className="w-fib-5 h-fib-5 text-vedic-orange" />
        </div>
        <p className="math-subtitle">
          Converging on your exact birth moment through mathematical precision
        </p>
      </motion.div>
      
      {/* Main Processing Animation - Fibonacci Spiral Center */}
      <motion.div
        className="relative w-fib-10 h-fib-10 mx-auto mb-fib-8"
        initial={{ scale: 0.618, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.618, ease: "easeOut" }}
      >
        {/* Background Fibonacci Spiral */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: spiralRotation }}
            transition={{ duration: 0, ease: "linear" }}
          >
            <FibonacciSpiral size={144} opacity={0.382} animated={true} />
          </motion.div>
        </div>
        
        {/* Central Processing Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative w-fib-8 h-fib-8 bg-gradient-to-br from-vedic-saffron to-vedic-orange rounded-fib-6 flex items-center justify-center shadow-phi-strong"
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
                <CurrentIcon className="w-fib-5 h-fib-5 text-white" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Orbiting Data Points - Mathematical Positions */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 137.5) * (Math.PI / 180); // Golden angle
          const radius = 55 + (i * 13); // Fibonacci spacing
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={i}
              className="absolute w-fib-3 h-fib-3 bg-vedic-saffron rounded-full"
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
                duration: 2 + (i * 0.236), // Fibonacci timing
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          );
        })}
      </motion.div>
      
      {/* Processing Text - Mathematical Typography */}
      <motion.div
        className="text-center mb-fib-8"
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
            className="space-y-fib-3"
          >
            <div className="flex items-center justify-center gap-fib-3 mb-fib-3">
              <CurrentIcon className="w-fib-5 h-fib-5 text-vedic-saffron" />
              <h3 className="text-h3 font-semibold text-white">
                {processingStages[currentStage].text}
              </h3>
            </div>
            <p className="text-h6 text-white/phi-light">
              {processingStages[currentStage].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Progress Bar - Mathematical Precision */}
      <motion.div
        className="space-y-fib-4"
        initial={{ opacity: 0, y: 21 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-h6 text-white/phi-light">Analysis Progress</span>
          <span className="text-h5 font-mono text-vedic-saffron">
            {progress.toFixed(1)}%
          </span>
        </div>
        
        <div className="math-progress-bar h-fib-3 rounded-fib-2">
          <motion.div
            className="math-progress-fill h-full rounded-fib-2 bg-gradient-to-r from-vedic-saffron to-vedic-orange"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <div className="text-center">
          <p className="text-phi-sm text-white/phi-light">
            Estimated time: 8-13 seconds (Fibonacci range)
          </p>
        </div>
      </motion.div>
      
      {/* Mathematical Indicators */}
      <motion.div
        className="grid grid-cols-3 gap-fib-4 mt-fib-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center p-fib-4 bg-white/phi-light rounded-fib-4 backdrop-blur-phi">
          <div className="text-h5 font-mono text-vedic-saffron mb-fib-1">φ</div>
          <div className="text-phi-sm text-white/phi-light">Golden Ratio</div>
        </div>
        <div className="text-center p-fib-4 bg-white/phi-light rounded-fib-4 backdrop-blur-phi">
          <div className="text-h5 font-mono text-vedic-saffron mb-fib-1">0.001"</div>
          <div className="text-phi-sm text-white/phi-light">Precision</div>
        </div>
        <div className="text-center p-fib-4 bg-white/phi-light rounded-fib-4 backdrop-blur-phi">
          <div className="text-h5 font-mono text-vedic-saffron mb-fib-1">{currentStage + 1}/5</div>
          <div className="text-phi-sm text-white/phi-light">Stage</div>
        </div>
      </motion.div>
      
      {/* Floating Mathematical Elements */}
      {[...Array(13)].map((_, i) => {
        const size = 3 + (i * 2); // Fibonacci sizes
        const delay = i * 0.236; // Golden ratio delay
        const duration = 3 + (i * 0.382); // Fibonacci duration
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-vedic-saffron/phi"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${(i * 13.75) % 100}%`, // Golden angle distribution
              top: `${(i * 16.18) % 100}%`, // Golden ratio distribution
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