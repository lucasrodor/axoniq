import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'

interface MarkdownDisplayProps {
  content: string
  className?: string
  raw?: boolean
  as?: 'div' | 'span'
}

export default function MarkdownDisplay({ content, className, raw, as: Component = 'div' }: MarkdownDisplayProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const baseClasses = raw 
    ? "" 
    : "prose prose-invert prose-blue max-w-none prose-p:leading-relaxed prose-headings:tracking-tight";
    
  return (
    <>
      <Component className={cn(baseClasses, className)}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              <div className="relative group cursor-zoom-in my-4 inline-block max-w-full">
                <img 
                  {...props} 
                  className="rounded-xl border border-zinc-800 shadow-xl max-h-[300px] object-contain transition-transform group-hover:scale-[1.02]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImg(typeof props.src === 'string' ? props.src : null);
                  }}
                />
                <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn size={14} className="text-white" />
                </div>
              </div>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </Component>

      {/* Lightbox Modal via Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedImg && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-10 overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Impede o flip do card
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImg(null);
                }}
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-pointer"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-7xl w-full h-full z-10 flex flex-col items-center justify-center pointer-events-none"
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImg(null);
                  }}
                  className="absolute top-0 right-0 sm:-top-12 sm:-right-4 p-4 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all pointer-events-auto shadow-2xl border border-zinc-800"
                >
                  <X size={28} />
                </button>
                
                <img 
                  src={selectedImg} 
                  alt="Expanded view" 
                  className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-zinc-800/50 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <p className="mt-8 text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em] bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 shadow-xl pointer-events-auto">
                  Modo de Alta Precisão
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
