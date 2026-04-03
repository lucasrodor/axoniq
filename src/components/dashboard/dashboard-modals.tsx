'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Pencil, 
  Trash2, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Zap, 
  Plus, 
  FolderPlus 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ModalProps {
  onClose: () => void
}

export function RenameItemModal({ 
  id, 
  name, 
  type, 
  onClose, 
  onRename 
}: ModalProps & { id: string, name: string, type: 'deck' | 'quiz' | 'mindmap', onRename: (id: string, name: string) => void }) {
  const [newValue, setNewValue] = React.useState(name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl overflow-hidden relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-4">
           <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Pencil size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Renomear</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
              {type === 'deck' ? 'Coleção de Cards' : type === 'quiz' ? 'Simulação Clínica' : 'Mapa Sintático'}
            </p>
          </div>
        </div>
        
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onRename(id, newValue)}
          className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all mb-6"
          autoFocus
        />
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 py-7 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 py-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black uppercase text-[10px] tracking-widest border-none" onClick={() => onRename(id, newValue)}>Salvar</Button>
        </div>
      </motion.div>
    </div>
  )
}

export function CreateChoiceModal({ 
  activeTab, 
  onClose, 
  onChoice 
}: ModalProps & { activeTab: 'decks' | 'quizzes', onChoice: (choice: 'ai' | 'manual') => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 w-full max-w-lg mx-4 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-zinc-50 tracking-tight mb-2">
              Nova Estrutura de Conhecimento
            </h3>
            <p className="text-sm text-zinc-500">Selecione o método de processamento para seu {activeTab === 'decks' ? 'Deck' : 'Quiz'}.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-300 transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="grid gap-4">
          <button 
            onClick={() => onChoice('ai')}
            className="flex items-start gap-5 p-6 rounded-3xl border-2 border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
          >
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform duration-500">
              <Zap size={28} />
            </div>
            <div className="pt-1">
              <h4 className="font-bold text-zinc-100 text-lg mb-1 group-hover:text-blue-400 transition-colors">Criar com Inteligência Artificial</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Processamento automático de PDFs e textos. Gera conexões e cartas em segundos.</p>
            </div>
          </button>
          
          <button 
            onClick={() => onChoice('manual')}
            className="flex items-start gap-5 p-6 rounded-3xl border-2 border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
          >
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform duration-500">
              <Pencil size={28} />
            </div>
            <div className="pt-1">
              <h4 className="font-bold text-zinc-100 text-lg mb-1 group-hover:text-emerald-400 transition-colors">Criação Manual</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Criação artesanal de conteúdo. Desenvolva suas próprias cartas e questões específicas.</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function DeleteConfirmationModal({ 
  title, 
  type, 
  onClose, 
  onConfirm 
}: ModalProps & { title: string, type: string, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Excluir Item?</h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-xs">
            Esta ação é irreversível. Deseja remover <strong className="text-zinc-200">"{title}"</strong> permanentemente?
          </p>
          
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1 py-7 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Manter</Button>
            <Button variant="primary" className="flex-1 py-7 rounded-2xl !bg-red-600 hover:!bg-red-700 text-white shadow-lg shadow-red-500/20 font-black uppercase text-[10px] tracking-widest border-none" onClick={onConfirm}>Confirmar</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function LogoutModal({ onClose, onConfirm }: ModalProps & { onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <LogOut size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Finalizar Sessão</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          Tem certeza que deseja desconectar sua conta? Todo o progresso recente foi salvo localmente.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 py-7 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Voltar</Button>
          <Button variant="primary" className="flex-1 py-7 rounded-2xl !bg-red-600 hover:!bg-red-700 text-white shadow-lg shadow-red-500/20 font-black uppercase text-[10px] tracking-widest border-none" onClick={onConfirm}>Sair Agora</Button>
        </div>
      </motion.div>
    </div>
  )
}

export function ReportLimitModal({ onClose, onConfirm, loading }: ModalProps & { onConfirm: () => void, loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-sm mx-4 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-amber-500/10 rounded-3xl text-amber-500 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <Zap size={32} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100 mb-3 tracking-tight">Sobrecarga de Dados</h3>
          <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
            Você já gerou uma análise de desempenho nos últimos 7 dias. Recomendamos estudar mais antes de uma nova análise.
          </p>
          <div className="flex flex-col w-full gap-3">
            <Button variant="primary" className="w-full py-7 rounded-2xl text-lg shadow-lg shadow-amber-500/20" onClick={onConfirm} disabled={loading}>
              {loading ? 'Sintetizando...' : 'Prosseguir Análise'}
            </Button>
            <Button variant="outline" className="w-full py-7 rounded-2xl text-zinc-400" onClick={onClose}>
              Aumentar Domínio Primeiro
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function NewFolderModal({ 
  value, 
  onChange, 
  onConfirm, 
  onClose 
}: ModalProps & { value: string, onChange: (v: string) => void, onConfirm: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500 mb-8 max-w-lg mx-auto relative overflow-hiddenGroup/modal">
      <div className="absolute top-0 right-0 p-4">
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
          <FolderPlus size={18} />
        </div>
        Nova Pasta
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          placeholder="Nome da pasta (ex: Cardiologia, Psiquiatria)"
          className="flex-1 px-5 py-3.5 rounded-2xl border border-zinc-800 bg-zinc-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          autoFocus
        />
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1 sm:flex-none px-8 rounded-2xl shadow-lg shadow-blue-500/10" onClick={onConfirm}>Criar</Button>
          <Button variant="ghost" className="flex-1 sm:flex-none rounded-2xl text-zinc-500" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

export function NewDeckModal({ 
  title, 
  onChange, 
  onConfirm, 
  onClose, 
  disabled 
}: ModalProps & { title: string, onChange: (v: string) => void, onConfirm: () => void, disabled: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 w-full max-w-sm mx-4 shadow-2xl relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-blue-500/10 rounded-full text-blue-500 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <BookOpen size={32} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Novo Deck</h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-xs">
            Dê um nome para sua nova coleção de flashcards personalizados.
          </p>
          
          <input
            type="text"
            placeholder="Ex: Anatomia Cardíaca I"
            value={title}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !disabled && onConfirm()}
            className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all mb-8 text-center"
            autoFocus
          />
          
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1 py-7 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" className="flex-1 py-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black uppercase text-[10px] tracking-widest border-none" onClick={onConfirm} disabled={disabled}>Criar Deck</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function NewQuizModal({ 
  title, 
  onChange, 
  onConfirm, 
  onClose, 
  disabled 
}: ModalProps & { title: string, onChange: (v: string) => void, onConfirm: () => void, disabled: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 w-full max-w-sm mx-4 shadow-2xl relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Novo Quiz</h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-xs">
            Prepare um novo ambiente de teste prático personalizado.
          </p>
          
          <input
            type="text"
            placeholder="Ex: Simulado Fisiologia Renal"
            value={title}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !disabled && onConfirm()}
            className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all mb-8 text-center"
            autoFocus
          />
          
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1 py-7 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" className="flex-1 py-7 rounded-2xl !bg-emerald-600 hover:!bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-black uppercase text-[10px] tracking-widest border-none" onClick={onConfirm} disabled={disabled}>Preparar</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// React import needed for React.useState in RenameItemModal
import React from 'react'
