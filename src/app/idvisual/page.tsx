'use client'

import Link from 'next/link'
import { ChevronLeft, Copy, Check, Sparkles, Brain, Target } from 'lucide-react'
import { useState } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-zinc-500" />}
    </button>
  )
}

function ColorSwatch({ name, hex, variable, usage }: { name: string; hex: string; variable: string; usage: string }) {
  return (
    <div className="group">
      <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-sm hover:shadow-md hover:shadow-blue-500/5 transition-shadow">
        <div className="h-28 w-full" style={{ backgroundColor: hex }} />
        <div className="p-4 bg-zinc-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-zinc-100">{name}</span>
            <CopyButton text={hex} />
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-zinc-800 px-2 py-0.5 rounded font-mono text-zinc-400">{hex}</code>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{variable}</p>
          <p className="text-xs text-zinc-500">{usage}</p>
        </div>
      </div>
    </div>
  )
}

export default function VisualIdentityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Axoniq<span className="text-blue-500">.</span> — Identidade Visual
              </h1>
              <p className="text-xs text-zinc-500">Manual de Marca & Estratégia de Lançamento</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-full">v1.0 · Março 2026</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">

        {/* ============================== */}
        {/* SEÇÃO 1: ESSÊNCIA DA MARCA     */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">01 · Essência</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-100">A Marca Axoniq</h2>
            <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
              <strong className="text-zinc-200">Axoniq</strong> é a ponte entre a inteligência artificial e o estudo médico eficiente.
              O nome vem de <em>Axon</em> (a parte do neurônio que transmite sinais), representando
              a transmissão eficiente do conhecimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
              <Target size={24} className="text-blue-400 mb-4" />
              <h3 className="font-bold text-zinc-100 mb-2">Missão</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Empoderar estudantes de medicina a reter mais conhecimento em menos tempo, através de IA e ciência de memorização comprovada.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
              <Sparkles size={24} className="text-blue-400 mb-4" />
              <h3 className="font-bold text-zinc-100 mb-2">Visão</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ser a ferramenta #1 de estudo com IA para futuros médicos do Brasil e da América Latina.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
              <Brain size={24} className="text-blue-400 mb-4" />
              <h3 className="font-bold text-zinc-100 mb-2">Valores</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Clareza sobre complexidade. Ciência sobre gimmicks. Simplicidade radical.
              </p>
            </div>
          </div>

          {/* Personalidade */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="font-bold text-zinc-100 mb-4">Personalidade da Marca</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Inteligente', 'Confiável', 'Moderna', 'Direta', 'Acessível'].map(trait => (
                <div key={trait} className="text-center p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                  <span className="text-sm font-bold text-zinc-200">{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tom de Voz */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-bold text-zinc-100 mb-4">Tom de Voz</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <p className="text-sm text-zinc-300"><strong>SIM:</strong> &quot;Transforme resumos em flashcards em 30 segundos.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <p className="text-sm text-zinc-300"><strong>NÃO:</strong> &quot;Utilize nossa ferramenta inteligente para otimizar seus estudos.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <p className="text-sm text-zinc-300"><strong>SIM:</strong> &quot;Esqueceu 70% da aula? Normal. Vem que a gente resolve.&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <p className="text-sm text-zinc-300"><strong>NÃO:</strong> &quot;Com nossa plataforma inovadora, a retenção nunca foi tão fácil.&quot;</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 2: LOGOTIPO              */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">02 · Logotipo</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-100">Marca Gráfica</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light */}
            <div className="border border-zinc-800 rounded-xl p-12 flex items-center justify-center bg-[#FAFAFA]">
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

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="font-bold text-zinc-100 mb-3">Regras de Uso</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• O ponto azul após &quot;Axoniq&quot; é <strong className="text-zinc-200">obrigatório</strong> e nunca deve mudar de cor.</li>
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
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">03 · Cores</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-100">Paleta de Cores</h2>
            <p className="text-zinc-400 max-w-xl">
              Swiss Design minimalista. Neutrals dominam, azul aparece como acento cirúrgico.
            </p>
          </div>

          {/* Regra 60-30-10 */}
          <div className="flex gap-0 rounded-xl overflow-hidden h-16 border border-zinc-800">
            <div className="flex-[6] bg-[#09090B] flex items-center justify-center text-xs font-bold text-zinc-500">60% Base</div>
            <div className="flex-[3] bg-[#27272A] border-l border-r border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">30% Surface</div>
            <div className="flex-[1] bg-[#3B82F6] flex items-center justify-center text-xs font-bold text-white">10%</div>
          </div>

          <div>
            <h3 className="font-bold text-zinc-100 mb-4">Cores Primárias</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Background" hex="#09090B" variable="--background" usage="Fundo principal, base escura" />
              <ColorSwatch name="Foreground" hex="#FAFAFA" variable="--foreground" usage="Texto principal, contraste máximo" />
              <ColorSwatch name="Blue 500" hex="#3B82F6" variable="--accent" usage="CTAs, links, destaques (10%)" />
              <ColorSwatch name="Electric Blue" hex="#2563EB" variable="--accent (hover)" usage="Acento hover, seleção de texto" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-zinc-100 mb-4">Cores de Suporte</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Surface" hex="#27272A" variable="--secondary" usage="Cards, modais, componentes" />
              <ColorSwatch name="Muted" hex="#27272A" variable="--muted" usage="Fundos secundários, seções" />
              <ColorSwatch name="Muted Text" hex="#A1A1AA" variable="--muted-foreground" usage="Texto secundário, descrições" />
              <ColorSwatch name="Border" hex="#27272A" variable="--border" usage="Bordas, separadores, linhas" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-zinc-100 mb-4">Cores Light Mode (Landing / ID Visual)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Light BG" hex="#FAFAFA" variable="--background (light)" usage="Fundo principal light" />
              <ColorSwatch name="Light Surface" hex="#FFFFFF" variable="--secondary (light)" usage="Cards, elementos elevados" />
              <ColorSwatch name="Light Text" hex="#71717A" variable="--muted-foreground (light)" usage="Texto secundário light" />
              <ColorSwatch name="Light Border" hex="#E4E4E7" variable="--border (light)" usage="Bordas no light mode" />
            </div>
          </div>

          <div>
            <h3 className="font-bold text-zinc-100 mb-4">Cores Semânticas (Estado dos Cards)</h3>
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
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">04 · Tipografia</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-100">Sistema Tipográfico</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Fonte Principal</span>
              <p className="text-5xl font-bold tracking-tight mt-4 text-zinc-100" style={{ fontFamily: 'var(--font-sans)' }}>Geist Sans</p>
              <p className="text-sm text-zinc-400 mt-4">
                Geist Sans (by Vercel) é a fonte principal do Axoniq. Usada para títulos, corpo de texto e UI.
                Limpa, moderna e de alta legibilidade.
              </p>
              <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
                <code className="text-xs text-zinc-400 font-mono">font-family: var(--font-geist-sans), system-ui, sans-serif;</code>
              </div>
            </div>
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Fonte Mono</span>
              <p className="text-5xl font-bold tracking-tight mt-4 text-zinc-100" style={{ fontFamily: 'var(--font-mono)' }}>Geist Mono</p>
              <p className="text-sm text-zinc-400 mt-4">
                Geist Mono para código, dados técnicos, snippets e elementos que precisam de fonte monoespaçada.
              </p>
              <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
                <code className="text-xs text-zinc-400 font-mono">font-family: var(--font-geist-mono), monospace;</code>
              </div>
            </div>
          </div>

          {/* Escala */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 space-y-6">
            <h3 className="font-bold text-zinc-100">Escala Tipográfica</h3>
            <div className="space-y-4">
              <div className="flex items-baseline gap-6 border-b border-zinc-800 pb-4">
                <code className="text-[10px] text-zinc-500 font-mono w-20 shrink-0">text-5xl</code>
                <p className="text-5xl font-bold tracking-tight text-zinc-100">Display</p>
                <span className="text-xs text-zinc-500">3rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-zinc-800 pb-4">
                <code className="text-[10px] text-zinc-500 font-mono w-20 shrink-0">text-3xl</code>
                <p className="text-3xl font-bold tracking-tight text-zinc-100">Heading 1</p>
                <span className="text-xs text-zinc-500">1.875rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-zinc-800 pb-4">
                <code className="text-[10px] text-zinc-500 font-mono w-20 shrink-0">text-xl</code>
                <p className="text-xl font-bold text-zinc-100">Heading 2</p>
                <span className="text-xs text-zinc-500">1.25rem / 700</span>
              </div>
              <div className="flex items-baseline gap-6 border-b border-zinc-800 pb-4">
                <code className="text-[10px] text-zinc-500 font-mono w-20 shrink-0">text-base</code>
                <p className="text-base text-zinc-300">Corpo de texto padrão para leitura confortável.</p>
                <span className="text-xs text-zinc-500">1rem / 400</span>
              </div>
              <div className="flex items-baseline gap-6">
                <code className="text-[10px] text-zinc-500 font-mono w-20 shrink-0">text-sm</code>
                <p className="text-sm text-zinc-400">Texto auxiliar, descrições, labels, metadados</p>
                <span className="text-xs text-zinc-500">0.875rem / 400</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== */}
        {/* SEÇÃO 5: COMPONENTES VISUAIS   */}
        {/* ============================== */}
        <section className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">05 · Componentes</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-100">Linguagem Visual</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 space-y-3">
              <h3 className="font-bold text-zinc-100">Bordas</h3>
              <div className="space-y-3">
                <div className="h-12 rounded-lg border-2 border-zinc-700 flex items-center justify-center text-xs text-zinc-400">radius: 8px (lg)</div>
                <div className="h-12 rounded-xl border-2 border-zinc-700 flex items-center justify-center text-xs text-zinc-400">radius: 12px (xl)</div>
                <div className="h-12 rounded-2xl border-2 border-zinc-700 flex items-center justify-center text-xs text-zinc-400">radius: 16px (2xl)</div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 space-y-3">
              <h3 className="font-bold text-zinc-100">Sombras</h3>
              <div className="space-y-3">
                <div className="h-12 rounded-xl bg-zinc-800 shadow-sm flex items-center justify-center text-xs text-zinc-400">shadow-sm</div>
                <div className="h-12 rounded-xl bg-zinc-800 shadow-md flex items-center justify-center text-xs text-zinc-400">shadow-md</div>
                <div className="h-12 rounded-xl bg-zinc-800 shadow-xl flex items-center justify-center text-xs text-zinc-400">shadow-xl</div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900 space-y-3">
              <h3 className="font-bold text-zinc-100">Botões</h3>
              <div className="space-y-3">
                <button className="w-full h-12 rounded-lg bg-zinc-100 text-zinc-900 font-medium text-sm hover:bg-white transition-colors">Primário</button>
                <button className="w-full h-12 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-400 transition-colors">Ação Principal</button>
                <button className="w-full h-12 rounded-lg border border-zinc-700 text-zinc-300 font-medium text-sm hover:bg-zinc-800 transition-colors">Secundário</button>
              </div>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-8 pb-12 text-center">
          <p className="text-sm text-zinc-500">
            © 2026 Axoniq. Manual de Identidade Visual v1.0
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Este documento é confidencial e de uso interno.
          </p>
        </footer>

      </main>
    </div>
  )
}
