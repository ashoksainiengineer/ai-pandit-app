'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', element: 'Fire', degree: 0 },
  { name: 'Taurus', symbol: '♉', element: 'Earth', degree: 30 },
  { name: 'Gemini', symbol: '♊', element: 'Air', degree: 60 },
  { name: 'Cancer', symbol: '♋', element: 'Water', degree: 90 },
  { name: 'Leo', symbol: '♌', element: 'Fire', degree: 120 },
  { name: 'Virgo', symbol: '♍', element: 'Earth', degree: 150 },
  { name: 'Libra', symbol: '♎', element: 'Air', degree: 180 },
  { name: 'Scorpio', symbol: '♏', element: 'Water', degree: 210 },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire', degree: 240 },
  { name: 'Capricorn', symbol: '♑', element: 'Earth', degree: 270 },
  { name: 'Aquarius', symbol: '♒', element: 'Air', degree: 300 },
  { name: 'Pisces', symbol: '♓', element: 'Water', degree: 330 }
];

interface ZodiacWheelProps {
  size?: number;
  animated?: boolean;
  highlightSign?: string;
  className?: string;
}

export default function ZodiacWheel({ 
  size = 377, 
  animated = true, 
  highlightSign,
  className = ''
}: ZodiacWheelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (animated) {
      const interval = setInterval(() => {
        setRotation(prev => prev + 0.5); // Slow rotation
      }, 50);
      return () => clearInterval(interval);
    }
  }, [animated]);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.618, ease: "easeOut" }}
    >
      {/* Outer ring with golden ratio spacing */}
      <motion.svg
        width={size}
        height={size}
        className="absolute inset-0"
<<<<<<< HEAD
=======
        suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Main circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#FF9F1C"
          strokeWidth="2"
          opacity="0.618"
        />
        
        {/* Inner circles with Fibonacci spacing */}
        {[0.618, 0.786, 0.888].map((ratio, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * ratio}
            fill="none"
            stroke="#FF6B35"
            strokeWidth="1"
            opacity={0.618 - i * 0.1}
          />
        ))}
        
        {/* Zodiac sign positions */}
        {ZODIAC_SIGNS.map((sign, index) => {
          const angle = (sign.degree - 90) * Math.PI / 180; // -90 to start from top
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const isHighlighted = highlightSign === sign.name;
          
          return (
            <g key={sign.name}>
              {/* Line to sign */}
              <line
<<<<<<< HEAD
=======
                suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={isHighlighted ? "#FFD700" : "#FF9F1C"}
                strokeWidth={isHighlighted ? "2" : "1"}
                opacity={isHighlighted ? "1" : "0.618"}
              />
              
              {/* Sign symbol circle */}
              <circle
<<<<<<< HEAD
=======
                suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
                cx={x}
                cy={y}
                r={isHighlighted ? "21" : "13"}
                fill={isHighlighted ? "#FFD700" : "#1a1a2e"}
                stroke={isHighlighted ? "#FFD700" : "#FF9F1C"}
                strokeWidth={isHighlighted ? "3" : "2"}
                opacity={isHighlighted ? "1" : "0.8"}
              />
              
              {/* Sign symbol */}
              <text
<<<<<<< HEAD
=======
                suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
                x={x}
                y={y + 5}
                textAnchor="middle"
                className="text-[21px] font-bold"
                fill={isHighlighted ? "#1a1a2e" : "#FF9F1C"}
              >
                {sign.symbol}
              </text>
              
              {/* Element indicator */}
              <circle
<<<<<<< HEAD
=======
                suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
                cx={x + 21 * Math.cos(angle)}
                cy={y + 21 * Math.sin(angle)}
                r="3"
                fill={
                  sign.element === 'Fire' ? '#FF6B35' :
                  sign.element === 'Earth' ? '#8B4513' :
                  sign.element === 'Air' ? '#87CEEB' :
                  '#4682B4'
                }
                opacity="0.8"
              />
            </g>
          );
        })}
        
        {/* Central point */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#FFD700"
          opacity="1"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="5"
          fill="#FF9F1C"
          opacity="0.8"
        />
      </motion.svg>
      
      {/* Mathematical annotations */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 21 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.618, duration: 0.8 }}
        >
          <div className="text-[34px] font-bold text-vedic-saffron mb-[8px]">360°</div>
          <div className="text-[13px] text-white/60 uppercase tracking-wider">Zodiac Circle</div>
          <div className="text-[21px] font-mono text-vedic-orange mt-[13px]">φ = 1.618</div>
        </motion.div>
      </div>
      
      {/* Animated particles */}
      {animated && [...Array(13)].map((_, i) => {
        const angle = (i * 137.5) * Math.PI / 180; // Golden angle
        const particleRadius = radius * 0.618;
        const x = centerX + particleRadius * Math.cos(angle);
        const y = centerY + particleRadius * Math.sin(angle);
        
        return (
          <motion.div
            key={i}
            className="absolute w-[3px] h-[3px] bg-vedic-saffron rounded-full"
<<<<<<< HEAD
=======
            suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
            style={{ left: x, top: y }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 3,
              delay: i * 0.21,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}