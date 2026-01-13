'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  color: string;
}

interface Galaxy {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  opacity: number;
}

interface Comet {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
}

export default function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const galaxiesRef = useRef<Galaxy[]>([]);
  const cometsRef = useRef<Comet[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeCelestialObjects();
    };

    const initializeCelestialObjects = () => {
      // Initialize stars with golden ratio distribution
      starsRef.current = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 10000);
      
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          color: ['#ffffff', '#ffd700', '#ff9f1c', '#ff6b35', '#87ceeb'][Math.floor(Math.random() * 5)]
        });
      }

      // Initialize galaxies with golden spiral pattern
      galaxiesRef.current = [];
      const galaxyCount = 3;
      
      for (let i = 0; i < galaxyCount; i++) {
        const angle = (i * 137.5) * (Math.PI / 180); // Golden angle
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        
        galaxiesRef.current.push({
          x: canvas.width / 2 + Math.cos(angle) * radius,
          y: canvas.height / 2 + Math.sin(angle) * radius,
          radius: Math.random() * 100 + 50,
          rotation: Math.random() * 360,
          opacity: Math.random() * 0.3 + 0.1
        });
      }

      // Initialize comets
      cometsRef.current = [];
      const cometCount = 2;
      
      for (let i = 0; i < cometCount; i++) {
        cometsRef.current.push({
          x: Math.random() * canvas.width,
          y: -50,
          length: Math.random() * 100 + 50,
          speed: Math.random() * 2 + 1,
          angle: Math.random() * 60 + 15,
          opacity: 0
        });
      }
    };

    const drawStar = (star: Star, time: number) => {
      const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
      const gradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * 3
      );
      
      gradient.addColorStop(0, star.color + Math.floor(star.opacity * twinkle * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, star.color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Core star
      ctx.fillStyle = star.color + Math.floor(star.opacity * twinkle * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawGalaxy = (galaxy: Galaxy, time: number) => {
      ctx.save();
      ctx.translate(galaxy.x, galaxy.y);
      ctx.rotate((galaxy.rotation + time * 0.001) * Math.PI / 180);
      
      // Galaxy core
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius);
      coreGradient.addColorStop(0, `rgba(255, 159, 28, ${galaxy.opacity})`);
      coreGradient.addColorStop(0.5, `rgba(255, 107, 53, ${galaxy.opacity * 0.5})`);
      coreGradient.addColorStop(1, `rgba(74, 14, 78, ${galaxy.opacity * 0.2})`);
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, galaxy.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Spiral arms
      for (let arm = 0; arm < 4; arm++) {
        const armAngle = (arm * 90 + time * 0.001) * Math.PI / 180;
        
        ctx.strokeStyle = `rgba(255, 159, 28, ${galaxy.opacity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 100; i++) {
          const radius = (i / 100) * galaxy.radius;
          const angle = armAngle + (i / 10) * Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      }
      
      ctx.restore();
    };

    const drawComet = (comet: Comet, time: number) => {
      // Update comet position
      comet.y += comet.speed;
      comet.x += Math.cos(comet.angle * Math.PI / 180) * comet.speed;
      
      // Reset comet when it goes off screen
      if (comet.y > canvas.height + 100) {
        comet.y = -50;
        comet.x = Math.random() * canvas.width;
        comet.opacity = 0;
      }
      
      // Fade in/out
      if (comet.y < 100) comet.opacity = Math.min(1, comet.y / 100);
      if (comet.y > canvas.height - 100) comet.opacity = Math.max(0, (canvas.height - comet.y) / 100);
      
      // Comet tail
      const tailGradient = ctx.createLinearGradient(
        comet.x, comet.y,
        comet.x - Math.cos(comet.angle * Math.PI / 180) * comet.length,
        comet.y - Math.sin(comet.angle * Math.PI / 180) * comet.length
      );
      
      tailGradient.addColorStop(0, `rgba(255, 159, 28, ${comet.opacity})`);
      tailGradient.addColorStop(1, `rgba(255, 159, 28, 0)`);
      
      ctx.strokeStyle = tailGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(
        comet.x - Math.cos(comet.angle * Math.PI / 180) * comet.length,
        comet.y - Math.sin(comet.angle * Math.PI / 180) * comet.length
      );
      ctx.stroke();
      
      // Comet head
      const headGradient = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, 8);
      headGradient.addColorStop(0, `rgba(255, 255, 255, ${comet.opacity})`);
      headGradient.addColorStop(1, `rgba(255, 159, 28, ${comet.opacity * 0.5})`);
      
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = (time: number) => {
      // Clear canvas with deep space background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.4, '#1a1a2e');
      gradient.addColorStop(0.8, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw galaxies first (background layer)
      galaxiesRef.current.forEach(galaxy => drawGalaxy(galaxy, time));
      
      // Draw stars
      starsRef.current.forEach(star => drawStar(star, time));
      
      // Draw comets
      cometsRef.current.forEach(comet => drawComet(comet, time));
      
      // Add subtle nebula effects
      ctx.fillStyle = 'rgba(138, 43, 226, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
    />
  );
}
