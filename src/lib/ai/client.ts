import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuração de Modelos por Função
export const MODEL_CLEAN = 'gpt-5-nano'       // Limpeza / pré-processamento simples
export const MODEL_FAST = 'gpt-4o-mini'       // Flashcards, OCR, Mapas mentais
export const MODEL_STRUCT = 'gpt-4.1-mini'    // Relatórios, Resumo áudio
export const MODEL_SMART = 'gpt-5-mini'       // Quiz
export const MODEL_AUDIO = 'whisper-1'        // Transcrição
