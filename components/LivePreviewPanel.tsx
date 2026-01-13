'use client';

import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Target, Activity, Sigma, FunctionSquare, Briefcase, Heart, Baby, Users, Stethoscope, Landmark, Plane, GraduationCap } from 'lucide-react';
import type { BirthData, PhysicalDescription, LifeEvent, EventCategory } from '@/types';
import FibonacciSpiral from '@/components/FibonacciSpiral';

interface LivePreviewPanelProps {
  birthData: Partial<BirthData>;
  physicalDesc: Partial<PhysicalDescription>;
  lifeEvents: LifeEvent[];
  currentStep: number;
}

const categoryIcons: Record<EventCategory, any> = {
  education: GraduationCap,
  career: Briefcase,
  marriage: Heart,
  children: Baby,
  family: Users,
  health: Stethoscope,
  financial: Landmark,
  travel: Plane,
  spiritual: Target,
  other: Target
};

export default function LivePreviewPanel({ birthData, physicalDesc, lifeEvents, currentStep }: LivePreviewPanelProps) {
  // Calculate completion percentage using Golden Ratio
  const calculateCompletion = () => {
    let total = 0;
    let completed = 0;
    
    // Step 1: Birth Data (weight: 0.382)
    if (currentStep >= 1) {
      const birthFields = ['fullName', 'dateOfBirth', 'tentativeTime', 'birthPlace', 'latitude', 'longitude'];
      birthFields.forEach(field => {
        total += 0.382;
        if (birthData[field as keyof BirthData]) completed += 0.382;
      });
    }
    
    // Step 2: Physical Traits (weight: 0.236)
    if (currentStep >= 2) {
      const physicalFields = ['bodyStructure', 'height', 'faceShape', 'complexion'];
      physicalFields.forEach(field => {
        total += 0.236;
        if (physicalDesc[field as keyof PhysicalDescription]) completed += 0.236;
      });
    }
    
    // Step 3: Life Events (weight: 0.382, minimum 3 events)
    if (currentStep >= 3) {
      const eventWeight = Math.min(lifeEvents.length, 7) * 0.382;
      total += 2.674; // 7 events * 0.382
      completed += eventWeight;
    }
    
    return total > 0 ? (completed / total) * 100 : 0;
  };
  
  const completionPercentage = calculateCompletion();
  const confidenceLevel = completionPercentage >= 80 ? 'Very High' : 
                         completionPercentage >= 60 ? 'High' : 
                         completionPercentage >= 40 ? 'Medium' : 'Low';
  
  return (
    <motion.div
      className="sticky top-fib-8 space-y-fib-6 h-fit"
      initial={{ opacity: 0, x: 89 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.618, ease: "easeOut" }}
    >
      {/* Data Summary Card - Mathematical Glassmorphism */}
      <div className="math-glass-strong p-fib-6">
        <h3 className="text-h4 font-semibold text-white mb-fib-5 flex items-center gap-fib-3">
          <Sigma className="w-fib-5 h-fib-5 text-vedic-saffron" />
          Data Summary
        </h3>
        
        <div className="space-y-fib-4">
          {/* Name */}
          <div className="flex items-center gap-fib-3">
            <User className="w-fib-4 h-fib-4 text-vedic-saffron/phi" />
            <div className="flex-1">
              <div className="text-phi-sm text-white/phi-light">Name</div>
              <div className="text-h6 text-white font-mono truncate">
                {birthData.fullName || 'Not provided'}
              </div>
            </div>
          </div>
          
          {/* Date of Birth */}
          <div className="flex items-center gap-fib-3">
            <Calendar className="w-fib-4 h-fib-4 text-vedic-saffron/phi" />
            <div className="flex-1">
              <div className="text-phi-sm text-white/phi-light">Date of Birth</div>
              <div className="text-h6 text-white font-mono">
                {birthData.dateOfBirth ? new Date(birthData.dateOfBirth).toLocaleDateString('en-IN') : 'Not provided'}
              </div>
            </div>
          </div>
          
          {/* Tentative Time */}
          <div className="flex items-center gap-fib-3">
            <Clock className="w-fib-4 h-fib-4 text-vedic-saffron/phi" />
            <div className="flex-1">
              <div className="text-phi-sm text-white/phi-light">Tentative Time</div>
              <div className="text-h6 text-white font-mono">
                {birthData.tentativeTime || 'Not provided'}
                {birthData.timeUncertainty && birthData.timeUncertainty !== 'exact' && (
                  <span className="text-phi-sm text-white/phi-light ml-fib-2">
                    (±{birthData.timeUncertainty})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Birth Place */}
          <div className="flex items-center gap-fib-3">
            <MapPin className="w-fib-4 h-fib-4 text-vedic-saffron/phi" />
            <div className="flex-1">
              <div className="text-phi-sm text-white/phi-light">Birth Place</div>
              <div className="text-h6 text-white font-mono truncate">
                {birthData.birthPlace || 'Not provided'}
              </div>
              {birthData.latitude && birthData.longitude && (
                <div className="text-phi-sm text-white/phi-light font-mono">
                  {birthData.latitude.toFixed(4)}°, {birthData.longitude.toFixed(4)}°
                </div>
              )}
            </div>
          </div>
          
          {/* Gender */}
          <div className="flex items-center gap-fib-3">
            <FunctionSquare className="w-fib-4 h-fib-4 text-vedic-saffron/phi" />
            <div className="flex-1">
              <div className="text-phi-sm text-white/phi-light">Gender</div>
              <div className="text-h6 text-white font-mono capitalize">
                {birthData.gender || 'Not provided'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Counter - Mathematical Progress */}
      {currentStep >= 3 && (
        <div className="math-glass-strong p-fib-6">
          <h3 className="text-h4 font-semibold text-white mb-fib-5 flex items-center gap-fib-3">
            <Activity className="w-fib-5 h-fib-5 text-vedic-saffron" />
            Event Progress
          </h3>
          
          <div className="space-y-fib-4">
            {/* Event Count */}
            <div className="flex items-center justify-between">
              <span className="text-h6 text-white/phi-light">Events Added</span>
              <span className="text-h4 font-mono text-vedic-saffron">
                {lifeEvents.length}/3 minimum
              </span>
            </div>
            
            {/* Progress Bar - Mathematical */}
            <div className="math-progress-bar">
              <motion.div
                className="math-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((lifeEvents.length / 7) * 100, 100)}%` }}
                transition={{ duration: 0.618, ease: "easeOut" }}
              />
            </div>
            
            {/* Event Categories */}
            <div className="grid grid-cols-2 gap-fib-3">
              {Object.entries(
                lifeEvents.reduce((acc, event) => {
                  acc[event.category] = (acc[event.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([category, count]) => {
                const Icon = categoryIcons[category as EventCategory];
                return (
                  <div key={category} className="flex items-center gap-fib-2">
                    <Icon className="w-fib-3 h-fib-3 text-vedic-saffron/phi" />
                    <span className="text-phi-sm text-white/phi-light capitalize">{category}</span>
                    <span className="text-h6 font-mono text-vedic-saffron ml-auto">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Confidence Estimator - Mathematical Meter */}
      <div className="math-glass-strong p-fib-6">
        <h3 className="text-h4 font-semibold text-white mb-fib-5 flex items-center gap-fib-3">
          <Target className="w-fib-5 h-fib-5 text-vedic-saffron" />
          Confidence Estimator
        </h3>
        
        <div className="space-y-fib-4">
          {/* Confidence Level */}
          <div className="flex items-center justify-between">
            <span className="text-h6 text-white/phi-light">Current Level</span>
            <motion.span 
              className={`text-h4 font-mono font-bold
                ${confidenceLevel === 'Very High' ? 'text-green-400' :
                  confidenceLevel === 'High' ? 'text-blue-400' :
                  confidenceLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}
              key={confidenceLevel}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {confidenceLevel}
            </motion.span>
          </div>
          
          {/* Confidence Meter - Mathematical Progress */}
          <div className="math-progress-bar h-fib-3">
            <motion.div
              className={`math-progress-fill h-full rounded-fib-2
                ${completionPercentage >= 80 ? 'bg-gradient-to-r from-green-500 to-vedic-saffron' :
                  completionPercentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-vedic-saffron' :
                  completionPercentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-vedic-orange' :
                  'bg-gradient-to-r from-red-500 to-vedic-orange'}`}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.618, ease: "easeOut" }}
            />
          </div>
          
          {/* Completion Percentage */}
          <div className="flex items-center justify-between">
            <span className="text-h6 text-white/phi-light">Data Completeness</span>
            <span className="text-h5 font-mono text-white">
              {completionPercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Mathematical Indicators */}
          <div className="grid grid-cols-2 gap-fib-3 pt-fib-4 border-t border-white/phi">
            <div className="text-center">
              <div className="text-phi-sm text-white/phi-light">Step Progress</div>
              <div className="text-h4 font-mono text-vedic-saffron">
                {currentStep}/4
              </div>
            </div>
            <div className="text-center">
              <div className="text-phi-sm text-white/phi-light">Data Quality</div>
              <div className="text-h4 font-mono text-vedic-saffron">
                {lifeEvents.length >= 3 ? '✓' : '○'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mini Fibonacci Spiral - Mathematical Decoration */}
      <div className="math-glass-strong p-fib-6 flex flex-col items-center">
        <h4 className="text-h6 font-semibold text-white/phi-dark mb-fib-4 text-center">
          Mathematical Precision
        </h4>
        <div className="relative w-fib-8 h-fib-8">
          <FibonacciSpiral size={55} opacity={0.382} animated={true} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-phi-sm font-mono text-vedic-saffron">φ = 1.618</div>
              <div className="text-phi-xs text-white/phi-light mt-fib-1">Golden Ratio</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mathematical Status Indicators */}
      <div className="space-y-fib-3">
        <div className={`p-fib-3 rounded-fib-3 border ${currentStep >= 1 ? 'bg-green-500/20 border-green-500/50' : 'bg-white/phi-light border-white/phi'}`}>
          <div className="flex items-center gap-fib-3">
            <div className={`w-fib-3 h-fib-3 rounded-full ${currentStep >= 1 ? 'bg-green-500' : 'bg-white/phi'}`} />
            <span className={`text-h6 ${currentStep >= 1 ? 'text-green-400' : 'text-white/phi-light'}`}>
              Birth Data {currentStep >= 1 ? '✓' : '○'}
            </span>
          </div>
        </div>
        
        <div className={`p-fib-3 rounded-fib-3 border ${currentStep >= 2 ? 'bg-green-500/20 border-green-500/50' : 'bg-white/phi-light border-white/phi'}`}>
          <div className="flex items-center gap-fib-3">
            <div className={`w-fib-3 h-fib-3 rounded-full ${currentStep >= 2 ? 'bg-green-500' : 'bg-white/phi'}`} />
            <span className={`text-h6 ${currentStep >= 2 ? 'text-green-400' : 'text-white/phi-light'}`}>
              Physical Traits {currentStep >= 2 ? '✓' : '○'}
            </span>
          </div>
        </div>
        
        <div className={`p-fib-3 rounded-fib-3 border ${lifeEvents.length >= 3 ? 'bg-green-500/20 border-green-500/50' : 'bg-white/phi-light border-white/phi'}`}>
          <div className="flex items-center gap-fib-3">
            <div className={`w-fib-3 h-fib-3 rounded-full ${lifeEvents.length >= 3 ? 'bg-green-500' : 'bg-white/phi'}`} />
            <span className={`text-h6 ${lifeEvents.length >= 3 ? 'text-green-400' : 'text-white/phi-light'}`}>
              Life Events {lifeEvents.length >= 3 ? '✓' : '○'} ({lifeEvents.length}/3)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}