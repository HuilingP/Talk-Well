"use client";

import { useEffect } from 'react';

const STAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-400">
  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
</svg>
`;

const MouseEffects = () => {
  useEffect(() => {
    const pointer = { x: 0.5 * window.innerWidth, y: 0.5 * window.innerHeight };
    const lastPointer = { ...pointer };
    let lastTimestamp = performance.now();

    const halo = document.createElement('div');
    halo.className = 'pointer-events-none fixed inset-0 z-50 transition-opacity duration-300';
    document.body.appendChild(halo);

    const updateHalo = () => {
      const now = performance.now();
      const deltaTime = now - lastTimestamp;
      lastTimestamp = now;

      const deltaX = pointer.x - lastPointer.x;
      const deltaY = pointer.y - lastPointer.y;
      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

      const haloSize = 133 + speed * 33;
      const haloOpacity = 0.1 + Math.min(speed * 0.1, 0.4);

      halo.style.background = `radial-gradient(${haloSize}px at ${pointer.x}px ${pointer.y}px, oklch(var(--primary) / ${haloOpacity}), transparent 80%)`;

      if (speed > 1.5) {
        createStar(pointer.x, pointer.y, speed);
      }

      lastPointer.x = pointer.x;
      lastPointer.y = pointer.y;
    };

    const createStar = (x: number, y: number, speed: number) => {
      const star = document.createElement('div');
      star.innerHTML = STAR_SVG;
      star.className = 'fixed z-50 pointer-events-none';
      const size = 10 + Math.min(speed * 2, 15);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${x - size / 2}px`;
      star.style.top = `${y - size / 2}px`;
      
      const animation = star.animate(
        [
          { transform: `translate(0, 0) rotate(0deg) scale(1)`, opacity: 1 },
          { transform: `translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px) rotate(${Math.random() * 360}deg) scale(0)`, opacity: 0 }
        ],
        {
          duration: 2000,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
      
      animation.onfinish = () => star.remove();
      document.body.appendChild(star);
    };

    const onMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };

    const loop = () => {
      updateHalo();
      requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMouseMove);
    const animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      document.body.removeChild(halo);
    };
  }, []);

  return null;
};

export default MouseEffects;
