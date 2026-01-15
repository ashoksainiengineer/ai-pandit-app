'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Sigma, FunctionSquare, Binary, Calculator, 
  Target, Clock, Star, Sparkles, ChevronDown, CheckCircle,
  Award, TrendingUp, Shield, Zap, Globe, BarChart3
} from 'lucide-react';
import FibonacciSpiral from './FibonacciSpiral';
import ZodiacWheel from './ZodiacWheel';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('accuracy');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const techSpecs = [
    {
      id: 'accuracy',
      icon: Target,
      title: 'Swiss Ephemeris Accuracy',
      value: '0.001 arc-sec',
      description: 'NASA-grade planetary position calculations with sub-arcsecond precision'
    },
    {
      id: 'verification',
      icon: Shield,
      title: 'Tattwa Shodhana',
      value: 'Gender Verified',
      description: 'Physical description correlation with ascendant characteristics'
    },
    {
      id: 'interlinks',
      icon: Zap,
      title: 'KP Cusp Interlinks',
      value: '240° System',
      description: 'Krishnamurti Paddhati cusp analysis for micro-timing corrections'
    }
  ];

  const problemCards = [
    {
      title: 'The D-60 Shift',
      description: 'Shastiamsa changes every 2 minutes. Wrong time = Wrong Past Life Karma reading.',
      icon: Clock,
      color: 'from-vedic-saffron to-vedic-orange',
      stat: '2 min'
    },
    {
      title: 'The Twin Paradox',
      description: 'Twins born 3 minutes apart have different destinies. Only AI sees the micro-degrees.',
      icon: Sigma,
      color: 'from-blue-500 to-purple-500',
      stat: '3 min'
    },
    {
      title: 'Pranapada Lagna',
      description: 'The \'Breath\' of the chart moves too fast for humans to catch. Our AI locks it.',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      stat: '4 sec'
    }
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '₹890',
      period: 'one-time',
      features: [
        'Single Time Rectification',
        'Basic Event Analysis (3 events)',
        'D-1 & D-9 Charts',
        'Vimshottari Dasha',
        'PDF Report'
      ],
      popular: false,
      ratio: 1
    },
    {
      name: 'Pro',
      price: '₹1597',
      period: 'one-time',
      features: [
        'Advanced Multi-Method Rectification',
        'Comprehensive Event Analysis (7+ events)',
        'All Divisional Charts (D-1 to D-60)',
        'Vimshottari & Yogini Dasha',
        'Physical Verification System',
        'Detailed PDF + Digital Report',
        'Priority Support'
      ],
      popular: true,
      ratio: 1.618
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-vedic relative overflow-hidden">
      {/* Mathematical Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Sacred geometry orbs */}
        <motion.div 
          className="absolute top-[144px] -left-[89px] w-[377px] h-[377px] bg-vedic-saffron/phi rounded-full filter blur-[150px]"
          animate={{ scale: [1, 1.618, 1], opacity: [0.382, 0.618, 0.382] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[144px] -right-[89px] w-[233px] h-[233px] bg-vedic-orange/phi rounded-full filter blur-[120px]"
          animate={{ scale: [1, 1.272, 1], opacity: [0.618, 0.786, 0.618] }}
          transition={{ duration: 6, delay: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Mathematical grid */}
        <div className="absolute inset-0 opacity-phi">
          {[...Array(13)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-vedic-saffron/10"
              style={{
                left: `${(i * 7.7)}%`,
                top: 0,
                bottom: 0,
                borderLeftWidth: '1px'
              }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section - Golden Ratio Split */}
      <section className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-[34px] py-[89px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[55px] items-center min-h-[61.8vh]">
            {/* Left: Mathematical Truth (61.8%) */}
            <motion.div 
              className="space-y-[34px]"
              initial={{ opacity: 0, x: -89 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.618, ease: "easeOut" }}
            >
              <motion.div 
                className="inline-flex items-center gap-[13px] px-[21px] py-[8px] bg-white/phi rounded-[21px] border border-vedic-saffron/phi"
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.618, duration: 0.8 }}
              >
                <Sigma className="w-[21px] h-[21px] text-vedic-saffron" />
                <span className="text-[13px] font-semibold text-white/80 tracking-wider">
                  MATHEMATICAL ASTROLOGY
                </span>
              </motion.div>

              <motion.h1 
                className="text-[144px] font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-vedic-saffron to-vedic-orange leading-[160px] tracking-tight"
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.21, duration: 1.2 }}
              >
                Decode Your
                <br />
                <span className="text-white">Time.</span>
              </motion.h1>

              <motion.p 
                className="text-[34px] text-white/phi leading-[44px] font-medium"
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.382, duration: 0.8 }}
              >
                Astrology is not Magic. It is Geometry. A 4-minute error shifts your axis by 1 degree. We fix it.
              </motion.p>

              <motion.div 
                className="flex items-center gap-[34px] pt-[21px]"
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.618, duration: 0.8 }}
              >
                <motion.button
                  onClick={onEnter}
                  className="flex items-center gap-[13px] px-[34px] py-[21px] bg-gradient-saffron text-white rounded-[21px] font-semibold text-[21px] hover:shadow-lg hover:shadow-vedic-saffron/phi transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Begin Rectification
                  <ArrowRight className="w-[21px] h-[21px]" />
                </motion.button>

                <div className="flex items-center gap-[13px] text-white/60">
                  <CheckCircle className="w-[21px] h-[21px] text-green-400" />
                  <span className="text-[16px]">99.7% Accuracy Rate</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Sacred Geometry (38.2%) */}
            <motion.div 
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.618, duration: 1.618, ease: "easeOut" }}
            >
              <div className="relative w-[377px] h-[377px]">
                <FibonacciSpiral size={377} className="absolute inset-0" />
                <div className="absolute inset-[89px]">
                  <ZodiacWheel size={200} animated={true} />
                </div>
                
                {/* Central convergence point */}
                <motion.div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] bg-vedic-saffron rounded-full shadow-lg shadow-vedic-saffron/phi"
                  animate={{ 
                    scale: [1, 1.618, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-[34px] left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-[21px] h-[21px] text-white/phi" />
        </motion.div>
      </section>

      {/* Problem Section - The Chaos of Rounding */}
      <section className="relative py-[144px] bg-black/phi backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-[34px]">
          <motion.div 
            className="text-center mb-[89px]"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[89px] font-display font-bold text-white mb-[21px]">
              The Butterfly Effect
            </h2>
            <p className="text-[34px] text-white/phi max-w-4xl mx-auto">
              of Wrong Time
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[34px]">
            {problemCards.map((card, index) => (
              <motion.div
                key={card.title}
                className="vedic-card p-[34px] text-center group"
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.21, duration: 0.8 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-[89px] h-[89px] mx-auto mb-[21px] bg-gradient-to-br ${card.color} rounded-[21px] flex items-center justify-center`}>
                  <card.icon className="w-[34px] h-[34px] text-white" />
                </div>
                
                <div className="text-[55px] font-bold text-white mb-[13px] font-mono">
                  {card.stat}
                </div>
                
                <h3 className="text-[24px] font-semibold text-white mb-[13px]">
                  {card.title}
                </h3>
                
                <p className="text-[16px] text-white/phi leading-relaxed">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Algorithm Section - The Golden Solution */}
      <section className="relative py-[144px]">
        <div className="max-w-7xl mx-auto px-[34px]">
          <motion.div 
            className="text-center mb-[89px]"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[89px] font-display font-bold text-white mb-[21px]">
              Triangulation Engine
            </h2>
            <p className="text-[34px] text-white/phi">
              Mathematical Precision in 4 Steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-[34px]">
            {[
              { step: 1, title: 'Input', desc: 'Your Approximate Window', icon: Clock },
              { step: 2, title: 'Anchor', desc: '3 Past Events (Data Points)', icon: Target },
              { step: 3, title: 'Calculate', desc: 'Swiss Ephemeris Backwards', icon: Calculator },
              { step: 4, title: 'Result', desc: '100% Mathematical Probability', icon: Award }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.21, duration: 0.8 }}
              >
                <div className="w-[89px] h-[89px] mx-auto mb-[21px] bg-gradient-saffron rounded-[21px] flex items-center justify-center">
                  <item.icon className="w-[34px] h-[34px] text-white" />
                </div>
                
                <div className="text-[34px] font-bold text-vedic-saffron mb-[8px]">
                  Step {item.step}
                </div>
                
                <h3 className="text-[24px] font-semibold text-white mb-[8px]">
                  {item.title}
                </h3>
                
                <p className="text-[16px] text-white/phi">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Specs Section - Mathematical Authority */}
      <section className="relative py-[144px] bg-black/phi backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-[34px]">
          <motion.div 
            className="text-center mb-[89px]"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[89px] font-display font-bold text-white mb-[21px]">
              Technical Specifications
            </h2>
            <p className="text-[34px] text-white/phi">
              Built on Mathematical Foundations
            </p>
          </motion.div>

          <div className="flex justify-center mb-[55px]">
            <div className="inline-flex bg-white/phi rounded-[21px] p-[8px]">
              {techSpecs.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => setActiveTab(spec.id)}
                  className={`flex items-center gap-[13px] px-[21px] py-[13px] rounded-[13px] font-semibold transition-all ${
                    activeTab === spec.id
                      ? 'bg-vedic-saffron text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/phi'
                  }`}
                >
                  <spec.icon className="w-[21px] h-[21px]" />
                  <span className="text-[16px]">{spec.title}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {techSpecs.map((spec) => (
              <motion.div
                key={spec.id}
                className="vedic-card p-[55px] text-center max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: activeTab === spec.id ? 1 : 0, y: activeTab === spec.id ? 0 : 21 }}
                exit={{ opacity: 0, y: -21 }}
                transition={{ duration: 0.5 }}
                style={{ display: activeTab === spec.id ? 'block' : 'none' }}
              >
                <div className="w-[89px] h-[89px] mx-auto mb-[21px] bg-gradient-saffron rounded-[21px] flex items-center justify-center">
                  <spec.icon className="w-[34px] h-[34px] text-white" />
                </div>
                
                <div className="text-[55px] font-bold text-vedic-saffron mb-[13px] font-mono">
                  {spec.value}
                </div>
                
                <h3 className="text-[34px] font-semibold text-white mb-[13px]">
                  {spec.title}
                </h3>
                
                <p className="text-[21px] text-white/phi leading-relaxed">
                  {spec.description}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Pricing Section - Fibonacci Pricing */}
      <section className="relative py-[144px]">
        <div className="max-w-7xl mx-auto px-[34px]">
          <motion.div 
            className="text-center mb-[89px]"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[89px] font-display font-bold text-white mb-[21px]">
              Mathematical Pricing
            </h2>
            <p className="text-[34px] text-white/phi">
              Fibonacci-Aligned Investment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[55px] max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`vedic-card p-[34px] relative ${
                  plan.popular ? 'border-vedic-saffron/phi bg-vedic-saffron/phi' : ''
                }`}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.21, duration: 0.8 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  transform: plan.popular ? `scale(${plan.ratio})` : 'scale(1)'
                }}
              >
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-[21px] py-[8px] bg-gradient-saffron text-white rounded-[13px] text-[13px] font-semibold"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    MOST POPULAR
                  </motion.div>
                )}
                
                <div className="text-center mb-[34px]">
                  <h3 className="text-[34px] font-semibold text-white mb-[8px]">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline justify-center gap-[8px]">
                    <span className="text-[89px] font-bold text-vedic-saffron font-mono">
                      {plan.price}
                    </span>
                    <span className="text-[16px] text-white/phi">
                      {plan.period}
                    </span>
                  </div>
                </div>
                
                <ul className="space-y-[13px] mb-[34px]">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-[13px]">
                      <CheckCircle className="w-[16px] h-[16px] text-green-400 flex-shrink-0 mt-[2px]" />
                      <span className="text-[16px] text-white/phi">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.button
                  onClick={onEnter}
                  className={`w-full py-[21px] rounded-[21px] font-semibold text-[21px] transition-all ${
                    plan.popular
                      ? 'bg-gradient-saffron text-white shadow-lg shadow-vedic-saffron/phi'
                      : 'bg-white/phi text-white border border-vedic-saffron/phi hover:bg-vedic-saffron/phi'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Choose {plan.name}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-[144px] bg-gradient-to-r from-vedic-saffron/20 to-vedic-orange/20">
        <div className="max-w-4xl mx-auto px-[34px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-[34px]"
          >
            <h2 className="text-[89px] font-display font-bold text-white">
              Ready to Decode?
            </h2>
            
            <p className="text-[34px] text-white/phi">
              Your exact birth time is waiting to be discovered.
            </p>
            
            <motion.button
              onClick={onEnter}
              className="inline-flex items-center gap-[21px] px-[55px] py-[34px] bg-gradient-saffron text-white rounded-[21px] font-bold text-[34px] hover:shadow-2xl hover:shadow-vedic-saffron/phi transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calculator className="w-[34px] h-[34px]" />
              Begin Rectification
              <ArrowRight className="w-[34px] h-[34px]" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-[55px] border-t border-white/phi bg-black/phi backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-[34px] text-center">
          <div className="flex items-center justify-center gap-[13px] mb-[21px]">
            <FunctionSquare className="w-[21px] h-[21px] text-vedic-saffron" />
            <Binary className="w-[21px] h-[21px] text-vedic-orange" />
            <Sigma className="w-[21px] h-[21px] text-vedic-saffron" />
          </div>
          
          <p className="text-[16px] text-white/phi">
            AI-Pandit: Where Mathematics Meets Destiny • φ = 1.618
          </p>
        </div>
      </footer>
    </div>
  );
}
