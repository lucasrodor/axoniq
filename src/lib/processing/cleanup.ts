import { createAdminClient } from '@/lib/supabase/server'

/**
 * Deleta todos os materiais brutos (arquivos no storage e registro no banco)
 * associados a uma sourceId. Usado para manter a privacidade e economia de espaço.
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
    // As URLs públicas costumam ter o formato: .../storage/v1/object/public/sources/caminho/do/arquivo
    const imagesToDelete: string[] = []
    
    if (source.image_urls && Array.isArray(source.image_urls)) {
      source.image_urls.forEach((url: string) => {
        const parts = url.split('/sources/')
        if (parts.length > 1) {
          imagesToDelete.push(parts[1])
        }
      })
    }

    // 3. Deletar do Storage
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

    // 4. Deletar registro da tabela Sources
    // Nota: Como temos chaves estrangeiras, isso depende de estarem setadas como ON DELETE SET NULL 
    // ou ON DELETE CASCADE. Se o usuário quiser manter o título, poderíamos apenas limpar o raw_content.
    // Decisão: Deletar tudo para máxima privacidade conforme pedido.
    const { error: deleteError } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId)

    if (deleteError) {
      console.error(`[Cleanup] Erro ao deletar registro da source ${sourceId}:`, deleteError)
    } else {
      console.log(`[Cleanup] Registro da source ${sourceId} removido com sucesso.`)
    }

  } catch (error) {
    console.error(`[Cleanup] Erro crítico durante limpeza da source ${sourceId}:`, error)
  }
}
