import React, { useState, useRef } from 'react'
import { 
  Bold, Italic, List, Image as ImageIcon, 
  Eye, Edit3, Loader2, X 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/storage/upload'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/ui/toast'
import MarkdownDisplay from '@/components/ui/markdown-display'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function RichEditor({ value, onChange, placeholder, label }: RichEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertText = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newValue = 
      value.substring(0, start) + 
      before + selectedText + after + 
      value.substring(end)
    
    onChange(newValue)
    
    // Focus back and set selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      )
    }, 0)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const url = await uploadImage(file, user.id)
      const imageMarkdown = `\n![${file.name}](${url})\n`
      onChange(value + imageMarkdown)
      toast('Imagem enviada com sucesso!', 'success')
    } catch (error) {
      toast('Erro ao enviar imagem.', 'error')
      console.error(error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col w-full border border-zinc-800/50 rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl transition-all focus-within:border-blue-500/50">
      {/* Label and Tabs */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/50 border-b border-zinc-800/50">
        {label && <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</span>}
        <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'edit' 
                ? 'bg-zinc-800 text-zinc-100 shadow-xl' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Edit3 size={12} /> Editar
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'preview' 
                ? 'bg-zinc-800 text-zinc-100 shadow-xl' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* Toolbar (Only in Edit mode) */}
      {activeTab === 'edit' && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
          <ToolbarButton icon={<Bold size={16} />} onClick={() => insertText('**', '**')} title="Negrito" />
          <ToolbarButton icon={<Italic size={16} />} onClick={() => insertText('_', '_')} title="Itálico" />
          <ToolbarButton icon={<List size={16} />} onClick={() => insertText('\n- ')} title="Lista" />
          <div className="w-px h-6 bg-zinc-800/50 mx-2" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <ToolbarButton 
            icon={isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />} 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            title="Adicionar Imagem"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative min-h-[180px]">
        {activeTab === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[180px] p-6 bg-transparent text-zinc-100 text-sm focus:outline-none resize-y placeholder-zinc-700"
          />
        ) : (
          <div className="p-6 prose prose-sm dark:prose-invert max-w-none prose-img:rounded-2xl">
            {value ? (
              <MarkdownDisplay content={value} />
            ) : (
              <p className="text-zinc-600 italic text-sm">Nada para visualizar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolbarButton({ icon, onClick, disabled, title }: { icon: any, onClick: () => void, disabled?: boolean, title?: string }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
    >
      {icon}
    </button>
  )
}
