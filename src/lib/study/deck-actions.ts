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

      // 2. Remover do Storage se houver arquivos encontrados
      if (pathsToDelete.length > 0) {
        // Remove duplicatas
        const uniquePaths = Array.from(new Set(pathsToDelete))
        
        const { error: storageError } = await supabase.storage
          .from('flashcard-images')
          .remove(uniquePaths)
          
        if (storageError) {
          console.error('Erro ao limpar ativos do storage:', storageError)
          // Seguimos em frente para deletar o deck mesmo se o storage falhar
        }
      }
    }

    // 3. Deletar o deck (o banco de dados está configurado com ON DELETE CASCADE, 
    // então os flashcards serão removidos automaticamente)
    return await supabase.from('decks').delete().eq('id', deckId)
    
  } catch (err) {
    console.error('Erro crítico na deleção do deck:', err)
    return { error: err }
  }
}
