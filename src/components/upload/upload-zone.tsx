'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isProcessing?: boolean
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null)
    
    if (fileRejections.length > 0) {
      setError('Apenas arquivos PDF, DOCX ou TXT são permitidos (Max 10MB).')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing || !!selectedFile
  })

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  const handleProcess = () => {
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  if (selectedFile) {
    return (
      <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="border border-[var(--border)] rounded-xl p-6 bg-[var(--background)] flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-lg text-blue-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)] truncate max-w-[200px] md:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          {!isProcessing && (
            <button 
              onClick={removeFile}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <Button 
          className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-shadow" 
          onClick={handleProcess}
          isLoading={isProcessing}
        >
          {isProcessing ? 'Extraindo Conteúdo...' : 'Processar Documento'}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed rounded-xl p-12 lg:p-20 text-center cursor-pointer transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center space-y-4
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
            : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-zinc-950/40 dark:hover:bg-zinc-950/40'}
          ${error ? 'border-red-500 bg-red-500/5' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className={`p-4 rounded-full bg-zinc-900 border border-zinc-800/50 text-blue-400 mb-2 transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
          <UploadCloud size={32} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-medium text-[var(--foreground)]">
            {isDragActive ? 'Solte o arquivo aqui...' : 'Clique para enviar ou arraste'}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            (PDF, DOCX ou TXT até 10MB)
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium absolute bottom-4 animate-shake">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
