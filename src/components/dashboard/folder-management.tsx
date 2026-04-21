'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Check, 
  X 
} from 'lucide-react'

interface FolderType {
  id: string
  name: string
  created_at: string
}

export function DroppableFolder({ id, children, isCollapsed }: { id: string, children: React.ReactNode, isCollapsed?: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl transition-all duration-300",
        isCollapsed ? "p-0" : "p-4 sm:p-8",
        isOver
          ? "bg-blue-500/5 ring-1 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
          : "ring-1 ring-transparent"
      )}
    >
      {children}
    </div>
  )
}

export function FolderHeader({
  folder,
  itemCount,
  isCollapsed,
  isEditing,
  editName,
  onToggleCollapse,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  folder: FolderType
  itemCount: number
  isCollapsed: boolean
  isEditing: boolean
  editName: string
  onToggleCollapse: () => void
  onStartEdit: () => void
  onEditNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 group mb-4 relative z-10">
      <button 
        onClick={onToggleCollapse} 
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-0 flex-shrink flex-1",
          "hover:bg-zinc-800/50 text-zinc-100"
        )}
      >
        <div className={cn(
          "transition-transform duration-300 flex-shrink-0",
          isCollapsed ? "rotate-0" : "rotate-90"
        )}>
          <ChevronRight size={16} className="text-zinc-500" />
        </div>
        
        <div className="relative flex-shrink-0">
          <Folder size={18} className={cn(
            "transition-all duration-300",
            isCollapsed ? "text-amber-500/80" : "text-amber-500 fill-amber-500/20"
          )} />
          {!isCollapsed && (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#09090B] animate-pulse" />
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === 'Enter') onSaveEdit()
                 if (e.key === 'Escape') onCancelEdit()
              }}
              className="w-full px-2 py-0.5 text-sm rounded border border-blue-500/50 bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <button onClick={onSaveEdit} className="text-emerald-500 hover:text-emerald-400 transition-colors flex-shrink-0">
              <Check size={16} />
            </button>
            <button onClick={onCancelEdit} className="text-zinc-500 hover:text-zinc-400 transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <span 
            className="text-sm font-bold uppercase tracking-widest text-zinc-200 group-hover:text-white transition-colors text-left flex-1"
            title={folder.name}
          >
            {folder.name}
          </span>
        )}
      </button>

      <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full uppercase tracking-widest flex-shrink-0">
        {itemCount} {itemCount === 1 ? 'item' : 'itens'}
      </span>

      {!isEditing && (
        <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1 ml-auto">
          <button 
            onClick={onStartEdit} 
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-all"
            title="Renomear Pasta"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
            title="Excluir Pasta"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      
      {/* Visual separator line that grows on hover - hidden on mobile to give space to long names */}
      <div className="hidden sm:block flex-1 h-px bg-zinc-800/50 ml-4 group-hover:bg-zinc-700 transition-colors" />
    </div>
  )
}
