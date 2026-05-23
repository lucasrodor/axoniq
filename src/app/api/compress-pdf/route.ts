import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60 // Increase timeout for Vercel

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'O arquivo deve ser um PDF.' }, { status: 400 })
    }

    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY

    if (!publicKey) {
      return NextResponse.json({ error: 'Chave pública da API iLovePDF não configurada.' }, { status: 500 })
    }

    // 1. Authenticate with iLovePDF REST API
    const authRes = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: publicKey })
    })

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}))
      throw new Error(`Erro de autenticação iLovePDF: ${err.message || authRes.statusText}`)
    }

    const { token } = await authRes.json()

    // 2. Start a compression task
    const startRes = await fetch('https://api.ilovepdf.com/v1/start/compress', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({}))
      throw new Error(`Erro ao iniciar tarefa no iLovePDF: ${err.message || startRes.statusText}`)
    }

    const { server, task } = await startRes.json()

    // 3. Upload the file directly using FormData
    const uploadData = new FormData()
    uploadData.append('task', task)
    uploadData.append('file', file)

    const uploadRes = await fetch(`https://${server}/v1/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: uploadData
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}))
      throw new Error(`Erro no upload para o iLovePDF: ${err.message || uploadRes.statusText}`)
    }

    const { server_filename } = await uploadRes.json()

    // 4. Process the compression
    const processRes = await fetch(`https://${server}/v1/process`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task: task,
        tool: 'compress',
        compression_level: 'recommended',
        files: [{ server_filename, filename: file.name }]
      })
    })

    if (!processRes.ok) {
      const err = await processRes.json().catch(() => ({}))
      throw new Error(`Erro ao processar compressão: ${err.message || processRes.statusText}`)
    }

    // 5. Download the optimized output
    const downloadRes = await fetch(`https://${server}/v1/download/${task}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!downloadRes.ok) {
      throw new Error('Erro ao baixar o PDF comprimido.')
    }

    const compressedBuffer = await downloadRes.arrayBuffer()

    // Return the compressed PDF buffer directly
    return new NextResponse(compressedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '')}-comprimido.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Compression error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao comprimir PDF' }, { status: 500 })
  }
}
