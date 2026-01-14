import { useState, useEffect, useCallback } from 'react';

export interface CelebrationConfig {
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export interface UseCelebrationReturn {
  isActive: boolean;
  triggerCelebration: () => void;
  particles: Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    velocity: { x: number; y: number };
  }>;
}

export const useCelebrationAnimation = (config: CelebrationConfig = {}): UseCelebrationReturn => {
  const {
    duration = 3000,
    particleCount = 50,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c']
  } = config;

  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<UseCelebrationReturn['particles']>([]);

  const triggerCelebration = useCallback(() => {
    setIsActive(true);
    
    // Generate particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10
      }
    }));
    
    setParticles(newParticles);
    
    // Auto-stop after duration
    setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, duration);
  }, [duration, particleCount, colors]);

  // Animation loop for particles
  useEffect(() => {
    if (!isActive || particles.length === 0) return;

    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x,
          y: particle.y + particle.velocity.y,
          velocity: {
            x: particle.velocity.x * 0.98, // Damping
            y: particle.velocity.y * 0.98 + 0.2 // Gravity
          }
        })).filter(particle => 
          particle.y < window.innerHeight + 50 // Remove particles that fell off screen
        )
      );
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [isActive, particles.length]);

  return {
    isActive,
    triggerCelebration,
    particles
  };
};

// CSS for celebration effects
export const celebrationStyles = `
  @keyframes celebration-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  
  .celebration-pulse {
    animation: celebration-pulse 0.5s ease-in-out infinite;
  }
  
  @keyframes confetti-fall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  
  .confetti {
    animation: confetti-fall 3s linear infinite;
  }
`;