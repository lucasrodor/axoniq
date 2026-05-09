import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImg && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImg(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full z-10 flex flex-col items-center"
            >
              <button 
                onClick={() => setSelectedImg(null)}
                className="absolute -top-12 right-0 p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <img 
                src={selectedImg} 
                alt="Expanded view" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
              />
              
              <p className="mt-6 text-zinc-500 text-[10px] uppercase font-black tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                Visualização de Detalhes
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
