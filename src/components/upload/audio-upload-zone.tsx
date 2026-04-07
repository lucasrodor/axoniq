'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, Music, X, Mic, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioUploadZoneProps {
  onFileSelect: (file: File) => void
  isProcessing?: boolean
  processingStep?: string
}

export function AudioUploadZone({ onFileSelect, isProcessing, processingStep }: AudioUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null)
    
    if (fileRejections.length > 0) {
      setError('Formato de áudio não suportado ou arquivo muito grande.')
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
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
      'audio/ogg': ['.ogg'],
      'audio/webm': ['.webm']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB as requested (lectures can be large)
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
        <div className="border border-zinc-800/80 rounded-xl p-6 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-lg text-blue-400">
              <Mic size={24} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-zinc-100 truncate max-w-[200px] md:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Áudio para transcrição
              </p>
            </div>
          </div>
          
          {!isProcessing && (
            <button 
              onClick={removeFile}
              className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {isProcessing && (
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 flex flex-col items-center gap-3">
             <div className="flex items-center gap-3 text-blue-400">
                <div className="flex gap-1 h-6 items-center">
                   {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className="w-1 h-full bg-blue-500 rounded-full animate-wave" 
                        style={{ animationDelay: `${i * 0.15}s` }} 
                      />
                   ))}
                </div>
                <span className="text-sm font-bold uppercase tracking-wider animate-pulse">
                  {processingStep || 'Transcrevendo áudio...'}
                </span>
             </div>
             <p className="text-[10px] text-zinc-500">Isso pode levar alguns minutos para aulas longas.</p>
          </div>
        )}

        {!isProcessing && (
          <Button 
            className="w-full h-14 text-base shadow-lg hover:shadow-xl transition-all font-bold tracking-tight bg-blue-600 hover:bg-blue-500 text-white" 
            onClick={handleProcess}
          >
            Começar Transcrição
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed rounded-xl p-12 lg:p-16 text-center cursor-pointer transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center space-y-4
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className={`p-4 rounded-full bg-zinc-950 border border-zinc-800 text-blue-400 mb-2 transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
          <Headphones size={32} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-bold text-zinc-100">
            {isDragActive ? 'Solte o áudio aqui...' : 'Mande sua aula gravada'}
          </p>
          <p className="text-sm text-zinc-500">
            Arraste arquivos MP3, M4A ou WAV (Até 100MB)
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full animate-shake mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
