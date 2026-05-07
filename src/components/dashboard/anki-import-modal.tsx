'use client'

import { useState, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import initSqlJs from 'sql.js'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { useSubscription } from '@/hooks/useSubscription'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileArchive, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface AnkiImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AnkiImportModal({ isOpen, onClose, onSuccess }: AnkiImportModalProps) {
  const { user } = useAuth()
  const { isPremium } = useSubscription()
  const [file, setFile] = useState<File | null>(null)
  const [importImages, setImportImages] = useState(false) // Default is TEXT ONLY
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading_media' | 'saving' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setImportImages(false)
      setStatus('idle')
      setProgress(0)
      setErrorMsg('')
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.name.endsWith('.apkg')) {
      setFile(selected)
    } else {
      setErrorMsg('Por favor, selecione um arquivo válido do Anki (.apkg)')
    }
  }

  const handleImport = async () => {
    if (!file || !user) return
    setStatus('parsing')
    setErrorMsg('')
    setProgress(10)

    try {
      // 1. Validate Size if Images selected
      if (importImages && file.size > 25 * 1024 * 1024) {
        throw new Error('Para importar com imagens, o tamanho máximo do arquivo é de 25MB. Limpe seu deck ou importe apenas texto.')
      }

      // 2. Unzip the .apkg
      const zip = new JSZip()
      const unzipped = await zip.loadAsync(file)
      setProgress(20)

      // 3. Read the SQLite DB (collection.anki2)
      const dbFile = unzipped.file('collection.anki2')
      if (!dbFile) throw new Error('Formato inválido: Banco de dados não encontrado no arquivo.')
      
      const dbData = await dbFile.async('uint8array')
      
      // Load WebAssembly SQLite from local public folder
      const SQL = await initSqlJs({
        locateFile: file => `/${file}`
      })
      
      const db = new SQL.Database(dbData)
      setProgress(40)

      // 4. Handle Media if requested
      const uploadedMediaUrls: Record<string, string> = {}
      if (importImages) {
        setStatus('uploading_media')
        const mediaFile = unzipped.file('media')
        if (mediaFile) {
          const mediaText = await mediaFile.async('string')
          let mediaMap: Record<string, string> = {}
          try {
            mediaMap = JSON.parse(mediaText)
          } catch (e) {
            console.error('Failed to parse media map')
          }
          
          const mediaKeys = Object.keys(mediaMap)
          for (let i = 0; i < mediaKeys.length; i++) {
            const internalName = mediaKeys[i] // e.g., "0", "1"
            const originalName = mediaMap[internalName] // e.g., "heart.jpg"
            const binFile = unzipped.file(internalName)
            if (binFile) {
              const fileData = await binFile.async('blob')
              const fileExt = originalName.split('.').pop() || 'jpg'
              const fileName = `${uuidv4()}.${fileExt}`
              const filePath = `${user.id}/anki/${fileName}`

              const { error: uploadError } = await supabase.storage
                .from('flashcard-images')
                .upload(filePath, fileData, { contentType: `image/${fileExt}` })

              if (!uploadError) {
                const { data } = supabase.storage.from('flashcard-images').getPublicUrl(filePath)
                uploadedMediaUrls[originalName] = data.publicUrl
              }
            }
            setProgress(40 + Math.round((i / mediaKeys.length) * 20)) // up to 60
          }
        }
      }
      setStatus('parsing')

      // 5. Extract Notes (Flashcards)
      // Anki uses \x1f as field separator. We assume standard models (Front/Back or Text for Cloze)
      const res = db.exec("SELECT id, flds, tags FROM notes")
      if (res.length === 0 || res[0].values.length === 0) {
        throw new Error('Nenhum flashcard encontrado neste deck.')
      }

      const rows = res[0].values
      const cardsToInsert = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const flds = row[1] as string
        const fields = flds.split('\x1f')
        
        let front = ''
        let back = ''
        let type = 'basic'

        // Basic heuristic: if it has {{c1::...}}, it's a cloze
        if (fields[0] && fields[0].includes('{{c')) {
          type = 'cloze'
          front = fields[0] // O texto inteiro do cloze
        } else {
          front = fields[0] || ''
          back = fields[1] || ''
        }

        // Se importImages for false, devemos remover as tags <img> do texto
        if (!importImages) {
          front = front.replace(/<img[^>]*>/gi, '[Imagem Removida]')
          back = back.replace(/<img[^>]*>/gi, '[Imagem Removida]')
        } else {
          // Se importImages for true, substituir <img> por sintaxe Markdown
          for (const [origName, pubUrl] of Object.entries(uploadedMediaUrls)) {
            // Escapa o nome original para o Regex
            const safeName = origName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const imgRegex = new RegExp(`<img[^>]*src=["']?${safeName}["']?[^>]*>`, 'gi')
            front = front.replace(imgRegex, `\n\n![imagem](${pubUrl})\n\n`)
            back = back.replace(imgRegex, `\n\n![imagem](${pubUrl})\n\n`)
          }
        }

        // Função para limpar sujeira de HTML do Anki
        const cleanHTML = (str: string) => {
          return str
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/<[^>]+>/g, '') // Remove o que sobrar de HTML
            .trim()
        }

        cardsToInsert.push({
          front: cleanHTML(front),
          back: cleanHTML(back),
          type: type,
        })
      }

      setProgress(70)

      // 6. Create Deck in AxonIQ
      setStatus('saving')
      const deckName = file.name.replace('.apkg', '')
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          title: deckName
        })
        .select('id')
        .single()

      if (deckError) throw deckError

      // 7. Insert Flashcards in Batch
      const batchInsert = cardsToInsert.map(c => ({
        ...c,
        deck_id: deck.id
      }))

      // Split in chunks of 500 to avoid Supabase limits
      const chunkSize = 500
      for (let i = 0; i < batchInsert.length; i += chunkSize) {
        const chunk = batchInsert.slice(i, i + chunkSize)
        const { error: insertError } = await supabase.from('flashcards').insert(chunk)
        if (insertError) throw insertError
        setProgress(70 + ((i / batchInsert.length) * 30))
      }

      setStatus('success')
      setProgress(100)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err: any) {
      console.error('Anki Import Error:', err)
      setStatus('error')
      setErrorMsg(err.message || 'Ocorreu um erro ao processar o arquivo. Ele pode estar corrompido.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={status !== 'parsing' && status !== 'saving' && status !== 'uploading_media' ? onClose : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden"
        >
          {status !== 'parsing' && status !== 'saving' && status !== 'uploading_media' && status !== 'success' && (
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}

          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileArchive className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Importar do Anki</h2>
            <p className="text-zinc-400 text-sm">Selecione o arquivo .apkg exportado do seu Anki.</p>
          </div>

          {status === 'success' ? (
            <div className="py-12 flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Importação Concluída!</h3>
              <p className="text-zinc-400 text-sm">Seu deck foi convertido e salvo no AxonIQ com sucesso.</p>
            </div>
          ) : status === 'parsing' || status === 'saving' || status === 'uploading_media' ? (
            <div className="py-12 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">
                {status === 'parsing' ? 'Processando Arquivo SQLite...' : 
                 status === 'uploading_media' ? 'Salvando Mídias na Nuvem...' : 
                 'Salvando no AxonIQ...'}
              </h3>
              <p className="text-zinc-400 text-sm mb-8">Isso pode levar alguns segundos dependendo do tamanho do deck.</p>
              
              <div className="w-full max-w-xs h-2 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} 
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  file ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                }`}
              >
                <input 
                  type="file" 
                  accept=".apkg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-blue-500' : 'text-zinc-500'}`} />
                {file ? (
                  <div>
                    <p className="text-zinc-200 font-bold">{file.name}</p>
                    <p className="text-zinc-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-zinc-300 font-medium mb-1">Clique para selecionar</p>
                    <p className="text-zinc-500 text-xs">Formato suportado: .apkg</p>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="import_type" 
                    checked={!importImages} 
                    onChange={() => setImportImages(false)}
                    className="mt-1 w-4 h-4 text-blue-500 bg-zinc-950 border-zinc-700 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-zinc-200">Importar Apenas Texto (Recomendado)</span>
                    <span className="block text-xs text-zinc-500 mt-1">
                      Ignora todas as imagens. A extração é instantânea e não consome seu plano de armazenamento no AxonIQ.
                    </span>
                  </div>
                </label>

                <div className="h-px bg-zinc-800 my-4" />

                <label className={`flex items-start gap-3 cursor-pointer ${!isPremium ? 'opacity-50' : ''} relative`}>
                  <input 
                    type="radio" 
                    name="import_type" 
                    disabled={!isPremium}
                    checked={importImages} 
                    onChange={() => isPremium && setImportImages(true)}
                    className={`mt-1 w-4 h-4 text-blue-500 bg-zinc-950 border-zinc-700 focus:ring-blue-500 ${!isPremium ? 'cursor-not-allowed' : ''}`}
                  />
                  <div>
                    <span className="block text-sm font-bold text-zinc-200">
                      Importar com Imagens (Max. 25MB) {!isPremium && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Apenas Pro</span>}
                    </span>
                    <span className="block text-xs text-zinc-500 mt-1">
                      Envia os arquivos de mídia das cartas direto para a nuvem. Sujeito à verificação de tamanho de arquivo.
                    </span>
                  </div>
                </label>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all"
              >
                Iniciar Importação
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
