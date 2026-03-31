import { extractText } from 'unpdf'
import mammoth from 'mammoth'

export async function extractTextFromBuffer(fileBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf': {
        const uint8Array = new Uint8Array(fileBuffer)
        const result = await extractText(uint8Array)
        // unpdf may return text as string or array — normalize to string
        const text = Array.isArray(result.text)
          ? result.text.join('\n')
          : String(result.text ?? '')
        return text
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        return result.value
      }

      case 'text/plain':
        return fileBuffer.toString('utf-8')

      default:
        throw new Error('Tipo de arquivo não suportado')
    }
  } catch (error) {
    console.error('Error extracting text:', error)
    throw new Error('Falha ao extrair texto do documento')
  }
}
