# Axoniq — Product Roadmap

> Ferramenta de estudo completa para estudantes de medicina, inspirada em **Anki + NotebookLM**.
> Documento gerado em 22/02/2026 a partir de sessão de brainstorm.
> Última atualização: 22/02/2026

---

## Visão do Produto

O Axoniq é uma plataforma que transforma qualquer conteúdo de estudo em material ativo de aprendizado. O diferencial é a **praticidade**: o aluno sobe seu material e a IA gera flashcards, quizzes e mapas mentais automaticamente — tudo em uma interface nichada para medicina.

### Público-alvo
- Estudantes de medicina (graduação)
- Residentes (preparação para provas de residência)
- Expansível para qualquer estudante, mas comunicação 100% voltada para medicina

### Inspirações
- **Anki**: Repetição espaçada, liberdade de criação
- **NotebookLM**: Ingestão de fontes → geração de múltiplos outputs em paralelo

---

## Arquitetura Conceitual (Mudança Importante)

A arquitetura atual é: **Upload PDF → Gera Flashcards automaticamente**

A nova arquitetura será:

```
Upload de Fonte (PDF, texto, URL, YouTube)
        ↓
  Conteúdo Extraído (salvo como "Fonte")
  + IA detecta TAG de especialidade automaticamente
  (Cardiologia, Neurologia, Farmacologia... ou "Outros" se não for medicina)
        ↓
  Usuário ESCOLHE o que gerar:
  ┌─────────────┬─────────────┬──────────────┐
  │ Flashcards  │   Quizzes   │ Mapa Mental  │
  │   (Deck)    │  (Quiz Set) │   (Mapa)     │
  └─────────────┴─────────────┴──────────────┘
        ↓ (Rodam em paralelo, notificam quando prontos)
  Dashboard com ABAS:
  • Decks/Cards
  • Quizzes
  • Mapas Mentais
  (Tudo organizado por Pastas + Filtro por Tags)
```

> **Decisão-chave:** O conteúdo é extraído UMA vez. Depois o usuário escolhe 1, 2 ou 3 tipos de output. Cada um processa independentemente e notifica quando pronto.

---

## Features Transversais (Aplicam-se a todas as fases)

### 🏷️ Tags Automáticas por Especialidade
A IA analisa o conteúdo da fonte e detecta automaticamente a área médica:
- **Especialidades médicas**: Cardiologia, Neurologia, Farmacologia, Anatomia, Fisiologia, Patologia, Clínica Médica, Cirurgia, Pediatria, Ginecologia, Psiquiatria, Ortopedia, Dermatologia, Oftalmologia, Otorrino, Urologia, Infectologia, Endocrinologia, Hematologia, Nefrologia, Pneumologia, Gastroenterologia, Reumatologia, etc.
- **Não-médico**: Se o conteúdo for sobre Engenharia, Direito, ou qualquer outra área → Tag = `"Outros"`
- Tags são herdadas por todos os outputs (decks, quizzes, mapas) gerados a partir da fonte
- Dashboard permite **filtrar por tag/especialidade**

### 📝 Cloze/Lacuna (Cards e Quizzes)
Formato de preenchimento de lacuna, muito popular em medicina:
- **Flashcard Cloze**: _"A _____ é o neurotransmissor principal do sistema _____"_
- **Quiz Cloze**: Questão com lacuna + 5 alternativas para preencher
- A IA pode gerar automaticamente ambos os formatos
- Aplicável tanto na geração automática (Fase 1) quanto na criação manual (Fase 2)

### ⚡ Modo Revisão Rápida
Sessão cronometrada para intervalos curtos (5min, 10min, 15min):
- O sistema seleciona cards/quizzes prioritários dentro do tempo
- Ao finalizar, gera um **resumo da sessão por IA**:
  - Quantos cards/questões foram feitos
  - Taxa de acerto
  - Áreas de força e fraqueza identificadas
  - Sugestão do que focar na próxima sessão

---

## Fases de Desenvolvimento

### 🔴 Fase 1: Quiz System + Refatoração do Pipeline
**Prioridade:** Máxima | **Esforço:** Alto

O sistema de quizzes gera questões de **múltipla escolha no estilo prova de residência** a partir de qualquer fonte processada. Também inclui a refatoração fundamental do pipeline de processamento.

#### O que inclui:

**Pipeline Refatorado:**
- [x] **Separar extração de conteúdo da geração**:
  - Upload → Extração do texto bruto → Salvar como "Fonte" no banco
  - IA analisa o conteúdo e atribui **tag de especialidade** automaticamente
  - Redirecionar para tela de seleção: "O que deseja gerar?"
- [x] **Tela de seleção de output**:
  - Checkboxes: [x] Flashcards  [x] Quiz  [ ] Mapa Mental (futuro)
  - Cada geração selecionada roda como job independente em paralelo
  - Status em tempo real: "Gerando flashcards...", "Quiz pronto! ✅"
- [x] **Schema de Fontes no banco**:
  - Tabela `sources` (id, user_id, title, raw_content, file_url, specialty_tag, status, created_at)
  - Relacionar decks e quizzes com source_id

**Quiz System:**
- [x] **Schema de Quiz no banco**:
  - Tabela `quizzes` (id, source_id, folder_id, title, user_id, specialty_tag, status, created_at)
  - Tabela `quiz_questions` (id, quiz_id, question, type[multiple_choice|cloze], options[], correct_answer, explanation, difficulty)
  - Tabela `quiz_attempts` (id, quiz_id, user_id, score, answers[], started_at, completed_at)
- [x] **Geração de Quiz via IA**:
  - Prompt otimizado para questões de múltipla escolha com 5 alternativas
  - Inclui questões no formato Cloze/Lacuna
  - Justificativa da resposta correta + comentário das incorretas
  - Classificação por dificuldade (fácil, médio, difícil)
- [x] **UI de Estudo por Quiz**:
  - Tela de quiz: uma questão por vez, 5 alternativas
  - Feedback imediato: verde/vermelho + explicação expandível
  - Tela de resultado: score, tempo, questões erradas para revisar

**Dashboard Refatorado:**
- [x] **Abas no Dashboard**:
  - Aba "Decks" (flashcards — como está hoje)
  - Aba "Quizzes" (lista de quiz sets, com status e scores)
  - Aba "Mapas Mentais" (placeholder para Fase 4)
  - Cada aba respeita organização por pastas
  - Filtro por tag/especialidade
- [x] **Sistema de Notificação de Processamento**:
  - Status em tempo real por tipo de geração
  - Indicador visual no dashboard (badge, toast, ou painel lateral)

**Cloze nos Flashcards:**
- [x] Atualizar prompt de geração de flashcards para incluir cards Cloze
- [x] UI de estudo de Cloze: mostrar texto com lacunas, revelar ao clicar/tocar

#### Questões em aberto:
- Formato das questões: só múltipla escolha + cloze, ou também V/F?
- Limite de questões por quiz? (ex: 10, 20, 30)
- Repetir quiz gera questões novas ou as mesmas?

---

### 🟡 Fase 2: Criação Manual + Editor Rico
**Prioridade:** Alta | **Esforço:** Médio

Autonomia total para o aluno criar e personalizar seu material.

#### O que inclui:
- [x] **Criar deck manualmente** (sem upload de fonte)
- [x] **Adicionar cards em qualquer deck** (inclusive gerados por IA)
- [x] **Editar cards com editor rico**:
  - Markdown (negrito, itálico, listas, tabelas)
  - Upload de imagens (drag & drop ou botão)
  - Preview em tempo real
- [x] **Criar quiz manualmente** (adicionar questões uma a uma)
- [x] **Reordenar cards** dentro de um deck (drag & drop)
- [x] **Templates de cards**:
  - Pergunta/Resposta (padrão)
  - Cloze/Lacuna ("O antibiótico de escolha para _____ é _____")
  - Imagem + Legenda (ideal para anatomia, histologia)
- [x] **Supabase Storage** para upload de imagens

#### Questões em aberto:
- Tamanho máximo de imagem?
- Compressão automática?
- Imagens como base64 inline ou CDN?

---

### 🟢 Fase 3: Analytics Inteligente (Concluída)
**Status:** Finalizado | **Esforço:** Médio

Transformar dados de estudo em insights acionáveis.

#### O que inclui:
- [x] **Página de Relatórios**: Seção dedicada para visualização e histórico de análises.
- [x] **Botão "Análise de Desempenho"**: Gatilho manual para processar os dados e gerar um novo relatório via IA.
- [x] **Diagnóstico Completo via IA**:
  - Análise de pontos fortes e fracos baseada em erros e acertos.
  - Ranking de especialidades médicas com melhor/pior aproveitamento.
  - **Resumo de Tópicos para Revisão**: IA gera um resumo explicativo sobre os conceitos que o aluno mais errou.
- [x] **Histórico de Relatórios**: Cada análise gerada fica salva para consulta futura.
- [x] **Visualização de Dados (Relatórios Detalhados)**:
  - Gráficos de barra integrando especialidades.
  - Análise de padrões de erro e conselhos estratégicos.
- [x] **Trava de Segurança (7 dias)**: Limite para evitar geração excessiva de relatórios.

#### Questões resolvidas:
- **Geração**: Manual (via botão).
- **Exportação**: Apenas visualização web (sem PDF).
- **Conteúdo extra**: Resumo explicativo dos erros (sem criação automática de cards por enquanto).

---

### 🔵 Fase 4: Multi-Source Input
**Prioridade:** Futura | **Esforço:** Alto

Expandir as fontes de conteúdo para além de PDF.

#### O que inclui:
- [ ] **URL de website**: Colar link de artigo → scraping → extração de texto
- [ ] **YouTube**: Colar link de vídeo → transcrição automática → extração
- [ ] **Texto livre**: Campo de texto para colar anotações de aula
- [ ] **Google Docs / Notion**: Integração via API (futuro)
- [ ] **Mapas Mentais Visuais**:
  - Renderização interativa (nós, conexões, zoom, pan)
  - Geração automática a partir do conteúdo extraído
  - Cada nó pode linkar para flashcards/quizzes relacionados

#### Dependências técnicas:
- API de transcrição de YouTube (Whisper, YouTube Data API)
- Web scraping (Cheerio, Puppeteer, ou API de extração)
- Supabase Storage para cache de transcrições
- Biblioteca de grafos/mapas mentais (ReactFlow, D3.js, etc.)

#### Questões em aberto:
- Rate limiting de scraping?
- Custos de transcrição de vídeos longos?
- Suporte offline?

---

## Stack Técnica Atual

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js, React, TailwindCSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4 |
| Storage | Supabase Storage (a implementar) |
| Deploy | Vercel (futuro) |

---

## Princípios de Desenvolvimento

1. **Praticidade acima de tudo** — O aluno quer estudar, não configurar
2. **IA com qualidade** — Em medicina, erros são inaceitáveis. Validar prompts
3. **Mobile-first thinking** — Estudantes estudam no celular
4. **Feedback imediato** — O aluno precisa saber o que está acontecendo
5. **Nichado > Genérico** — Comunicação, exemplos e UX voltados para medicina
