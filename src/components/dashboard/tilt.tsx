'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TiltProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function Tilt({ children, className, glowColor = 'rgba(59, 130, 246, 0.5)' }: TiltProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg'])

  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    
    const width = rect.width
    const height = rect.height
    
    const mouseXPos = e.clientX - rect.left
    const mouseYPos = e.clientY - rect.top
    
    const xPct = (mouseXPos / width) - 0.5
    const yPct = (mouseYPos / height) - 0.5
    
    x.set(xPct)
    y.set(yPct)

    mouseX.set(mouseXPos)
    mouseY.set(mouseYPos)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={cn("relative group/tilt", className)}
    >
      {/* Magnetic Aurora Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover/tilt:opacity-100 transition-opacity duration-500 z-30"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([mx, my]) => `radial-gradient(600px circle at ${mx}px ${my}px, ${glowColor}, transparent 40%)`
          ),
        }}
      />
      
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  )
}
