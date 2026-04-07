# Plano de Lançamento — Axoniq

> **Versão**: 1.0  
> **Data**: 06/04/2026  
> **Objetivo**: Estratégia completa de lançamento em 3 fases, da validação com amigos até a cobrança recorrente.

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   FASE 1 (Alpha)        FASE 2 (Beta)         FASE 3 (Launch)      │
│   ─────────────         ────────────          ──────────────        │
│   5-10 amigos           Sala da faculdade     Público geral         │
│   Acesso total          Acesso total 14d      Free ou Pro (pago)    │
│   Sem Stripe            Sem Stripe            Stripe ativo          │
│                                                                     │
│   ← Mesma conta para todo mundo, do começo ao fim →                 │
│                                                                     │
│          ↕ LIMPEZA ↕                                                │
│   Entre Fase 1 e 2: apagar conteúdo de teste,                      │
│   manter contas, resetar trials.                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Banco de Dados: Estrutura Necessária

### Colunas na tabela `profiles`

Adicionar 3 campos que controlam todo o ciclo de vida do plano:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

| Campo | Tipo | Default | Função |
|---|---|---|---|
| `plan` | text | `'free'` | Estado do plano (free ou pro) |
| `trial_ends_at` | timestamptz | `NULL` | Data em que o acesso total gratuito expira |
| `stripe_customer_id` | text | `NULL` | ID do cliente no Stripe (preenchido só quando pagar) |

### Lógica de acesso (como o sistema decide o que liberar)

```
ACESSO TOTAL se:
  → plan = 'pro'
  → OU trial_ends_at NÃO é NULL E trial_ends_at > NOW()

ACESSO LIMITADO (Free) se:
  → plan = 'free' E (trial_ends_at É NULL OU trial_ends_at < NOW())
```

Isso significa que um único campo (`trial_ends_at`) controla automaticamente a transição de "tudo liberado" para "funcionalidades limitadas" sem nenhuma intervenção manual.

---

## Fase 1 — Alpha (Teste com Amigos)

### Objetivo
Validar que o produto funciona de ponta a ponta: cadastro → upload → geração → estudo. Pegar bugs, feedback de UX, e confirmar que nada quebra antes de mostrar pra mais gente.

### Como funciona

**O cadastro é 100% normal.** Sem código de convite, sem alteração manual no banco, sem nada especial. Seus amigos entram no site, criam conta com email e senha, e começam a usar.

**O truque**: Durante a Fase 1, o código de criação de perfil seta automaticamente:

```
Novo usuário → profiles:
  plan = 'free'
  trial_ends_at = '2026-12-31T23:59:59Z'   ← data muito no futuro
  stripe_customer_id = NULL
```

Com `trial_ends_at` em dezembro, o sistema verifica a lógica de acesso e conclui: "trial ativo → acesso total". Ninguém percebe que existe uma restrição por trás. O resultado é que **todo mundo que se cadastrar durante a Fase 1 tem acesso total automático**.

### Quem convidar
- 5-10 pessoas próximas e confiáveis.
- Pelo menos 2-3 que realmente sejam estudantes de medicina (pra testar com conteúdo real).
- Pelo menos 1 pessoa não-técnica (pra testar se a UX é intuitiva sem explicação).

### O que pedir pra eles
Mande junto com o link de acesso:

> *"Oi! Estou testando o Axoniq antes do lançamento e preciso da sua ajuda. Quero que você use como se fosse pra uma prova:*
> 1. *Faz upload de um PDF ou áudio de uma aula.*
> 2. *Gera flashcards e tenta estudar.*
> 3. *Tenta o quiz também.*
> 4. *Me manda print/mensagem de qualquer coisa que parecer estranha, confusa, ou que quebrar.*
> *Não precisa ter medo de 'quebrar' — é exatamente isso que eu quero que aconteça agora, antes de lançar."*

### Duração
1-2 semanas. Tempo suficiente pra cada pessoa usar pelo menos 3-5 vezes.

### O que monitorar
- Erros no console (se tiver Sentry, melhor ainda).
- Feedback direto via WhatsApp/mensagem.
- Quantos flashcards/quizzes foram gerados (pra saber se estão realmente usando).

### Correções
Corrija os bugs encontrados nessa fase. Essa é a razão de ela existir. NÃO passe pra Fase 2 sem corrigir problemas críticos.

---

## Transição: Limpeza entre Fase 1 e Fase 2

### Por que limpar

O conteúdo gerado na Fase 1 é lixo de teste — uploads aleatórios, flashcards experimentais, quizzes incompletos. Você não quer que esse ruído polua o banco na hora que os usuários "de verdade" começarem a usar.

Mas as **contas** dos alpha testers devem ser mantidas, porque eles vão continuar usando na Fase 2 (são da sua sala, afinal).

### O que MANTER
- Tabela `auth.users` → Intocada. Todas as contas permanecem.
- Tabela `profiles` → Intocada (mas vamos resetar o trial — veja abaixo).

### O que DELETAR
Todo o conteúdo gerado durante o alpha:

```sql
-- ⚠️ ATENÇÃO: Execute esses comandos na ordem exata (respeitar foreign keys)

-- 1. Deletar reviews de flashcards
DELETE FROM flashcard_reviews;

-- 2. Deletar flashcards (dependem dos decks)
DELETE FROM flashcards;

-- 3. Deletar questões de quiz (dependem dos quizzes)
DELETE FROM quiz_questions;

-- 4. Deletar quizzes
DELETE FROM quizzes;

-- 5. Deletar mapas mentais
DELETE FROM mindmaps;

-- 6. Deletar decks
DELETE FROM decks;

-- 7. Deletar documentos
DELETE FROM documents;

-- 8. Deletar fontes
DELETE FROM sources;

-- 9. Deletar pastas
DELETE FROM folders;
```

### Resetar o trial de todos os usuários

Depois de limpar o conteúdo, resete o trial para que todo mundo — incluindo os alpha testers — ganhe 14 dias frescos a partir do lançamento da Fase 2:

```sql
-- Resetar trial: todos ganham 14 dias a partir de AGORA
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '14 days'
WHERE plan = 'free';
```

### Checklist de limpeza

```
[ ] Rodar os DELETEs na ordem correta
[ ] Rodar o UPDATE de trial_ends_at
[ ] Verificar no Supabase que as tabelas de conteúdo estão vazias
[ ] Verificar que auth.users tem todas as contas intactas
[ ] Testar: logar como um alpha tester e confirmar que tem acesso total + dashboard vazio
```

---

## Fase 2 — Beta (Sala da Faculdade)

### Objetivo
Validar o produto com um grupo maior (30-50 pessoas) que representa o público-alvo real: estudantes de medicina. Testar com escala real de uso simultâneo.

### Como funciona

**O código de criação de perfil agora seta**:

```
Novo usuário → profiles:
  plan = 'free'
  trial_ends_at = NOW() + 14 dias
  stripe_customer_id = NULL
```

A única diferença entre a Fase 1 e 2 é o valor do `trial_ends_at`:
- **Fase 1**: Data muito no futuro (sem prazo real).
- **Fase 2**: Exatamente 14 dias a partir do cadastro.

**Os alpha testers já existentes** foram resetados na limpeza (todos ganharam 14 dias frescos). Eles continuam usando a mesma conta, mesmo email, mesma senha. A experiência é idêntica a de quem acabou de se cadastrar.

### Comunicação com os usuários

**No cadastro / primeiro acesso, mostrar**:
> *"Bem-vindo ao Axoniq! Você tem acesso completo por 14 dias. Explore, estude, e gere seu material."*

**No dashboard, mostrar um badge/contador**:
> *"Pro Trial — 12 dias restantes"*

**Quando faltar 3 dias**:
> *"Seu acesso completo termina em 3 dias. Assine para continuar gerando flashcards, quizzes e mapas mentais ilimitados."*

**No dia que expirar**:
> *"Seu período de teste terminou. Você continua com acesso ao plano Free (3 fontes/mês, 15 flashcards). Para desbloquear tudo, assine o Pro."*

### Como divulgar para a sala

Opção A — **Grupo do WhatsApp da sala**:
> *"Galera, criei uma ferramenta de estudo com IA. Vocês mandam um PDF ou áudio da aula e ela gera flashcards e quiz automaticamente. Tô liberando acesso completo por 2 semanas, testem aí: [link]*
> *Feedback no privado ou nesse grupo, qualquer coisa."*

Opção B — **Presencialmente antes de uma aula**:
Mostra na tela da sala em 2 minutos:
1. Faz upload de um PDF da matéria atual.
2. Mostra os flashcards gerados instantaneamente.
3. "Se quiserem testar, o link é esse. Tá liberado por 2 semanas."

A opção B converte **muito** mais, porque eles veem o valor antes de precisar fazer qualquer esforço.

### O que monitorar

| Métrica | Como medir | Meta |
|---|---|---|
| Cadastros | Contar registros em `auth.users` | 30-50 nos primeiros 3 dias |
| Ativação | Quantos geraram pelo menos 1 deck | >60% dos cadastrados |
| Retenção D7 | Quantos logaram no dia 7 | >30% |
| Volume de geração | Total de decks/quizzes criados | — |
| Feedback espontâneo | Mensagens recebidas | O máximo possível |

### Duração
Exatamente 14 dias corridos. Não estenda. A data fixa cria urgência pra usar e pra decidir se vai pagar.

---

## Fase 3 — Lançamento (Cobrança Ativa)

### O que acontece no dia 15

1. O `trial_ends_at` de todos os beta testers vence.
2. Na próxima vez que acessam, o sistema detecta: "trial expirado, plan = free".
3. Eles perdem acesso a: mapas mentais, áudio, geração acima de 15 flashcards, painel completo.
4. **MAS**: Todo conteúdo que criaram durante o trial **continua salvo**. Não apagamos nada. Eles podem revisar os decks que já existem, estudar os flashcards que já foram gerados, refazer os quizzes. Só não podem gerar conteúdo novo acima dos limites do Free.
5. Aparece um call-to-action claro para assinar.

### O poder psicológico dessa transição

O estudante que usou por 14 dias provavelmente tem:
- 3-5 decks com 100+ flashcards
- 2-3 quizzes
- Dados no painel de desempenho

Tirar o acesso total **dói**. Ele já investiu tempo. Os decks dele estão lá. Ele sabe que funciona. A barreira pra pagar R$29,90 (um almoço) é baixíssima nesse momento.

### Fluxo de upgrade

```
Usuário vê "Trial expirado"
    → Clica em "Assinar Pro"
    → Escolhe período (Mensal / Semestral / Anual)
    → Vai pro Stripe Checkout
    → Paga (Cartão, PIX)
    → Webhook atualiza plan = 'pro' no banco
    → Acesso total restaurado instantaneamente
    → Usuário feliz
```

### Stripe: O que precisa estar pronto

Antes do dia 15 (fim do trial), você PRECISA ter pronto:

```
[ ] Conta Stripe criada e verificada
[ ] Produto "Axoniq Pro" criado com 3 preços:
    - R$29,90/mês (recorrente)
    - R$149,90/semestre (recorrente)
    - R$249,90/ano (recorrente)
[ ] Rota /api/stripe/checkout implementada
[ ] Rota /api/stripe/webhook implementada
[ ] Webhook configurado no Stripe Dashboard apontando pra produção
[ ] Portal do cliente (gerenciar assinatura / cancelar)
[ ] Página de preços (/pricing) publicada
[ ] Testado em modo teste com cartões fake
[ ] Modo live ativado
```

### O que fazer com quem NÃO converte

Eles ficam no plano Free. Não apague a conta deles. Razões:

1. **Podem converter depois**. Talvez não tenham dinheiro agora, mas no mês que vem sim.
2. **São divulgadores**. Se gostaram, vão falar pro colega: "Existe uma parada que gera flashcard automático."
3. **Custo zero**. Usuário no Free não gasta nada da sua infra (não gera conteúdo novo acima do limite).

---

## Tabela de Configuração por Fase

Esta tabela resume exatamente o que muda no sistema em cada fase:

| Configuração | Fase 1 (Alpha) | Fase 2 (Beta) | Fase 3 (Launch) |
|---|---|---|---|
| **trial_ends_at no cadastro** | `2026-12-31` | `NOW() + 14 dias` | `NULL` (sem trial) |
| **Stripe necessário** | Não | Não | Sim |
| **Limites de plano ativos** | Não (trial cobre) | Não (trial cobre) | Sim |
| **Banner de trial** | Não | Sim ("X dias restantes") | Não |
| **Página de preços** | Não | Não (ou prévia) | Sim |
| **Botão de upgrade** | Não | Sim (prepara pro dia 15) | Sim |

**O que muda no código entre cada fase**: Apenas o valor padrão do `trial_ends_at` no momento do cadastro. Literalmente uma linha.

```typescript
// Fase 1
trial_ends_at: '2026-12-31T23:59:59Z'

// Fase 2
trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

// Fase 3
trial_ends_at: null
```

---

## Cronograma Sugerido

```
SEMANA 1-2:  Implementar lógica de trial + colunas no banco
             Convidar alpha testers

SEMANA 3:    Corrigir bugs encontrados no alpha
             Preparar banner de trial
             Limpar banco de dados (DELETEs + reset trial)

SEMANA 4:    Lançar Fase 2 (sala da faculdade)
             Implementar Stripe em paralelo (modo teste)

SEMANA 5:    Continuar Fase 2, monitorar uso
             Finalizar Stripe + página de preços

SEMANA 6:    Trial expira → Fase 3 começa
             Stripe em modo live
             Aceitar primeiros pagamentos
```

---

## Resumo Executivo

1. **Todos os usuários criam conta da mesma forma**, da Fase 1 à 3. Mesmo fluxo, mesma URL, mesma experiência.
2. **O acesso é controlado por uma única data** (`trial_ends_at`), sem intervenção manual.
3. **Entre as fases, uma limpeza SQL** apaga o lixo de teste e reseta os trials, mantendo as contas intactas.
4. **O Stripe só entra na Fase 3**, quando os trials vencem e a cobrança começa.
5. **Ninguém perde conteúdo**. Os decks e quizzes criados durante o trial permanecem acessíveis. Apenas a geração de novo conteúdo é limitada no Free.
