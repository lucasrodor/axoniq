# PRD — Axoniq: Preparação para Lançamento

> **Versão**: 1.0  
> **Data**: 05/04/2026  
> **Stack**: Next.js 16 · Supabase · Vercel · OpenAI (GPT-4o + Whisper)  
> **Objetivo**: Documentar TUDO que precisa ser feito, verificado e preparado antes do lançamento público do Axoniq.

---

## Índice

1. [P0 — Bloqueantes (Sem isso, NÃO lança)](#p0--bloqueantes)
2. [P1 — Críticos (Lançar sem isso é arriscado)](#p1--críticos)
3. [P2 — Importantes (Primeiras 2 semanas pós-lançamento)](#p2--importantes)
4. [P3 — Desejáveis (Mês 1-2, qualidade de vida)](#p3--desejáveis)

---

## P0 — Bloqueantes

> Sem esses itens resolvidos, o lançamento expõe o projeto a riscos financeiros, legais ou de segurança que podem ser irreversíveis.

---

### P0.1 — Row Level Security (RLS) em TODAS as tabelas

**O que é**: RLS é o mecanismo do Supabase (PostgreSQL) que garante que cada usuário só vê e edita os seus próprios dados. Sem RLS, qualquer pessoa com um JWT válido pode acessar dados de outros usuários fazendo queries diretas.

**Por que é P0**: Um único vazamento de dados entre usuários destrói a confiança no produto de forma permanente. Se um estudante vê os flashcards de outro, acabou.

**Como verificar**:

1. Abra o Supabase Dashboard → SQL Editor
2. Execute para cada tabela:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
3. Qualquer tabela com `rowsecurity = false` é um risco.

**Como implementar** (para cada tabela que toca dados do usuário):

```sql
-- Habilitar RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuário só vê seus próprios dados
CREATE POLICY "Users can view own sources" ON sources
  FOR SELECT USING (auth.uid() = user_id);

-- Política de inserção: usuário só insere com seu próprio ID
CREATE POLICY "Users can insert own sources" ON sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política de atualização
CREATE POLICY "Users can update own sources" ON sources
  FOR UPDATE USING (auth.uid() = user_id);

-- Política de deleção
CREATE POLICY "Users can delete own sources" ON sources
  FOR DELETE USING (auth.uid() = user_id);
```

**Tabelas que PRECISAM de RLS**:
| Tabela | Coluna de referência | Notas |
|---|---|---|
| `sources` | `user_id` | Conteúdo enviado pelo usuário |
| `decks` | `user_id` | Decks de flashcards |
| `flashcards` | via `deck_id → decks.user_id` | Precisa de policy com JOIN |
| `flashcard_reviews` | `user_id` | Histórico de estudo |
| `quizzes` | `user_id` | Quizzes gerados |
| `quiz_questions` | via `quiz_id → quizzes.user_id` | JOIN necessário |
| `mindmaps` | `user_id` | Mapas mentais |
| `folders` | `user_id` | Pastas organizadoras |
| `documents` | `user_id` | Histórico de uploads |

**Como testar**:
1. Crie dois usuários de teste (A e B).
2. Logue como A, crie um deck.
3. Pegue o JWT do usuário B (via DevTools → Application → supabase token).
4. Use o Postman ou curl para tentar acessar o deck de A usando o token de B:
```bash
curl -H "Authorization: Bearer TOKEN_DO_USUARIO_B" \
  -H "apikey: SUA_ANON_KEY" \
  "https://SEU_PROJETO.supabase.co/rest/v1/decks?select=*"
```
5. Se retornar dados de A → **VULNERÁVEL**. Se retornar vazio → **SEGURO**.

**Critério de aceite**: Nenhuma query cross-user retorna dados.

---

### P0.2 — API Keys Apenas no Servidor

**O que é**: Garantir que chaves sensíveis (OpenAI, Supabase Service Role) nunca sejam expostas no código do cliente (browser).

**Por que é P0**: Se a `OPENAI_API_KEY` vazar pro client, qualquer pessoa pode extraí-la do DevTools e usar pra gerar milhares de requests na sua conta. Você acorda com uma fatura de $5.000.

**Como verificar**:

1. Abra o site em produção.
2. DevTools → Sources → procure por `sk-` (prefixo da chave OpenAI) ou `service_role`.
3. DevTools → Network → observe os headers de todas as requests. Nenhuma deve conter a API key da OpenAI.

**Regra de ouro**:
- Variáveis que começam com `NEXT_PUBLIC_` são **visíveis no client**. NUNCA coloque secrets aqui.
- Variáveis SEM `NEXT_PUBLIC_` só existem no servidor (API routes, Server Components).

**Checklist**:
```
✅ OPENAI_API_KEY          → Só no servidor (sem NEXT_PUBLIC_)
✅ SUPABASE_SERVICE_ROLE_KEY → Só no servidor (sem NEXT_PUBLIC_)
✅ NEXT_PUBLIC_SUPABASE_URL  → OK no client (é pública)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY → OK no client (limitada pelo RLS)
```

**Na Vercel**: Settings → Environment Variables → confirme que as sensíveis estão sem `NEXT_PUBLIC_`.

**Critério de aceite**: Busca por `sk-` e `service_role` no bundle do client retorna zero resultados.

---

### P0.3 — Rate Limiting nas Rotas de Geração

**O que é**: Limitar quantas vezes um usuário pode chamar as rotas de geração (flashcards, quiz, mindmap, áudio) em um intervalo de tempo.

**Por que é P0**: Sem rate limiting, um script automatizado pode chamar `/api/generate-flashcards` 1.000 vezes em 1 minuto. Cada chamada consome tokens da OpenAI. O custo pode explodir para centenas ou milhares de reais em minutos.

**Como implementar** (opção recomendada: Upstash Rate Limit):

1. Crie uma conta no [Upstash](https://upstash.com) (tem plano grátis generoso).
2. Crie um Redis database.
3. Instale o pacote:
```bash
npm install @upstash/ratelimit @upstash/redis
```
4. Crie um helper reutilizável:
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests por hora
  analytics: true,
})
```
5. Use nas API routes:
```typescript
// No início de cada route.ts de geração
const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
const identifier = user?.id || ip
const { success, remaining } = await rateLimiter.limit(identifier)

if (!success) {
  return NextResponse.json(
    { error: 'Limite de gerações atingido. Tente novamente em 1 hora.' },
    { status: 429 }
  )
}
```

**Limites sugeridos por rota**:
| Rota | Limite | Janela | Justificativa |
|---|---|---|---|
| `/api/generate-flashcards` | 10 | 1 hora | Cada call custa ~$0.05-0.10 |
| `/api/generate-quiz` | 10 | 1 hora | Mesmo custo |
| `/api/generate-mindmap` | 10 | 1 hora | Mesmo custo |
| `/api/process-audio` | 5 | 1 hora | Mais pesado (Whisper) |
| `/api/process-document` | 20 | 1 hora | Mais leve (extração de texto) |

**Critério de aceite**: Ao ultrapassar o limite, o usuário recebe um erro 429 amigável e a geração é bloqueada.

---

### P0.4 — Orçamento Máximo na OpenAI

**O que é**: Configurar um teto de gasto mensal na conta da OpenAI para que, mesmo se tudo der errado, sua fatura não passe de um valor definido.

**Por que é P0**: Esta é a sua última linha de defesa. Mesmo com rate limiting, bugs ou edge cases podem causar gastos inesperados.

**Como fazer**:

1. Acesse [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Vá em **Usage limits**
3. Configure:
   - **Hard limit**: O máximo absoluto. Quando atingido, todas as requests são recusadas. Sugestão: **$100/mês** para início.
   - **Soft limit**: Quando atingido, você recebe um email de alerta. Sugestão: **$50/mês**.

**Cálculo de referência**:
```
1 geração de 20 flashcards ≈ $0.08
1 transcrição de 10min de áudio ≈ $0.06
1 geração de quiz (20 questões) ≈ $0.10

100 usuários gerando 3x por semana cada:
  300 gerações/semana × $0.10 = $30/semana ≈ $120/mês

→ Hard limit de $150/mês dá margem segura.
```

**Critério de aceite**: Limites configurados e email de alerta testado.

---

### P0.5 — Termos de Uso e Política de Privacidade

**O que é**: Documentos legais que protegem você e informam o usuário sobre como seus dados são tratados.

**Por que é P0**: A LGPD (Lei Geral de Proteção de Dados) exige que qualquer serviço que coleta dados pessoais tenha uma política de privacidade pública. Sem isso, você pode ser notificado pela ANPD.

**O que incluir nos Termos de Uso**:
- O Axoniq é uma ferramenta de apoio ao estudo, **não substitui fontes oficiais**.
- O conteúdo gerado por IA pode conter imprecisões.
- O usuário é responsável pelo material que envia (não enviar dados de pacientes reais).
- Você pode encerrar contas que violem os termos.
- Limitação de responsabilidade sobre a precisão do conteúdo gerado.

**O que incluir na Política de Privacidade**:
- **Dados coletados**: Email, nome, conteúdo de estudo enviado (PDFs, textos, áudios).
- **Como são usados**: Para gerar material de estudo personalizado.
- **Processamento por terceiros**: OpenAI (transcrição e geração de conteúdo), Supabase (armazenamento), Vercel (hospedagem).
- **Armazenamento**: Supabase (infraestrutura AWS, região X).
- **Retenção**: Dados mantidos enquanto a conta estiver ativa.
- **Direitos do usuário (LGPD)**: Acesso, correção, exclusão, portabilidade dos dados.
- **Contato do DPO**: Seu email de contato para questões de privacidade.

**Onde colocar**:
- Crie as rotas `/termos` e `/privacidade` no site.
- Link no rodapé de todas as páginas.
- Link na tela de cadastro (checkbox: "Li e aceito os Termos de Uso").

**Dica prática**: Use o [Termly](https://termly.io) ou o [PrivacyPolicies.com](https://www.privacypolicies.com) pra gerar uma base e depois personalize. Ou peça pra um advogado revisar (recomendado para produto comercial).

**Critério de aceite**: Páginas publicadas e acessíveis, checkbox de aceite no cadastro.

---

## P1 — Críticos

> Não bloqueiam o lançamento, mas lançar sem eles aumenta significativamente o risco de perder usuários na primeira semana.

---

### P1.1 — Error Tracking (Sentry)

**O que é**: Um serviço que captura automaticamente erros no frontend (React) e no backend (API routes) e te envia alertas com stack traces completos.

**Por que é P1**: Sem isso, quando um usuário encontrar um bug, você não vai saber. Ele simplesmente vai embora. Com Sentry, você recebe um alerta em tempo real com o erro exato, o browser do usuário, e o que ele estava fazendo.

**Como implementar**:

1. Crie conta no [sentry.io](https://sentry.io) (free tier: 5k eventos/mês).
2. Instale:
```bash
npx @sentry/wizard@latest -i nextjs
```
3. O wizard cria automaticamente:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Atualiza `next.config.js`
4. Configure as variáveis de ambiente na Vercel:
```
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
```

**O que monitorar prioritariamente**:
- Erros nas rotas `/api/generate-*` (falhas da OpenAI).
- Erros de autenticação (tokens expirados).
- Erros de runtime no dashboard (componentes crashando).

**Critério de aceite**: Provocar um erro intencional em produção e confirmar que aparece no dashboard do Sentry em <1 minuto.

---

### P1.2 — Empty States (Onboarding Visual)

**O que é**: O que o usuário vê quando não tem nenhum conteúdo criado ainda. Essa tela vazia é a primeira impressão real do produto.

**Por que é P1**: Um dashboard vazio = "Não sei o que fazer aqui" = usuário fecha = nunca mais volta. O empty state é o seu **tutorial silencioso**.

**Telas que precisam de empty state**:

| Tela | Mensagem sugerida | CTA |
|---|---|---|
| Dashboard (sem decks) | "Sua jornada começa aqui. Envie sua primeira aula ou texto para gerar material de estudo." | [Criar Fonte de Estudo] |
| Lista de Quizzes (vazia) | "Nenhum quiz ainda. Gere seu primeiro a partir de um material enviado." | [Ir para Nova Fonte] |
| Mapas Mentais (vazio) | "Seus mapas mentais aparecerão aqui depois de gerar a partir de uma fonte." | [Criar Fonte] |
| Painel de Desempenho (sem dados) | "Comece a estudar para ver suas estatísticas de retenção e domínio." | [Iniciar Estudo] |
| Pastas (sem pastas) | "Organize seus decks e quizzes em pastas temáticas." | [Criar Pasta] |

**Design dos Empty States**:
- Ícone grande e suave (não genérico — use algo contextual como um cérebro ou livro).
- Título curto e direto.
- Subtítulo explicativo (1-2 linhas).
- Botão de ação primário.
- Manter o tom Clinical Dark (sem fundos brancos).

**Critério de aceite**: Criar uma conta nova e navegar por TODAS as telas do dashboard. Nenhuma deve estar em branco ou sem orientação.

---

### P1.3 — Responsividade Mobile

**O que é**: Garantir que todas as telas funcionam corretamente em telas de 375px (iPhone SE) até 428px (iPhone 14 Pro Max).

**Por que é P1**: Estudantes de medicina estudam primariamente no celular. Se os flashcards estiverem cortados ou os botões forem pequenos demais, a experiência é ruim e o usuário migra pro Anki.

**Telas críticas para testar no mobile**:

1. **Estudo de Flashcards** (`/dashboard/deck/[id]/study`)
   - O card flip funciona com touch?
   - Os botões de feedback (De Novo, Difícil, Bom, Fácil) são tocáveis com o polegar?
   - O texto longo não ultrapassa o card?

2. **Quiz** (`/dashboard/quiz/[id]`)
   - As alternativas são selecionáveis por toque?
   - O feedback de acerto/erro é visível sem scroll?

3. **Dashboard principal**
   - A sidebar colapsa ou vira um menu hamburger?
   - Os cards do BentoGrid empilham verticalmente?
   - O drag-and-drop de pastas funciona no touch? (Se não, desabilite no mobile)

4. **Upload / Nova Fonte**
   - O upload de arquivo funciona no mobile?
   - O seletor de abas (Arquivo / Texto / Áudio) cabe na tela?
   - O textarea de "Colar Texto" é confortável de usar?

5. **Painel de Desempenho**
   - Os gráficos do Recharts são responsivos?
   - O heatmap não vaza pra fora da tela?

**Como testar**:
- Chrome DevTools → Toggle Device Toolbar → iPhone SE (375px) e iPhone 14 Pro Max (428px).
- Teste REAL em um celular físico (Android e iOS se possível). Emuladores não capturam problemas de touch.

**Critério de aceite**: Todas as telas críticas são funcionais e legíveis em 375px de largura.

---

### P1.4 — Backup e Recuperação de Dados

**O que é**: Garantir que os dados dos usuários (flashcards, quizzes, mapas mentais, fontes) estão protegidos contra perda.

**Por que é P1**: Se o banco cair ou alguém acidentalmente dropar uma tabela, você perde TUDO dos seus usuários.

**O que o Supabase já faz**:
- **Plano Free**: Backups automáticos diários (não restauráveis pelo usuário).
- **Plano Pro ($25/mês)**: Backups automáticos diários + Point-in-Time Recovery (PITR) de até 7 dias.

**O que VOCÊ precisa fazer**:
1. Se estiver no Free tier, faça backups manuais periodicamente:
```bash
# Conecte via pg_dump (precisa do Postgres instalado)
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
```
2. Considere seriamente o upgrade pro plano Pro do Supabase antes do lançamento. $25/mês é barato comparado ao risco de perder dados de todos os usuários.

**Critério de aceite**: Backup manual testado com restauração bem-sucedida OU plano Pro ativado com PITR.

---

### P1.5 — Emails de Autenticação Personalizados

**O que é**: Os emails que o Supabase envia automaticamente (confirmação de conta, reset de senha) vêm com template genérico. Personalizar com a marca do Axoniq.

**Por que é P1**: Email genérico do Supabase parece spam. O usuário não confia, não clica, e não confirma a conta.

**Como personalizar**:
1. Supabase Dashboard → Authentication → Email Templates.
2. Customize os seguintes templates:
   - **Confirm signup**: "Bem-vindo ao Axoniq! Confirme seu email para começar a estudar."
   - **Reset password**: "Redefinição de senha - Axoniq"
   - **Magic link**: "Seu link de acesso ao Axoniq"
3. Use o HTML com a identidade visual do Axoniq (logo, cores Clinical Dark).
4. Configure um **domínio de envio customizado** se possível (ex: `noreply@axoniq.com.br` em vez de `noreply@mail.supabase.io`). Isso melhora a entregabilidade.

**Para domínio customizado de email**:
- Supabase Dashboard → Project Settings → Auth → SMTP Settings
- Use um serviço como **Resend** (que você já tem instalado!) ou **SendGrid** (free tier: 100 emails/dia).

**Critério de aceite**: Criar uma conta nova e confirmar que o email chega com a marca Axoniq, link funcional, e visual profissional.

---

### P1.6 — Tratamento de Edge Cases

**O que é**: Garantir que o sistema se comporta de forma previsível quando o usuário faz algo inesperado.

**Lista de edge cases para testar e tratar**:

| Cenário | Comportamento esperado | Como tratar |
|---|---|---|
| Upload de PDF de 200+ páginas | Avisar que apenas as primeiras X páginas serão analisadas | Mensagem na UI após processamento |
| Upload de áudio sem fala (só ruído) | Erro amigável: "Não foi possível detectar fala no áudio" | Validar comprimento da transcrição |
| Duplo clique em "Gerar Flashcards" | Gerar apenas uma vez | Desabilitar botão após primeiro clique |
| Perda de conexão durante geração | Os dados já gerados devem ser salvos | Verificar se o save no Supabase ocorre antes de retornar |
| Token JWT expirado durante geração longa | Refresh automático ou erro claro | Implementar retry com token refresh |
| Texto colado com <50 caracteres | Erro claro: "Texto muito curto" | Já implementado, validar mensagem |
| Upload de arquivo não suportado (.xlsx, .pptx) | Erro claro: "Formato não suportado" | Já tratado pelo dropzone, validar mensagem |
| Usuário tenta acessar deck de outro usuário via URL | 404 ou redirect ao dashboard | RLS + verificação na query |
| Nome de arquivo com caracteres especiais (ação, café) | Não deve quebrar | Sanitizar nome do arquivo no backend |

**Critério de aceite**: Cada cenário testado manualmente com resultado documentado.

---

## P2 — Importantes

> Implementar nas primeiras 2 semanas pós-lançamento. Melhoram significativamente a experiência e a retenção de usuários.

---

### P2.1 — Analytics (Entender o Comportamento do Usuário)

**O que é**: Rastrear como os usuários navegam pelo produto para entender o que funciona e o que não funciona.

**Opções recomendadas**:

| Ferramenta | Custo | Melhor para |
|---|---|---|
| **Vercel Analytics** | Incluso no Pro | Métricas web básicas (Core Web Vitals) |
| **PostHog** | Free até 1M eventos/mês | Analytics completo, heatmaps, session recording |
| **Mixpanel** | Free até 20M eventos/mês | Funil de conversão, retenção |

**Eventos essenciais para rastrear**:

```
# Funil principal
source_created    → Usuário criou uma fonte (upload/texto/áudio)
flashcards_generated → Flashcards gerados com sucesso
quiz_generated    → Quiz gerado com sucesso
study_session_started → Iniciou sessão de estudo
study_session_completed → Terminou sessão de estudo
quiz_completed    → Completou um quiz

# Retenção
daily_active_user → Usuário logou no dia
cards_reviewed    → Quantidade de cards revisados
retention_rate    → Taxa de retorno (voltou no dia seguinte?)

# Problemas
generation_error  → Erro na geração (qual rota? qual erro?)
upload_error      → Erro no upload (formato? tamanho?)
```

**Critério de aceite**: Pelo menos as métricas do funil principal rastreadas e visíveis em um dashboard.

---

### P2.2 — Canal de Feedback e Suporte

**O que é**: Um meio direto para os primeiros usuários reportarem problemas e sugerirem melhorias.

**Opções práticas (do mais simples ao mais robusto)**:

1. **Botão "Feedback" no app**: Um botão fixo no canto inferior direito que abre um formulário simples (nome, mensagem, screenshot opcional). Salva no Supabase numa tabela `feedback`.
2. **Grupo de WhatsApp/Telegram**: Para os primeiros 50-100 usuários. Dá a sensação de comunidade e proximidade.
3. **Discord**: Melhor para escala. Canais separados para bugs, sugestões, e anúncios.
4. **Intercom/Crisp**: Chat in-app profissional. Crisp tem plano grátis.

**Recomendação para lançamento**: Opção 1 (botão in-app) + Opção 2 (grupo WhatsApp para early adopters).

**Critério de aceite**: Pelo menos um canal de feedback implementado e funcional.

---

### P2.3 — Deleção de Conta (LGPD)

**O que é**: O usuário deve poder excluir sua conta e TODOS os seus dados a qualquer momento.

**Por que é P2 (e não P0)**: A LGPD exige isso, mas no início você pode oferecer via "entre em contato por email para excluir sua conta". O ideal é ter um botão self-service.

**O que deletar quando o usuário pede exclusão**:
```sql
-- Ordem de deleção (respeitar foreign keys):
DELETE FROM flashcard_reviews WHERE user_id = ?;
DELETE FROM flashcards WHERE deck_id IN (SELECT id FROM decks WHERE user_id = ?);
DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE user_id = ?);
DELETE FROM quizzes WHERE user_id = ?;
DELETE FROM decks WHERE user_id = ?;
DELETE FROM mindmaps WHERE user_id = ?;
DELETE FROM sources WHERE user_id = ?;
DELETE FROM documents WHERE user_id = ?;
DELETE FROM folders WHERE user_id = ?;
-- Por último, deletar o usuário do Auth
-- (via Supabase Admin API: supabaseAdmin.auth.admin.deleteUser(userId))
```

**Alternativa rápida para o lançamento**: Crie uma rota `/api/delete-account` que faz tudo isso e adicione um botão nas Configurações com confirmação dupla ("Tem certeza? Esta ação é irreversível.").

**Critério de aceite**: Usuário consegue deletar conta e confirmar que nenhum dado permanece no banco.

---

### P2.4 — Cache e Performance Percebida

**O que é**: Fazer o app parecer mais rápido usando cache local e indicadores de carregamento inteligentes.

**Técnicas recomendadas**:

1. **Skeleton Loading** (substituir spinners por esqueletos):
   - Em vez do spinner genérico, mostra blocos cinza pulsando no formato dos cards/decks.
   - Bibliotecas: Pode fazer com CSS puro usando `animate-pulse` do Tailwind.

2. **Cache de navegação com SWR ou React Query**:
   - Quando o usuário volta ao dashboard, os dados aparecem instantaneamente (do cache) enquanto o fresh data é buscado em background.
   - Instalar: `npm install swr`
   ```typescript
   import useSWR from 'swr'
   
   const { data: decks } = useSWR(
     user?.id ? `/api/decks?userId=${user.id}` : null,
     fetcher,
     { revalidateOnFocus: false, dedupingInterval: 60000 }
   )
   ```

3. **Optimistic Updates**:
   - Quando o usuário responde um flashcard, atualize a UI imediatamente (sem esperar a resposta do servidor). Se der erro, reverta.

**Critério de aceite**: Transições entre páginas são instantâneas ou exibem skeleton.

---

### P2.5 — Uptime Monitoring

**O que é**: Um serviço externo que acessa seu site a cada 1-5 minutos e te avisa se ele cair.

**Opções gratuitas**:
- **UptimeRobot** (free: 50 monitores, checks a cada 5 min)
- **BetterUptime** (free tier generoso)
- **Checkly** (mais avançado, verifica APIs também)

**O que monitorar**:
- `https://axoniq.com.br` (ou seu domínio) — Home page
- `https://axoniq.com.br/dashboard` — Dashboard (precisa de auth?)
- `https://axoniq.com.br/api/process-document` — Health check da API (crie uma rota GET simples que retorna `{ status: "ok" }`)

**Alertas**: Configure para receber por email E WhatsApp/Telegram.

**Critério de aceite**: Monitor configurado e testado (derrube o site intencionalmente e confirme que recebe alerta).

---

## P3 — Desejáveis

> Mês 1-2 pós-lançamento. Melhoram a qualidade do produto e a escalabilidade, mas não são urgentes.

---

### P3.1 — Filas Assíncronas para Geração Pesada

**O que é**: Em vez de processar flashcards/quiz em tempo real (request → espera → resposta), coloque o pedido numa fila e processe em background. O usuário recebe notificação quando ficar pronto.

**Por que considerar**: 
- A Vercel tem timeout de 60s (Hobby) ou 300s (Pro). Transcrições longas podem estourar.
- Com filas, você pode processar múltiplas gerações em paralelo sem bloquear a UI.
- O usuário pode fechar o browser e voltar depois.

**Opções**:
| Ferramenta | Complexidade | Custo |
|---|---|---|
| **Inngest** | Baixa (SDK simples) | Free até 25k runs/mês |
| **Trigger.dev** | Média | Free tier generoso |
| **Supabase Edge Functions + pg_cron** | Alta | Incluso no Supabase |
| **QStash (Upstash)** | Baixa | Free tier |

**Fluxo com fila**:
```
1. Usuário clica "Gerar Flashcards"
2. API cria um registro em `generation_jobs` com status "pending"
3. API enfileira o job na fila
4. Retorna imediatamente: { jobId: "xxx", status: "processing" }
5. Frontend faz polling a cada 5s: GET /api/jobs/xxx
6. Worker pega o job da fila, processa, salva resultado, marca como "done"
7. Frontend detecta "done" e exibe os flashcards
```

**Critério de aceite**: Geração funciona de forma assíncrona com feedback de progresso ao usuário.

---

### P3.2 — Feature Flags

**O que é**: A capacidade de ligar/desligar funcionalidades em produção sem fazer deploy.

**Por que considerar**: Se o áudio transcritor começar a dar problema no lançamento, você pode desligá-lo em 10 segundos sem afetar o resto do app.

**Implementação simplificada** (sem ferramenta externa):

```typescript
// src/lib/features.ts
export const FEATURES = {
  AUDIO_UPLOAD: process.env.NEXT_PUBLIC_FEATURE_AUDIO === 'true',
  RETENTION_DASHBOARD: process.env.NEXT_PUBLIC_FEATURE_RETENTION === 'true',
  MINDMAP_GENERATION: process.env.NEXT_PUBLIC_FEATURE_MINDMAP === 'true',
}
```

```tsx
// No componente
{FEATURES.AUDIO_UPLOAD && (
  <button onClick={() => setInputMode('audio')}>Áudio</button>
)}
```

**Na Vercel**: Basta adicionar/remover a env var e fazer redeploy (ou usar Vercel Edge Config pra mudança instantânea).

**Implementação avançada**: Use **LaunchDarkly**, **Flagsmith**, ou **PostHog Feature Flags**.

**Critério de aceite**: Conseguir desabilitar uma feature em produção em menos de 2 minutos.

---

### P3.3 — Plano de Preços (Monetização)

**O que é**: Definir limites para o plano gratuito e o que será pago.

**Modelo sugerido para início**:

| Recurso | Free | Pro (R$ 29/mês) |
|---|---|---|
| Fontes por mês | 5 | Ilimitadas |
| Flashcards por geração | 20 | 50 |
| Upload de áudio | 10min máx | 1h máx |
| Gerações por mês | 15 | Ilimitadas |
| Exportação (Anki) | ❌ | ✅ |
| Painel de Desempenho | Básico | Completo |
| Suporte | Comunidade | Prioritário |

**Como implementar**:
1. Adicione uma coluna `plan` na tabela de usuários (`free` | `pro`).
2. Adicione uma coluna `generation_count` com reset mensal.
3. Cheque o plano antes de cada geração.
4. Para pagamentos: **Stripe** (internacional) ou **Asaas/PagSeguro** (Brasil, boleto + PIX).

**Critério de aceite**: Plano definido, limites implementados no backend, e página de preços publicada.

---

### P3.4 — Qualidade dos Prompts (Melhoria Contínua)

**O que é**: Refinamento iterativo dos prompts de geração baseado em feedback real dos usuários.

**Framework de melhoria**:

1. **Colete dados**: Adicione botões "👍 Correto / 👎 Incorreto" em cada flashcard e questão de quiz.
2. **Analise padrões**: Semanalmente, revise os cards com mais 👎. Quais são os problemas? Nomes errados? Respostas ambíguas?
3. **Ajuste os prompts**: Adicione regras específicas baseadas nos problemas encontrados.
4. **Teste A/B** (avançado): Rode dois prompts diferentes e compare a taxa de 👍.

**Áreas comuns de problema em conteúdo médico**:
- Nomenclatura anatômica (variações entre português e latim).
- Questões com mais de uma resposta possivelmente correta.
- Cards do tipo cloze que removem a palavra errada.
- Nível de dificuldade inconsistente.

**Critério de aceite**: Sistema de feedback implementado e primeira rodada de análise feita após 2 semanas de uso.

---

### P3.5 — Domínio Customizado e SEO

**O que é**: Usar um domínio próprio (ex: `axoniq.com.br`) e otimizar para aparecer no Google.

**Domínio**:
1. Registre o domínio no Registro.br ou Namecheap.
2. Na Vercel: Settings → Domains → adicione o domínio.
3. Configure os DNS conforme instruções da Vercel (CNAME ou A record).
4. SSL é automático na Vercel.

**SEO básico**:
- Cada página pública precisa de `<title>` e `<meta description>` únicos.
- Landing page otimizada para: "ferramenta de estudo medicina", "flashcards medicina", "gerador de quiz médico".
- Sitemap automático: Use `next-sitemap`.
- Open Graph tags para compartilhamento em redes sociais (imagem, título, descrição).

**Critério de aceite**: Domínio customizado funcionando com SSL, sitemap gerado, e OG tags em todas as páginas públicas.

---

## Apêndice: Checklist Executivo

```
P0 — BLOQUEANTES (fazer ANTES do lançamento)
├── [ ] P0.1 RLS testado em todas as tabelas
├── [ ] P0.2 API keys verificadas (nenhuma no client)
├── [ ] P0.3 Rate limiting implementado nas rotas de geração
├── [ ] P0.4 Orçamento máximo configurado na OpenAI
└── [ ] P0.5 Termos de Uso e Política de Privacidade publicados

P1 — CRÍTICOS (fazer antes ou na primeira semana)
├── [ ] P1.1 Sentry configurado para error tracking
├── [ ] P1.2 Empty states em todas as telas vazias
├── [ ] P1.3 Responsividade mobile validada nas telas críticas
├── [ ] P1.4 Estratégia de backup definida
├── [ ] P1.5 Emails de autenticação personalizados
└── [ ] P1.6 Edge cases testados e tratados

P2 — IMPORTANTES (primeiras 2 semanas pós-lançamento)
├── [ ] P2.1 Analytics implementado (PostHog ou Vercel Analytics)
├── [ ] P2.2 Canal de feedback (botão in-app + grupo WhatsApp)
├── [ ] P2.3 Deleção de conta funcional (LGPD)
├── [ ] P2.4 Cache/skeleton loading implementado
└── [ ] P2.5 Uptime monitoring ativo

P3 — DESEJÁVEIS (mês 1-2)
├── [ ] P3.1 Filas assíncronas para geração pesada
├── [ ] P3.2 Feature flags para rollback rápido
├── [ ] P3.3 Plano de preços definido e implementado
├── [ ] P3.4 Sistema de feedback de qualidade (👍/👎)
└── [ ] P3.5 Domínio customizado + SEO básico
```

---

> **Última atualização**: 05/04/2026  
> **Próxima revisão**: Pré-lançamento (após completar P0)
