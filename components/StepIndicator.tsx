'use client';

import { motion } from 'framer-motion';
import { Calendar, User, Activity, Sparkles, Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { 
      num: 1, 
      label: 'Basic Details', 
      icon: Calendar, 
      desc: 'Who & When'
    },
    { 
      num: 2, 
      label: 'Physical Traits', 
      icon: User, 
      desc: 'Verification'
    },
    { 
      num: 3, 
      label: 'Life Events', 
      icon: Activity, 
      desc: 'What Happened'
    },
    { 
      num: 4, 
      label: 'Results', 
      icon: Sparkles, 
      desc: 'Your Time'
    }
  ];
  
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.slice(0, totalSteps).map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive ? 'rgb(251, 191, 36)' : isCompleted ? 'rgb(34, 197, 94)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                    ${isActive ? 'ring-2 ring-amber-400 shadow-lg' : ''}`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/60'}`} />
                  )}
                </motion.div>
                
                <div className="text-center mt-2">
                  <div className={`text-sm font-medium ${isActive ? 'text-amber-400' : 'text-white/70'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {step.desc}
                  </div>
                </div>
              </div>
              
              {idx < totalSteps - 1 && (
                <motion.div 
                  className={`w-16 h-0.5 mx-2 transition-all duration-300 rounded-full
                    ${isCompleted ? 'bg-gradient-to-r from-green-500 to-amber-500' : 'bg-white/20'}`}
                  initial={{ width: 0 }}
                  animate={{ width: '64px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}