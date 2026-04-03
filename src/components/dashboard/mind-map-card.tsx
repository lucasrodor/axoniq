'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Tilt } from './tilt'
import { Zap } from 'lucide-react'
import { CardKebabMenu } from './deck-card'

interface MindMap {
  id: string
  title: string
  source_id: string | null
  folder_id: string | null
  specialty_tag: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

export function MindMapCard({ 
  mindMap, 
  onRename, 
  onDelete 
}: { 
  mindMap: MindMap, 
  onRename?: (id: string, title: string) => void, 
  onDelete?: (id: string, title: string) => void 
}) {
  const glowColor = 'rgba(59, 130, 246, 0.2)'
  const isGenerating = mindMap.status === 'generating'

  return (
    <Tilt glowColor={glowColor} className="h-full">
      <div className="group/card h-full glass-panel p-6 rounded-2xl aurora-border-blue transition-all duration-500 relative">
        {/* Background Clipping Container for internal glows */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Synaptic Glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-10 bg-blue-500 transition-all duration-700 group-hover/card:scale-150 group-hover/card:opacity-20" />
        </div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover/card:bg-blue-500/20 group-hover/card:text-blue-400 group-hover/card:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-500">
            <Zap size={18} />
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse border border-amber-500/20">
                Mapeando...
              </span>
            )}
            {onRename && onDelete && (
              <CardKebabMenu
                onRename={() => onRename(mindMap.id, mindMap.title)}
                onDelete={() => onDelete(mindMap.id, mindMap.title)}
              />
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-zinc-100 line-clamp-2 mb-4 group-hover/card:text-blue-400 transition-colors relative z-10 tracking-tight">
          {mindMap.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10">
          <span className="flex items-center gap-2 text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-widest leading-none">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            {mindMap.specialty_tag || 'Mapeamento Neuronal'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-auto text-[9px] font-bold text-zinc-600 tracking-widest uppercase relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Formado em {new Date(mindMap.created_at).toLocaleDateString()}</span>
          </div>
          <motion.span 
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="text-blue-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
          >
            Expandir Mapa →
          </motion.span>
        </div>
      </div>
    </Tilt>
  )
}

export function DraggableMindMap({ mindMap, onRename, onDelete }: { mindMap: MindMap, onRename?: (id: string, title: string) => void, onDelete?: (id: string, title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `mindmap-${mindMap.id}` })
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 200,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none select-none h-full",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <Link 
        href={`/dashboard/mindmap/${mindMap.id}`} 
        className="block h-full"
        onClick={(e) => {
          if (isDragging) e.preventDefault()
        }}
      >
        <MindMapCard 
          mindMap={mindMap} 
          onRename={onRename} 
          onDelete={onDelete} 
        />
      </Link>
    </div>
  )
}
