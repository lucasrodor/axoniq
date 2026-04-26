import { createAdminClient } from '@/lib/supabase/server'

/**
 * Deleta todos os materiais brutos pesados (arquivos no storage)
 * e limpa o conteúdo sensível, mas mantém o registro da source
 * para evitar erros de integridade (Race Condition) em gerações múltiplas.
 */
export async function cleanupSource(sourceId: string) {
  const supabase = createAdminClient()

  try {
    // 1. Buscar metadados para pegar os caminhos dos arquivos no Storage
    const { data: source, error: fetchError } = await supabase
      .from('sources')
      .select('image_urls, metadata')
      .eq('id', sourceId)
      .single()

    if (fetchError || !source) {
      console.warn(`[Cleanup] Fonte ${sourceId} não encontrada para limpeza.`)
      return
    }

    // 2. Extrair caminhos dos arquivos do Storage (se houver imagens)
    const imagesToDelete: string[] = []
    
    if (source.image_urls && Array.isArray(source.image_urls)) {
      source.image_urls.forEach((url: string) => {
        const parts = url.split('/sources/')
        if (parts.length > 1) {
          imagesToDelete.push(parts[1])
        }
      })
    }

    // 3. Deletar do Storage (O que realmente ocupa espaço)
    if (imagesToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('sources')
        .remove(imagesToDelete)
      
      if (storageError) {
        console.error(`[Cleanup] Erro ao deletar arquivos do storage:`, storageError)
      } else {
        console.log(`[Cleanup] ${imagesToDelete.length} arquivos deletados do storage.`)
      }
    }

    // 4. Limpar conteúdo sensível mas MANTER o registro
    // Isso evita o erro "insert or update on table violates foreign key constraint"
    // quando múltiplas gerações ocorrem em paralelo.
    const { error: updateError } = await supabase
      .from('sources')
      .update({ 
        raw_content: '[Conteúdo limpo após geração]', 
        image_urls: [], 
        updated_at: new Date().toISOString() 
      })
      .eq('id', sourceId)

    if (updateError) {
      console.error(`[Cleanup] Erro ao limpar conteúdo da source ${sourceId}:`, updateError)
    } else {
      console.log(`[Cleanup] Conteúdo da source ${sourceId} limpo com sucesso. Registro mantido para integridade.`)
    }

  } catch (error) {
    console.error(`[Cleanup] Erro crítico durante limpeza da source ${sourceId}:`, error)
  }
}
