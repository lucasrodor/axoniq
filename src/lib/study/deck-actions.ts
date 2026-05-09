import { supabase } from '@/lib/supabase/client'

/**
 * Deleta um deck e todos os seus ativos associados (como imagens no storage).
 */
export async function deleteDeckWithAssets(deckId: string) {
  try {
    // 1. Buscar todos os flashcards do deck para encontrar caminhos de imagens
    const { data: cards } = await supabase
      .from('flashcards')
      .select('front, back')
      .eq('deck_id', deckId)

    if (cards && cards.length > 0) {
      const pathsToDelete: string[] = []
      
      // Regex robusto para identificar URLs do nosso bucket de flashcard-images
      // Busca qualquer URL que aponte para o bucket flashcard-images, ignorando o prefixo markdown
      const imgRegex = /https:\/\/.*?\.supabase\.co\/storage\/v1\/object\/public\/flashcard-images\/([^)\s"'>]+)/g
      
      cards.forEach(card => {
        const content = `${card.front} ${card.back}`
        let match
        while ((match = imgRegex.exec(content)) !== null) {
          if (match[1]) {
            // Decodifica a URL e remove parâmetros de query
            const rawPath = match[1].split('?')[0]
            pathsToDelete.push(decodeURIComponent(rawPath))
          }
        }
      })

      // 2. Filtrar quais caminhos realmente podem ser deletados
      // (Não podemos deletar se outra carta de OUTRO deck ainda usar a mesma imagem devido à deduplicação)
      if (pathsToDelete.length > 0) {
        const uniquePaths = Array.from(new Set(pathsToDelete))
        const verifiedPathsToDelete: string[] = []

        for (const path of uniquePaths) {
          // Verifica se existe alguma carta que NÃO pertence a este deck e usa esta imagem
          const { count } = await supabase
            .from('flashcards')
            .select('*', { count: 'exact', head: true })
            .neq('deck_id', deckId)
            .or(`front.ilike.%${path}%,back.ilike.%${path}%`)

          if (count === 0) {
            verifiedPathsToDelete.push(path)
          }
        }

        // 3. Remover do Storage apenas os arquivos órfãos
        if (verifiedPathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('flashcard-images')
            .remove(verifiedPathsToDelete)
            
          if (storageError) {
            console.error('Erro ao limpar ativos do storage:', storageError)
          }
        }
      }
    }

    // 4. Deletar o deck
    return await supabase.from('decks').delete().eq('id', deckId)
    
  } catch (err) {
    console.error('Erro crítico na deleção do deck:', err)
    return { error: err }
  }
}
