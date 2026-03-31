'use client'

import Link from 'next/link'
import { ChevronLeft, Copy, Check, Instagram, Sparkles, Palette, Type, BookOpen, Zap, Brain, Target, TrendingUp, Users, MessageCircle } from 'lucide-react'
import { useState } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-zinc-400" />}
    </button>
  )
}

function ColorSwatch({ name, hex, variable, usage }: { name: string; hex: string; variable: string; usage: string }) {
  return (
    <div className="group">
      <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
        <div className="h-28 w-full" style={{ backgroundColor: hex }} />
        <div className="p-4 bg-white dark:bg-zinc-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[var(--foreground)]">{name}</span>
            <CopyButton text={hex} />
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-400">{hex}</code>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">{variable}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{usage}</p>
        </div>
      </div>
    </div>
  )
}

function PostIdea({ number, title, format, caption, hashtags, visual }: { number: number; title: string; format: string; caption: string; hashtags: string; visual: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
          {String(number).padStart(2, '0')}
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <h4 className="font-bold text-[var(--foreground)]">{title}</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{format}</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{caption}</p>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Visual</p>
            <p className="text-xs text-[var(--muted-foreground)]">{visual}</p>
          </div>
          <p className="text-[11px] text-blue-500 font-medium">{hashtags}</p>
        </div>
      </div>
    </div>
  )
}

export default function VisualIdentityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[var(--muted-foreground)]">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                Axoniq<span className="text-blue-500">.</span> — Identidade Visual
              </h1>
              <p className="text-xs text-[var(--muted-foreground)]">Manual de Marca & Estratégia de Lançamento</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">v1.0 · Março 2026</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">

        {/* ============================== */}
        {/* SEÇÃO 1: ESSÊNCIA DA MARCA     */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">01 · Essência</span>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">A Marca Axoniq</h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
              <strong>Axoniq</strong> é a ponte entre a inteligência artificial e o estudo médico eficiente.
              O nome vem de <em>Axon</em> (a parte do neurônio que transmite sinais), representando
              a transmissão eficiente do conhecimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
              <Target size={24} className="text-blue-500 mb-4" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">Missão</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Empoderar estudantes de medicina a reter mais conhecimento em menos tempo, através de IA e ciência de memorização comprovada.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
              <Sparkles size={24} className="text-blue-500 mb-4" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">Visão</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Ser a ferramenta #1 de estudo com IA para futuros médicos do Brasil e da América Latina.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
              <Brain size={24} className="text-blue-500 mb-4" />
              <h3 className="font-bold text-[var(--foreground)] mb-2">Valores</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Clareza sobre complexidade. Ciência sobre gimmicks. Simplicidade radical.
              </p>
            </div>
          </div>

          {/* Personalidade */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-[var(--foreground)] mb-4">Personalidade da Marca</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Inteligente', 'Confiável', 'Moderna', 'Direta', 'Acessível'].map(trait => (
                <div key={trait} className="text-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--border)]">
                  <span className="text-sm font-bold text-[var(--foreground)]">{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tom de Voz */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-[var(--foreground)] mb-4">Tom de Voz</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <p className="text-sm text-[var(--foreground)]"><strong>SIM:</strong> &quot;Transforme resumos em flashcards em 30 segundos.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <p className="text-sm text-[var(--foreground)]"><strong>NÃO:</strong> &quot;Utilize nossa ferramenta inteligente para otimizar seus estudos.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <p className="text-sm text-[var(--foreground)]"><strong>SIM:</strong> &quot;Esqueceu 70% da aula? Normal. Vem que a gente resolve.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <p className="text-sm text-[var(--foreground)]"><strong>NÃO:</strong> &quot;Com nossa plataforma inovadora, a retenção nunca foi tão fácil.&quot;</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 2: LOGOTIPO              */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">02 · Logotipo</span>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Marca Gráfica</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light */}
            <div className="border border-[var(--border)] rounded-xl p-12 flex items-center justify-center bg-[#FAFAFA]">
              <h2 className="text-5xl font-bold tracking-tight text-[#18181B]">
                Axoniq<span className="text-[#2563EB]">.</span>
              </h2>
            </div>
            {/* Dark */}
            <div className="border border-zinc-800 rounded-xl p-12 flex items-center justify-center bg-[#09090B]">
              <h2 className="text-5xl font-bold tracking-tight text-[#FAFAFA]">
                Axoniq<span className="text-[#3B82F6]">.</span>
              </h2>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-[var(--foreground)] mb-3">Regras de Uso</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>• O ponto azul após "Axoniq" é <strong>obrigatório</strong> e nunca deve mudar de cor.</li>
              <li>• Área de respiro mínima: metade da altura do logotipo em todas as direções.</li>
              <li>• Nunca distorcer, rotacionar ou aplicar efeitos visuais sobre o logo.</li>
              <li>• Usar versão light em fundos claros e versão dark em fundos escuros.</li>
            </ul>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 3: PALETA DE CORES       */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">03 · Cores</span>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Paleta de Cores</h2>
            <p className="text-[var(--muted-foreground)] max-w-xl">
              Swiss Design minimalista. Neutrals dominam, azul aparece como acento cirúrgico.
            </p>
          </div>

          {/* Regra 60-30-10 */}
          <div className="flex gap-0 rounded-xl overflow-hidden h-16 border border-[var(--border)]">
            <div className="flex-[6] bg-[#FAFAFA] flex items-center justify-center text-xs font-bold text-zinc-500">60% Base</div>
            <div className="flex-[3] bg-[#FFFFFF] border-l border-r border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">30% Surface</div>
            <div className="flex-[1] bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white">10%</div>
          </div>

          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-4">Cores Primárias (Light Mode)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Background" hex="#FAFAFA" variable="--background" usage="Fundo principal, tom de papel" />
              <ColorSwatch name="Foreground" hex="#18181B" variable="--foreground" usage="Texto principal, contraste máximo" />
              <ColorSwatch name="Electric Blue" hex="#2563EB" variable="--accent" usage="CTAs, links, destaques (10%)" />
              <ColorSwatch name="Blue 500" hex="#3B82F6" variable="--accent (dark)" usage="Acento no dark mode, seleção de texto" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-4">Cores de Suporte</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Surface" hex="#FFFFFF" variable="--secondary" usage="Cards, modais, componentes" />
              <ColorSwatch name="Muted" hex="#F4F4F5" variable="--muted" usage="Fundos secundários, seções" />
              <ColorSwatch name="Muted Text" hex="#71717A" variable="--muted-foreground" usage="Texto secundário, descrições" />
              <ColorSwatch name="Border" hex="#E4E4E7" variable="--border" usage="Bordas, separadores, linhas" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-4">Cores Dark Mode</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Dark BG" hex="#09090B" variable="--background (dark)" usage="Fundo principal dark" />
              <ColorSwatch name="Dark Surface" hex="#27272A" variable="--secondary (dark)" usage="Cards, elementos elevados" />
              <ColorSwatch name="Dark Text" hex="#A1A1AA" variable="--muted-foreground (dark)" usage="Texto secundário dark" />
              <ColorSwatch name="Dark Border" hex="#27272A" variable="--border (dark)" usage="Bordas no dark mode" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-4">Cores Semânticas (Estado dos Cards)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Vermelho" hex="#EF4444" variable="Errei / Erro" usage="Resposta errada, alertas" />
              <ColorSwatch name="Laranja" hex="#F97316" variable="Difícil / Learning" usage="Dificuldade, em aprendizado" />
              <ColorSwatch name="Verde" hex="#22C55E" variable="Acertei / Review" usage="Resposta correta, revisão" />
              <ColorSwatch name="Esmeralda" hex="#10B981" variable="Dominado / Mastered" usage="Card dominado, sucesso" />
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 4: TIPOGRAFIA            */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">04 · Tipografia</span>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Sistema Tipográfico</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Fonte Principal</span>
              <p className="text-5xl font-bold tracking-tight mt-4 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-sans)' }}>Geist Sans</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-4">
                Geist Sans (by Vercel) é a fonte principal do Axoniq. Usada para títulos, corpo de texto e UI.
                Limpa, moderna e de alta legibilidade.
              </p>
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <code className="text-xs text-zinc-500 font-mono">font-family: var(--font-geist-sans), system-ui, sans-serif;</code>
              </div>
            </div>
            <div className="p-8 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Fonte Mono</span>
              <p className="text-5xl font-bold tracking-tight mt-4 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-mono)' }}>Geist Mono</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-4">
                Geist Mono para código, dados técnicos, snippets e elementos que precisam de fonte monoespaçada.
              </p>
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <code className="text-xs text-zinc-500 font-mono">font-family: var(--font-geist-mono), monospace;</code>
              </div>
            </div>
          </div>

          {/* Escala */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 space-y-6">
            <h3 className="font-bold text-[var(--foreground)]">Escala Tipográfica</h3>
            <div className="space-y-4">
              <div className="flex items-baseline gap-6 border-b border-[var(--border)] pb-4">
                <code className="text-[10px] text-zinc-400 font-mono w-20 shrink-0">text-5xl</code>
                <p className="text-5xl font-bold tracking-tight text-[var(--foreground)]">Display</p>
                <span className="text-xs text-[var(--muted-foreground)]">3rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-[var(--border)] pb-4">
                <code className="text-[10px] text-zinc-400 font-mono w-20 shrink-0">text-3xl</code>
                <p className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Heading 1</p>
                <span className="text-xs text-[var(--muted-foreground)]">1.875rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-[var(--border)] pb-4">
                <code className="text-[10px] text-zinc-400 font-mono w-20 shrink-0">text-xl</code>
                <p className="text-xl font-bold text-[var(--foreground)]">Heading 2</p>
                <span className="text-xs text-[var(--muted-foreground)]">1.25rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-[var(--border)] pb-4">
                <code className="text-[10px] text-zinc-400 font-mono w-20 shrink-0">text-base</code>
                <p className="text-base text-[var(--foreground)]">Corpo de texto padrão para leitura confortável.</p>
                <span className="text-xs text-[var(--muted-foreground)]">1rem / 400</span>
              </div>
              <div className="flex items-baseline gap-6">
                <code className="text-[10px] text-zinc-400 font-mono w-20 shrink-0">text-sm</code>
                <p className="text-sm text-[var(--muted-foreground)]">Texto auxiliar, descrições, labels, metadados</p>
                <span className="text-xs text-[var(--muted-foreground)]">0.875rem / 400</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 5: COMPONENTES VISUAIS   */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">05 · Componentes</span>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Linguagem Visual</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 space-y-3">
              <h3 className="font-bold text-[var(--foreground)]">Bordas</h3>
              <div className="space-y-3">
                <div className="h-12 rounded-lg border-2 border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">radius: 8px (lg)</div>
                <div className="h-12 rounded-xl border-2 border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">radius: 12px (xl)</div>
                <div className="h-12 rounded-2xl border-2 border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">radius: 16px (2xl)</div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 space-y-3">
              <h3 className="font-bold text-[var(--foreground)]">Sombras</h3>
              <div className="space-y-3">
                <div className="h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-xs text-[var(--muted-foreground)]">shadow-sm</div>
                <div className="h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-xs text-[var(--muted-foreground)]">shadow-md</div>
                <div className="h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center text-xs text-[var(--muted-foreground)]">shadow-xl</div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 space-y-3">
              <h3 className="font-bold text-[var(--foreground)]">Botões</h3>
              <div className="space-y-3">
                <button className="w-full h-12 rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium text-sm">Primário</button>
                <button className="w-full h-12 rounded-lg bg-blue-500 text-white font-medium text-sm">Ação Principal</button>
                <button className="w-full h-12 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-medium text-sm">Secundário</button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 6: IDEIAS PARA INSTAGRAM */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Instagram size={28} className="text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">06 · Estratégia Instagram</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Estratégia de Conteúdo</h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
              3 posts fixados na vitrine do perfil + 7 posts de conteúdo regular para construir autoridade e converter seguidores.
            </p>
          </div>

          {/* Pilares de Conteúdo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: <TrendingUp size={20} />, title: 'Educacional', desc: 'Técnicas de estudo, ciência da memória', pct: '40%' },
              { icon: <Sparkles size={20} />, title: 'Produto', desc: 'Preview da ferramenta, antes/depois', pct: '25%' },
              { icon: <Users size={20} />, title: 'Comunidade', desc: 'Dia-a-dia do estudante de medicina', pct: '20%' },
              { icon: <MessageCircle size={20} />, title: 'Engajamento', desc: 'Enquetes, checklists, perguntas', pct: '15%' },
            ].map(pillar => (
              <div key={pillar.title} className="p-5 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-blue-500 mb-3">
                  {pillar.icon}
                  <span className="font-bold text-sm text-[var(--foreground)]">{pillar.title}</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">{pillar.desc}</p>
                <p className="text-2xl font-bold text-blue-500 mt-3">{pillar.pct}</p>
              </div>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">

            <h3 className="font-bold text-[var(--foreground)] text-lg mt-6">📌 Vitrine do Perfil (3 Posts Fixados)</h3>

            <PostIdea
              number={1}
              title="O Problema — Curva do Esquecimento"
              format="Carrossel 5 slides · ✅ Já feito"
              caption="Slide 1: 'Você estuda 6h e esquece 70% em 24h.' Slide 2: Gráfico da Curva do Esquecimento. Slide 3: 'E se existisse uma forma de inverter isso?' Slide 4: 'Repetição Espaçada + IA = Retenção de 90%+'. Slide 5: Logo Axoniq."
              visual="Fundo branco, texto preto bold, gráfico em azul elétrico. Minimalista e data-driven."
              hashtags="#estudomedicina #residenciamedica #flashcards #medstudent #axoniq"
            />

            <PostIdea
              number={2}
              title="O Produto em Ação"
              format="Reel 45–60s"
              caption="Montagem completa: Logo animado → Dashboard → Upload PDF → Flashcards → Sessão de estudo → Quiz com score → Mapa Mental → 'Axoniq. Estude com inteligência.'"
              visual="Screen recording real. Transições rápidas. Música energética sem vocal. Tela final preta com logo."
              hashtags="#axoniq #medtech #flashcardsIA #estudomedicina #residenciamedica"
            />

            <PostIdea
              number={3}
              title="A Marca — Logo e Visão"
              format="Carrossel 3 slides"
              caption="Slide 1: Logo Axoniq. centralizado. Slide 2: 'Axon = neurônio que transmite impulsos. Axoniq = plataforma que transmite conhecimento.' Slide 3: 'Tornar o estudo médico mais eficiente, acessível e baseado em ciência.'"
              visual="Slide 1: fundo branco, logo grande. Slide 2: tipografia editorial, ilustração de axônio. Slide 3: fundo preto, texto branco."
              hashtags="#axoniq #branding #identidadevisual #medtech #startup #medicina"
            />

            <h3 className="font-bold text-[var(--foreground)] text-lg mt-8">📲 Posts de Conteúdo (Feed Regular)</h3>

            <PostIdea
              number={4}
              title="Tutorial Rápido"
              format="Reel 60s"
              caption="'Como transformar QUALQUER PDF em flashcards em 30 segundos'. Passo a passo com screen recording do app."
              visual="Screencast real com texto overlay branco. Setas e highlights em azul. Dark mode. Sem narração."
              hashtags="#tutorial #flashcards #dica #residencia #medicina #passo_a_passo"
            />

            <PostIdea
              number={5}
              title="Colar Texto"
              format="Reel 20s"
              caption="'Sem PDF? Sem problema.' Demo rápido: Cola texto de aula → 15 flashcards gerados. 'Funciona com qualquer texto.'"
              visual="Screen recording focado. Zoom no textarea. Resultado rápido. CTA final com logo."
              hashtags="#hacksdeestudo #flashcards #medicina #dica #axoniq"
            />

            <PostIdea
              number={6}
              title="3 Técnicas de Estudo"
              format="Post Estático"
              caption="'3 técnicas que REALMENTE funcionam para provas de residência: 1) Repetição Espaçada (SM-2). 2) Active Recall (Flashcards). 3) Interleaving. A maioria só relê. Seja diferente.'"
              visual="Fundo branco. Lista numerada com ícones azuis. Logo Axoniq no footer. Clean e informativo."
              hashtags="#dicadeestudo #residencia #medicina #produtividade #activerecall #sm2"
            />

            <PostIdea
              number={7}
              title="Ciência por Trás — SM-2"
              format="Carrossel 4 slides"
              caption="Slide 1: 'O Algoritmo SM-2: Como funciona?' Slide 2: Diagrama do ciclo. Slide 3: 'Usado por +10M de estudantes'. Slide 4: 'Agora no navegador. Axoniq.'"
              visual="Design editorial. Flowchart clean com 3 caminhos coloridos em azul sobre fundo branco."
              hashtags="#sm2 #spacedrepetition #neurociencia #estudo #axoniq #anki"
            />

            <PostIdea
              number={8}
              title="O Ciclo do Estudo Eficiente"
              format="Carrossel 4 slides"
              caption="Slide 1: '4 etapas que a maioria ignora.' Slide 2: Diagrama circular: Absorver → Processar (flashcards) → Testar (quiz) → Conectar (mapa mental). Slide 3: 'A maioria para na etapa 1. Reler = loop infinito.' Slide 4: 'O Axoniq cobre etapas 2-4.'"
              visual="Infográfico circular em azul com ícones. Slide 3: fundo preto com 'etapa 1' em vermelho."
              hashtags="#ciclodeestudo #produtividade #medicina #residencia #axoniq #neurociencia"
            />

            <PostIdea
              number={9}
              title="Checklist: Você Estuda Certo?"
              format="Post Estático"
              caption="'Checklist: Você estuda do jeito certo?' ☐ Usa repetição espaçada ☐ Pratica active recall ☐ Testa com quizzes antes da prova ☐ Conecta conceitos em mapas mentais ☐ Automatiza material com IA. 'Marcou menos de 3? O Axoniq resolve.'"
              visual="Fundo branco. Checkboxes visuais vazios. Tipografia clean. Logo Axoniq no canto inferior."
              hashtags="#checklist #estudomedicina #residencia #produtividade #axoniq #studytips"
            />

            <PostIdea
              number={10}
              title="Dados que Assustam"
              format="Carrossel 5 slides"
              caption="Slide 1: '5 dados sobre estudo que vão te incomodar.' Slide 2: '70% esquecido em 24h.' Slide 3: '84% acham que reler funciona. Não funciona.' Slide 4: '200% mais retenção com repetição espaçada.' Slide 5: 'E se existisse um app que usasse tudo isso? Axoniq.'"
              visual="Slide 1: fundo preto. Slides 2-4: números gigantes em vermelho, laranja e verde. Slide 5: fundo preto com logo."
              hashtags="#dados #neurociencia #estudomedicina #retencao #axoniq #ciencia"
            />
          </div>

          {/* Diretrizes visuais para posts */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-[var(--foreground)] mb-4">📐 Diretrizes Visuais para Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[var(--muted-foreground)]">
              <div className="space-y-2">
                <p><strong className="text-[var(--foreground)]">Cores:</strong> Fundo branco (#FAFAFA) ou preto (#09090B). Acento azul (#2563EB) nos destaques.</p>
                <p><strong className="text-[var(--foreground)]">Tipografia:</strong> Usar Inter ou Geist Sans nos designs. Bold para títulos, Regular para corpo.</p>
                <p><strong className="text-[var(--foreground)]">Logo:</strong> Sempre presente no canto inferior direito, discreto. Nunca menor que 40px.</p>
              </div>
              <div className="space-y-2">
                <p><strong className="text-[var(--foreground)]">Formato:</strong> Posts quadrados (1080×1080). Reels verticais (1080×1920).</p>
                <p><strong className="text-[var(--foreground)]">Proibido:</strong> Gradientes chamativos, neon, emojis excessivos, fontes cursivas.</p>
                <p><strong className="text-[var(--foreground)]">Estilo:</strong> Minimalista, data-driven, editorial médico. Inspiração: Apple, Linear, Notion.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-8 pb-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            © 2026 Axoniq. Manual de Identidade Visual v1.0
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Este documento é confidencial e de uso interno.
          </p>
        </footer>

      </main>
    </div>
  )
}
