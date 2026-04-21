'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void
  isProcessing?: boolean
}

export function UploadZone({ onFilesSelect, isProcessing }: UploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null)
    
    if (fileRejections.length > 0) {
      setError('Alguns arquivos não são suportados ou são muito grandes.')
      return
    }

    if (acceptedFiles.length > 0) {
      if (selectedFiles.length + acceptedFiles.length > 5) {
        setError('O limite máximo é de 5 arquivos por vez. Por favor, remova alguns para adicionar novos.')
        return
      }
      // Allow merging new files into the current selection
      setSelectedFiles(prev => [...prev, ...acceptedFiles])
    }
  }, [selectedFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    disabled: isProcessing
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* File List / Queue */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
          {selectedFiles.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--background)] flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className={`p-2.5 rounded-lg ${file.type.startsWith('image/') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-600/10 text-blue-400'}`}>
                  {file.type.startsWith('image/') ? (
                    <span className="material-symbols-outlined text-[20px]">image</span>
                  ) : (
                    <FileText size={20} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-[var(--foreground)] truncate text-sm">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {!isProcessing && (
                <button 
                  onClick={() => removeFile(idx)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/5 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}

          <Button 
            className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-shadow mt-4" 
            onClick={handleProcess}
            isLoading={isProcessing}
            disabled={selectedFiles.length === 0}
          >
            {isProcessing ? 'Processando Fonte...' : `Processar ${selectedFiles.length === 1 ? 'Material' : selectedFiles.length + ' Arquivos'}`}
          </Button>

          <div className="flex items-center justify-center py-2">
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <span className="px-4 text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">OU ADICIONAR MAIS</span>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
          </div>
        </div>
      )}

      {/* Dropzone - Always available for more files if below limit */}
      <div 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed rounded-xl p-10 lg:p-16 text-center cursor-pointer transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center space-y-3
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
            : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-zinc-950/40 dark:hover:bg-zinc-950/40'}
          ${error ? 'border-red-500 bg-red-500/5' : ''}
          ${selectedFiles.length >= 5 ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className={`p-3 rounded-full bg-zinc-900 border border-zinc-800/50 text-blue-400 mb-1 transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
          <UploadCloud size={28} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-1">
          <p className="text-base font-medium text-[var(--foreground)]">
            {isDragActive ? 'Solte os arquivos aqui...' : 'Clique ou arraste documentos/imagens'}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            PDF, DOCX, TXT ou Imagens (Max 5 arquivos)
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium animate-shake">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
