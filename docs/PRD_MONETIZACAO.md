# Estratégia de Monetização — Axoniq

> **Versão**: 1.0  
> **Data**: 05/04/2026  
> **Contexto**: Ferramenta de estudo com IA para estudantes de medicina no Brasil  
> **Processador de Pagamentos**: Stripe

---

## 1. Decisão Estratégica: 2 Planos, Não 3

### Por que NÃO fazer 3 planos (Basic / Pro / Premium)

A tentação de criar 3 tiers é grande porque parece "mais profissional" e lembra o que as grandes SaaS fazem. Mas para o Axoniq, isso é uma armadilha:

1. **Complexidade prematura**: Cada tier é código extra — verificações de limites, UI condicional, lógica de upgrade, downgrade, proration. Em vez de focar no produto, você vai gastar semanas em billing edge cases.

2. **Paradoxo da escolha**: Estudante de medicina tem pouco tempo. Se ele vê 3 planos, ele compara, fica na dúvida, e fecha a aba. Com 2 (Free vs Pro), a decisão é binária: "quero mais ou não?"

3. **Canibalização**: Se você colocar um plano intermediário com "quase tudo", ninguém compra o Premium. Se o intermediário for fraco demais, ninguém compra ele. Você acaba com 2 planos de qualquer jeito.

4. **Momento do produto**: O Axoniq está no lançamento. Você ainda não sabe quais features os usuários realmente valorizam. Comece com 2 tiers, colece dados por 3-6 meses, e DEPOIS considere um terceiro se fizer sentido.

### A estrutura ideal: Free + Pro

```
Free  →  "Prove o valor" (Aquisição)
Pro   →  "Sem limites, estudo sério" (Monetização)
```

O Free existe para uma única razão: **fazer o estudante sentir o valor antes de pagar**. Ele precisa gerar flashcards de um PDF, estudar, e pensar "poxa, isso é muito bom, quero mais". O Pro desbloqueia o "mais".

---

## 2. O Que Colocar em Cada Plano

### Princípio fundamental: O Free deve ser ÚTIL, não inútil

Se o Free for tão limitado que a pessoa não consegue fazer nada, ela não entende o valor e nunca converte. Se for generoso demais, ela nunca precisa pagar. O equilíbrio:

### Tabela Definitiva de Features

| Feature | Free | Pro |
|---|---|---|
| **Fontes de estudo por mês** | 3 | Ilimitadas |
| **Flashcards por geração** | 15 | 50 |
| **Questões de quiz por geração** | 10 | 30 |
| **Mapas mentais** | ❌ | ✅ Ilimitados |
| **Upload de áudio (transcrição)** | ❌ | ✅ Até 1h por arquivo |
| **Tipos de fonte** | PDF, DOCX, TXT, Texto colado | Todos + Áudio (MP3, M4A, WAV) |
| **Painel de Desempenho** | Básico (apenas ISM e total de cards) | Completo (Radar, Heatmap, Previsão) |
| **Pastas organizadoras** | 3 pastas | Ilimitadas |
| **Histórico de fontes** | Últimas 10 | Todo o histórico |
| **Repetição espaçada (SRS)** | ✅ | ✅ |
| **Modo de estudo** | ✅ | ✅ |
| **Suporte** | Comunidade | Email prioritário |

### Por que essas escolhas:

- **Fontes por mês (3 no Free)**: O estudante consegue testar com 3 aulas. Suficiente pra viciar, insuficiente pra passar o semestre. É o "trial" perfeito.
- **Mapa mental e Áudio apenas no Pro**: São as features mais caras em termos de API e as mais "wow". Elas são o diferencial que justifica pagar.
- **SRS e Estudo no Free**: O core do produto (gerar e estudar) funciona no Free. Se você bloquear isso, ninguém entende o valor.
- **Painel de Desempenho limitado no Free**: Dá um gostinho. O estudante vê "85% de retenção" mas não consegue ver o radar de especialidades. Quer saber onde está fraco? Upgrade.

---

## 3. Precificação

### Análise do mercado brasileiro de edtech médica

| Ferramenta | Preço | O que oferece |
|---|---|---|
| Anki | Grátis (Desktop) / R$140 (iOS) | Flashcards manuais, SRS |
| Quizlet Plus | ~R$40/mês | Flashcards, quiz, explicações IA |
| Sanar | R$99-199/mês | Videoaulas + questões (plataforma completa) |
| Jaleko | R$79-149/mês | Videoaulas médicas |
| Medcel | R$150-300/mês | Preparatório residência |
| Notion AI | ~R$50/mês | IA para notas (genérico) |

### Posicionamento do Axoniq

O Axoniq não é uma plataforma de videoaulas (Sanar/Jaleko). É uma **ferramenta de produtividade de estudo**. O concorrente mais próximo é o Quizlet Plus + uso manual do ChatGPT. O diferencial é a automação (upload → material pronto).

Posição no mercado: **Abaixo das plataformas de conteúdo, acima das ferramentas genéricas**.

### Preços recomendados

```
Mensal:     R$ 29,90/mês
Semestral:  R$ 149,90/semestre  (≈ R$ 24,98/mês — 16% de desconto)
Anual:      R$ 249,90/ano       (≈ R$ 20,83/mês — 30% de desconto)
```

### Por que esses valores:

- **R$29,90 mensal**: Abaixo da barreira psicológica de R$30. É "um almoço por semana". Acessível para estudante que já gasta R$5.000+ com faculdade.
- **Semestral**: Alinhado com o calendário acadêmico (semestres universitários). Desconto de 16% incentiva o compromisso sem parecer "preso por 1 ano".
- **Anual**: O desconto de 30% é agressivo o suficiente para atrair, mas o Axoniq ainda ganha porque reduz churn e garante receita previsível.

### Matemática do negócio

**Custo por usuário Pro ativo (estimativa)**:

```
OpenAI GPT-4o:
  ~8 gerações/mês × ~$0.08 cada = $0.64/mês ≈ R$3,50/mês

OpenAI Whisper (se usar áudio):
  ~2 transcrições/mês × 15min × $0.006/min = $0.18/mês ≈ R$1,00/mês

Supabase (rateio):
  Plano Pro: $25/mês ÷ 500 usuários = $0.05/mês ≈ R$0,30/mês

Vercel (rateio):
  Plano Pro: $20/mês ÷ 500 usuários = $0.04/mês ≈ R$0,20/mês

Stripe (taxa por transação):
  3.99% + R$0.39 por cobrança no Brasil

CUSTO TOTAL POR USUÁRIO: ≈ R$5,00/mês
RECEITA POR USUÁRIO (mensal): R$29,90
MARGEM BRUTA: ~83%
```

Mesmo no plano anual (R$20,83/mês), a margem é de ~76%. O modelo é saudável.

### Quando considerar aumentar o preço:
- Quando adicionar features premium significativas (ex: geração de resumos, simulados completos).
- Quando a base ultrapassar 1.000 usuários pagantes e você tiver dados de willingness-to-pay.
- Nunca aumente para quem já paga. Novos preços valem só para novos assinantes (grandfather clause).

---

## 4. Períodos de Cobrança: Mensal + Semestral + Anual

### Por que oferecer os três:

- **Mensal**: Para quem quer testar sem compromisso. É a porta de entrada do pagante.
- **Semestral**: Alinhado com a realidade acadêmica. O estudante pensa em semestres, não em anos. Isso é específico do seu público e um diferencial.
- **Anual**: Para quem já está convicto. Melhor preço, mais previsibilidade pra você.

### Na prática, a distribuição tende a ser:

```
50-60% dos pagantes → Mensal (início)
25-30% → Semestral
10-20% → Anual

Após 6 meses (com retenção boa):
30-40% → Mensal
30-35% → Semestral
25-35% → Anual
```

O objetivo é gradualmente migrar a base para planos mais longos. Isso acontece naturalmente conforme o produto prova valor.

---

## 5. Implementação com Stripe

### 5.1 — Configuração Inicial

**Criar conta**:
1. [stripe.com](https://stripe.com) → Crie conta com CNPJ ou CPF (Stripe Brasil aceita pessoa física para começar, mas CNPJ é melhor para receber).
2. Ative o modo de teste primeiro. Só ative o modo live quando estiver pronto.

**Instalar SDK**:
```bash
npm install stripe @stripe/stripe-js
```

**Variáveis de ambiente**:
```env
# .env.local (NUNCA commitar)
STRIPE_SECRET_KEY=sk_test_xxx          # Só no servidor
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Só no servidor
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # OK no client
```

### 5.2 — Criação dos Produtos e Preços no Stripe

Você pode criar via Dashboard do Stripe ou via API. Recomendo o Dashboard para o setup inicial:

1. **Stripe Dashboard → Products → Create Product**
   - Nome: "Axoniq Pro"
   - Descrição: "Acesso completo à plataforma de estudo com IA"

2. **Adicionar 3 preços ao produto**:
   - **Mensal**: R$29,90/mês, recorrente
   - **Semestral**: R$149,90 a cada 6 meses, recorrente
   - **Anual**: R$249,90/ano, recorrente

3. Anote os `price_id` de cada um (ex: `price_1Nxxxx`). Você vai usar no código.

### 5.3 — Fluxo de Checkout (Stripe Checkout Sessions)

O Stripe Checkout é a opção mais segura e rápida. O Stripe cuida de:
- Formulário de cartão (PCI compliant)
- PIX (se ativado)
- Boleto (se ativado)
- 3D Secure
- Gestão de assinatura

**Rota de criação de checkout** (`/api/stripe/checkout`):

```typescript
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Mapeamento de planos para price_ids do Stripe
const PRICE_IDS = {
  monthly:  'price_XXXXX_mensal',
  semester: 'price_XXXXX_semestral',
  annual:   'price_XXXXX_anual',
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar usuário
    const supabase = createAdminClient()
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // 2. Pegar o plano escolhido
    const { plan } = await req.json() // 'monthly' | 'semester' | 'annual'
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
    if (!priceId) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    // 3. Verificar se usuário já tem um Stripe Customer
    let customerId: string | undefined
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id
      
      // Salvar no perfil
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 4. Criar Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?upgrade=cancelled`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id }
      },
      // Opcional: período de teste gratuito
      // subscription_data: { trial_period_days: 7 },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 })
  }
}
```

**No frontend (botão de upgrade)**:
```typescript
const handleUpgrade = async (plan: 'monthly' | 'semester' | 'annual') => {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ plan })
  })
  const { url } = await res.json()
  window.location.href = url // Redireciona pro checkout do Stripe
}
```

### 5.4 — Webhook (O mais importante)

O webhook é como o Stripe avisa o seu sistema de que algo aconteceu (pagamento confirmado, assinatura cancelada, cartão recusado). **SEM WEBHOOK, VOCÊ NÃO SABE QUEM PAGOU.**

**Rota de webhook** (`/api/stripe/webhook`):

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // Assinatura criada/ativada com sucesso
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ 
            plan: 'pro',
            stripe_subscription_id: session.subscription as string,
            plan_updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
      break
    }

    // Pagamento recorrente bem-sucedido
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      // Manter o plano ativo
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      if (profile) {
        await supabase
          .from('profiles')
          .update({ plan: 'pro' })
          .eq('id', profile.id)
      }
      break
    }

    // Pagamento falhou (cartão recusado, saldo insuficiente)
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      if (profile) {
        // Não rebaixa imediatamente — Stripe tenta novamente por padrão
        // Depois de X tentativas falhas, o subscription é cancelado
        // e o evento customer.subscription.deleted é disparado
        console.log(`Payment failed for user ${profile.id}`)
      }
      break
    }

    // Assinatura cancelada (pelo usuário ou por falha de pagamento)
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ 
            plan: 'free',
            stripe_subscription_id: null,
            plan_updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

**Configurar webhook no Stripe**:
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Eventos para ouvir:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copie o `Signing secret` → coloque em `STRIPE_WEBHOOK_SECRET`

**IMPORTANTE**: A rota de webhook NÃO deve ter autenticação (o Stripe não manda JWT). A verificação é feita pela assinatura (`stripe-signature` header).

### 5.5 — Verificação de Plano no Backend

Em TODAS as rotas que precisam checar o plano (gerações, áudio, etc.):

```typescript
// src/lib/plans.ts
import { createAdminClient } from '@/lib/supabase/server'

export interface PlanLimits {
  maxSourcesPerMonth: number
  maxFlashcardsPerGeneration: number
  maxQuizQuestionsPerGeneration: number
  canUseMindmap: boolean
  canUseAudio: boolean
  maxAudioMinutes: number
  maxFolders: number
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxSourcesPerMonth: 3,
    maxFlashcardsPerGeneration: 15,
    maxQuizQuestionsPerGeneration: 10,
    canUseMindmap: false,
    canUseAudio: false,
    maxAudioMinutes: 0,
    maxFolders: 3,
  },
  pro: {
    maxSourcesPerMonth: 999,
    maxFlashcardsPerGeneration: 50,
    maxQuizQuestionsPerGeneration: 30,
    canUseMindmap: true,
    canUseAudio: true,
    maxAudioMinutes: 60,
    maxFolders: 999,
  }
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()
  
  const plan = profile?.plan || 'free'
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export async function getMonthlySourceCount(userId: string): Promise<number> {
  const supabase = createAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
  
  return count || 0
}
```

**Uso nas API routes**:
```typescript
// Em /api/generate-flashcards/route.ts, no início:
const limits = await getUserPlanLimits(user.id)
const monthlyCount = await getMonthlySourceCount(user.id)

if (monthlyCount >= limits.maxSourcesPerMonth) {
  return NextResponse.json({
    error: 'Limite de fontes atingido este mês. Faça upgrade para continuar.',
    upgradeRequired: true
  }, { status: 403 })
}

// Usar limits.maxFlashcardsPerGeneration em vez do valor hardcoded
const quantity = Math.min(requestedQuantity, limits.maxFlashcardsPerGeneration)
```

### 5.6 — Portal de Gerenciamento (Self-service)

O Stripe oferece um portal pronto onde o usuário pode:
- Ver faturas
- Atualizar cartão
- Mudar de plano
- Cancelar assinatura

```typescript
// src/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token!)
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user!.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

Configure o portal no Stripe Dashboard → Settings → Billing → Customer Portal:
- Habilite: Atualizar método de pagamento, Cancelar assinatura, Ver faturas.
- Desabilite: Mudar de plano (se quiser controlar isso pelo seu app).

### 5.7 — Banco de Dados (Alterações necessárias)

Adicione as colunas necessárias na tabela `profiles` (ou crie se não existir):

```sql
-- Se a tabela profiles já existe:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;

-- Índice para busca rápida por subscription
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_sub 
ON profiles(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Se precisar criar a tabela profiles do zero:
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (obrigatório)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## 6. Página de Preços (UI)

### Estrutura recomendada

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Escolha o plano ideal para seus estudos                 │
│                                                          │
│  [Mensal]  [Semestral ✨]  [Anual]    ← Toggle           │
│                                                          │
│  ┌─────────────────┐   ┌─────────────────────────────┐   │
│  │  Free            │   │  Pro                   ⭐   │   │
│  │                  │   │                             │   │
│  │  R$ 0            │   │  R$ 29,90/mês              │   │
│  │                  │   │  ou R$ 149,90/semestre      │   │
│  │  3 fontes/mês    │   │  ou R$ 249,90/ano          │   │
│  │  15 flashcards   │   │                             │   │
│  │  10 questões     │   │  ✅ Fontes ilimitadas       │   │
│  │  ❌ Mapas mentais │   │  ✅ 50 flashcards          │   │
│  │  ❌ Áudio         │   │  ✅ 30 questões            │   │
│  │                  │   │  ✅ Mapas mentais           │   │
│  │  [Começar Grátis]│   │  ✅ Transcrição de áudio   │   │
│  │                  │   │  ✅ Desempenho completo     │   │
│  │                  │   │  ✅ Pastas ilimitadas       │   │
│  │                  │   │                             │   │
│  │                  │   │  [Assinar Pro]              │   │
│  └─────────────────┘   └─────────────────────────────┘   │
│                                                          │
│  💳 Pagamento seguro via Stripe                          │
│  🔒 Cancele quando quiser                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Dicas de conversão:
- O card Pro deve ter borda destacada (ex: `border-blue-500`) e um badge "Mais Popular" ou "Recomendado".
- O toggle de período deve destacar visualmente o melhor custo-benefício (semestral com badge "Melhor para estudantes").
- Mostrar o preço "de" riscado quando em plano semestral/anual (ex: ~~R$29,90/mês~~ → R$24,98/mês).
- Garantia: "7 dias para testar. Não gostou? Devolvemos seu dinheiro." (Isso aumenta conversão significativamente).

---

## 7. Segurança e Boas Práticas com Stripe

### O que NUNCA fazer:
- ❌ Nunca salvar dados de cartão no seu banco. O Stripe cuida disso.
- ❌ Nunca confiar no frontend para verificar o plano. SEMPRE cheque no backend.
- ❌ Nunca ignorar falhas de webhook. Configure retry e alertas.
- ❌ Nunca commitar a `STRIPE_SECRET_KEY` no Git.

### O que SEMPRE fazer:
- ✅ Verificar a assinatura do webhook (`stripe.webhooks.constructEvent`).
- ✅ Usar o modo de teste (`sk_test_`) durante todo o desenvolvimento.
- ✅ Testar o fluxo completo: cadastro → free → upgrade → uso → cancelamento → downgrade.
- ✅ Monitorar o Stripe Dashboard regularmente (chargebacks, disputas).

### Testando webhooks localmente:

```bash
# Instale o Stripe CLI
# https://stripe.com/docs/stripe-cli

stripe listen --forward-to localhost:3000/api/stripe/webhook
# Isso retorna um webhook signing secret temporário (whsec_xxx)
# Use ele no .env.local durante o desenvolvimento
```

---

## 8. Métricas de Negócio para Acompanhar

Depois do lançamento, monitore semanalmente:

| Métrica | O que significa | Meta inicial |
|---|---|---|
| **MRR** (Monthly Recurring Revenue) | Receita mensal recorrente | — |
| **Conversão Free → Pro** | % de usuários free que viram Pro | 3-8% |
| **Churn mensal** | % de Pro que cancelam por mês | <5% |
| **LTV** (Lifetime Value) | Quanto um usuário gasta no total | >R$150 |
| **CAC** (Custo de Aquisição) | Quanto custa trazer 1 usuário | <R$30 |
| **ARPU** (Average Revenue Per User) | Receita média por usuário | >R$15/mês |
| **Trial-to-Paid** (se usar trial) | % que converte após 7 dias grátis | >20% |

### Fórmulas importantes:

```
MRR = (Assinantes mensais × R$29,90) + (Semestrais × R$24,98) + (Anuais × R$20,83)

LTV = ARPU ÷ Churn Rate
     Ex: R$25/mês ÷ 5% = R$500 de lifetime value

Payback Period = CAC ÷ ARPU
     Ex: R$30 ÷ R$25/mês = 1.2 meses para recuperar o investimento
```

---

## 9. Roadmap de Implementação

### Fase 1 — MVP de Pagamentos (1-2 semanas)
```
[ ] Criar conta Stripe e configurar produtos/preços
[ ] Adicionar colunas de billing na tabela profiles
[ ] Implementar /api/stripe/checkout (criação de sessão)
[ ] Implementar /api/stripe/webhook (receber eventos)
[ ] Criar sistema de verificação de plano (plans.ts)
[ ] Aplicar limites nas rotas de geração existentes
[ ] Criar página de preços (/pricing)
[ ] Testar fluxo completo no modo teste
```

### Fase 2 — Polimento (1 semana)
```
[ ] Portal do cliente (gerenciar assinatura)
[ ] UI de upgrade no dashboard (banner "Você atingiu seu limite")
[ ] Emails de boas-vindas ao Pro (via Stripe ou Resend)
[ ] Testar com cartões de teste do Stripe
[ ] Testar cenários de falha (cartão recusado, expirado)
[ ] Webhook funcionando em produção (deploy + verificar)
```

### Fase 3 — Go Live
```
[ ] Mudar para API keys de produção (sk_live_)
[ ] Atualizar webhook URL para produção
[ ] Aceitar primeiro pagamento real
[ ] Monitorar dashboard do Stripe nos primeiros dias
```

---

## 10. Considerações Finais

### PIX e Boleto no Stripe
O Stripe Brasil suporta PIX e Boleto. Para habilitar:
- Stripe Dashboard → Settings → Payment Methods → Ative "Pix" e "Boleto"
- No checkout session, adicione: `payment_method_types: ['card', 'pix', 'boleto']`
- **Atenção com boleto**: Demora 1-3 dias para compensar. O usuário pode usar o app antes de pagar? Decida se libera acesso imediato ou só após confirmação.

### Nota Fiscal
- Se você está faturando como pessoa física, não precisa emitir NF para valores pequenos (até o teto do MEI).
- Se for empresa: Use um serviço como **NFe.io** ou **Enotas** integrado com o webhook do Stripe para emissão automática.

### Trial Gratuito (Recomendação)
- Considere oferecer 7 dias de trial do Pro sem pedir cartão. Isso aumenta muito a conversão.
- O Stripe suporta isso nativamente (`trial_period_days: 7` no checkout session).
- Após 7 dias, se o usuário não adicionou cartão, volta automaticamente para Free.

---

> **Este documento deve ser revisado e atualizado conforme o produto evolui e dados reais de uso se acumulam.**
