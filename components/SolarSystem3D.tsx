'use client';

import { useEffect, useRef, useState } from 'react';

interface Planet {
  name: string;
  size: number;
  distance: number;
  speed: number;
  color: string;
  x: number;
  y: number;
  z: number;
  angle: number;
}

export default function SolarSystem3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Planets data
    const planets: Planet[] = [
      { name: 'Sun', size: 20, distance: 0, speed: 0, color: '#FFD700', x: 0, y: 0, z: 0, angle: 0 },
      { name: 'Mercury', size: 4, distance: 60, speed: 0.04, color: '#A0522D', x: 0, y: 0, z: 0, angle: 0 },
      { name: 'Venus', size: 7, distance: 100, speed: 0.015, color: '#FFA500', x: 0, y: 0, z: 0, angle: 0 },
      { name: 'Earth', size: 7.5, distance: 150, speed: 0.01, color: '#4169E1', x: 0, y: 0, z: 0, angle: 0 },
      { name: 'Mars', size: 5, distance: 200, speed: 0.008, color: '#FF6347', x: 0, y: 0, z: 0, angle: 0 },
      { name: 'Jupiter', size: 16, distance: 280, speed: 0.002, color: '#DAA520', x: 0, y: 0, z: 0, angle: 0 },
    ];

    // Star field
    const stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width * 2 - canvas.width,
        y: Math.random() * canvas.height * 2 - canvas.height,
        size: Math.random() * 1.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }

    // Animation loop
    const animate = () => {
      // Smooth camera movement based on mouse
      setCameraRotation((prev) => ({
        x: prev.x + (mouse.y * 0.5 - prev.x) * 0.05,
        y: prev.y + (mouse.x * 0.5 - prev.y) * 0.05,
      }));

      // Clear canvas with gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
      );
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a0033');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Add some nebula effects
      ctx.fillStyle = 'rgba(138, 43, 226, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply camera rotation for 3D perspective
      const scale = 1 + Math.sin(Date.now() * 0.0002) * 0.1;

      // Update and draw planets
      planets.forEach((planet) => {
        if (planet.distance > 0) {
          planet.angle += planet.speed;
          planet.x = Math.cos(planet.angle) * planet.distance * scale;
          planet.y = Math.sin(planet.angle) * planet.distance * scale * 0.5;
          planet.z = Math.sin(planet.angle + Math.PI / 4) * planet.distance * 0.3;
        }

        // Apply camera rotation
        const rotatedX =
          planet.x * Math.cos(cameraRotation.y) - planet.z * Math.sin(cameraRotation.y);
        const rotatedZ =
          planet.x * Math.sin(cameraRotation.y) + planet.z * Math.cos(cameraRotation.y);
        const rotatedY =
          planet.y * Math.cos(cameraRotation.x) - rotatedZ * Math.sin(cameraRotation.x);

        // Perspective projection
        const perspectiveScale = 800 / (800 + rotatedZ);
        const screenX = centerX + rotatedX * perspectiveScale;
        const screenY = centerY + rotatedY * perspectiveScale;
        const screenSize = planet.size * perspectiveScale;

        // Draw planet glow
        const glowGradient = ctx.createRadialGradient(
          screenX,
          screenY,
          0,
          screenX,
          screenY,
          screenSize * 2
        );
        glowGradient.addColorStop(0, `${planet.color}40`);
        glowGradient.addColorStop(1, `${planet.color}00`);
        ctx.fillStyle = glowGradient;
        ctx.fillRect(screenX - screenSize * 2, screenY - screenSize * 2, screenSize * 4, screenSize * 4);

        // Draw planet
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenSize, 0, Math.PI * 2);
        ctx.fill();

        // Orbital rings for planets
        if (planet.distance > 0) {
          ctx.strokeStyle = `${planet.color}30`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, planet.distance * scale, planet.distance * scale * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraRotation, mouse]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-black rounded-lg"
      style={{
        cursor: 'none',
        display: 'block',
      }}
    />
  );
}
