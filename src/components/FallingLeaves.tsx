'use client';

import React, { useEffect, useState } from 'react';

interface Leaf {
  id: number;
  left: number; // percentage across screen
  size: number; // px size
  duration: number; // fall duration in seconds
  delay: number; // start delay in seconds
  swayDuration: number; // sway duration
  opacity: number;
  rotation: number;
  color: string;
  leafType: number;
}

const LEAF_COLORS = [
  '#10B981', // emerald-500
  '#059669', // emerald-600
  '#34D399', // emerald-400
  '#16A34A', // green-600
  '#84CC16', // lime-500
  '#F59E0B', // amber-500
  '#FBBF24', // amber-400
  '#14B8A6', // teal-500
];

export default function FallingLeaves({ count = 25 }: { count?: number }) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    // Generate deterministic yet natural-looking leaf particles
    const generated: Leaf[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 14 + Math.random() * 18, // 14px to 32px
      duration: 7 + Math.random() * 8, // 7s to 15s
      delay: Math.random() * 8, // 0s to 8s
      swayDuration: 2.5 + Math.random() * 3, // 2.5s to 5.5s
      opacity: 0.35 + Math.random() * 0.45, // 0.35 to 0.8
      rotation: Math.random() * 360,
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      leafType: i % 3,
    }));
    setLeaves(generated);
  }, [count]);

  return (
    <>
      <style jsx global>{`
        @keyframes leafFall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes leafSway {
          0% {
            margin-left: 0px;
          }
          50% {
            margin-left: 50px;
          }
          100% {
            margin-left: 0px;
          }
        }

        .falling-leaf {
          position: absolute;
          top: -40px;
          pointer-events: none;
          will-change: transform;
          animation-name: leafFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .falling-leaf > svg {
          animation-name: leafSway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
        }
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none z-1 overflow-hidden"
        aria-hidden="true"
      >
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="falling-leaf"
            style={{
              left: `${leaf.left}%`,
              animationDuration: `${leaf.duration}s`,
              animationDelay: `${leaf.delay}s`,
            }}
          >
            <svg
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 24 24"
              fill={leaf.color}
              style={{
                opacity: leaf.opacity,
                transform: `rotate(${leaf.rotation}deg)`,
                animationDuration: `${leaf.swayDuration}s`,
              }}
            >
              {leaf.leafType === 0 && (
                // Classic Oval Leaf with stem
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              )}
              {leaf.leafType === 1 && (
                // Serrated / Natural Leaf
                <path d="M12 2C8 6 4 10 4 15a8 8 0 0 0 16 0c0-5-4-9-8-13zm0 18a5 5 0 0 1-5-5c0-3 2.5-6.5 5-9.5 2.5 3 5 6.5 5 9.5a5 5 0 0 1-5 5z" />
              )}
              {leaf.leafType === 2 && (
                // Curved floating leaf
                <path d="M21 3C11.5 3 4 10.5 4 20c3-3 8-4.5 12-4.5 2 0 4 .5 5 1.5V3z" />
              )}
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
