'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FibonacciSpiralProps {
  size?: number;
  color?: string;
  opacity?: number;
  animated?: boolean;
  className?: string;
}

export default function FibonacciSpiral({ 
  size = 377, 
  color = '#FF9F1C', 
  opacity = 0.618,
  animated = true,
  className = ''
}: FibonacciSpiralProps) {
  const [spiralPath, setSpiralPath] = useState('');

  useEffect(() => {
    // Generate Fibonacci spiral path
    const generateFibonacciSpiral = () => {
      const centerX = size / 2;
      const centerY = size / 2;
      const goldenAngle = 137.5; // Golden angle in degrees
      const scaleFactor = size / 400;
      
      let path = `M ${centerX} ${centerY}`;
      
      for (let i = 0; i < 200; i++) {
        const angle = (i * goldenAngle) * Math.PI / 180;
        const radius = Math.sqrt(i) * 3 * scaleFactor;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        path += ` L ${x} ${y}`;
      }
      
      return path;
    };

    setSpiralPath(generateFibonacciSpiral());
  }, [size]);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
<<<<<<< HEAD
=======
      suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: opacity, scale: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      {/* Golden ratio circles */}
      {[1, 2, 3, 4, 5].map((i) => {
        const radius = (Math.pow(1.618, i) * 10 * size / 400);
        return (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={opacity * Math.pow(0.618, i)}
<<<<<<< HEAD
=======
            suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
            animate={animated ? {
              scale: [1, 1.618, 1],
              opacity: [opacity * Math.pow(0.618, i), opacity * Math.pow(0.618, i) * 1.618, opacity * Math.pow(0.618, i)]
            } : {}}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
      
      {/* Fibonacci spiral */}
      <motion.path
        d={spiralPath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={opacity}
        animate={animated ? {
          pathLength: [0, 1],
          opacity: [opacity * 0.382, opacity, opacity * 0.382]
        } : {}}
        transition={{
          pathLength: {
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          },
          opacity: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />
      
      {/* Sacred geometry points */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const radian = (angle * Math.PI) / 180;
        const x = size / 2 + (size * 0.3) * Math.cos(radian);
        const y = size / 2 + (size * 0.3) * Math.sin(radian);
        
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill={color}
            opacity={opacity}
<<<<<<< HEAD
=======
            suppressHydrationWarning
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
            animate={animated ? {
              scale: [1, 1.618, 1],
              opacity: [opacity, opacity * 1.618, opacity]
            } : {}}
            transition={{
              duration: 3,
              delay: i * 0.618,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </motion.svg>
  );
}