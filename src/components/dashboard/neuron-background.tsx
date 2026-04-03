'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export function NeuronBackground() {
  const points = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#09090b]">
      {/* Aurora Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Neural Synapse Points */}
      <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="dotGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {points.map((point) => (
          <motion.circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={point.size * 0.15}
            className="text-blue-500/30"
            fill="url(#dotGradient)"
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: point.duration,
              repeat: Infinity,
              delay: point.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Connecting Lines (Simulated Synapses) */}
        {points.slice(0, 15).map((point, i) => {
          const nextPoint = points[(i + 1) % points.length]
          return (
            <motion.line
              key={`line-${i}`}
              x1={point.x}
              y1={point.y}
              x2={nextPoint.x}
              y2={nextPoint.y}
              stroke="currentColor"
              strokeWidth="0.05"
              className="text-blue-500/10"
              animate={{
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: point.duration * 1.2,
                repeat: Infinity,
                delay: point.delay,
              }}
            />
          )
        })}
      </svg>
      
      {/* Scanline Effect */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
          backgroundSize: `100% 4px, 4px 100%`
        }}
      />
    </div>
  )
}
