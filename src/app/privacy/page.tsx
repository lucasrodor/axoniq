'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors group">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/AxonIQ.png" alt="AxonIQ" width={100} height={24} className="h-6 w-auto object-contain" />
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">Política de Privacidade</h1>
          <p className="text-zinc-500 text-lg">Última atualização: 21 de Abril de 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">1. Compromisso com a Privacidade</h2>
            <p>
              O Axoniq valoriza a sua privacidade e se compromete a proteger seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD). Esta política descreve como coletamos, usamos e protegemos suas informações.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">2. Informações que Coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail e informações de login.</li>
              <li><strong>Conteúdo de Usuário:</strong> Arquivos (PDF, imagens, textos) que você envia para processamento pela IA.</li>
              <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a plataforma (flashcards estudados, acertos/erros).</li>
              <li><strong>Cookies e Metadados:</strong> Endereço IP, tipo de navegador e identificadores de dispositivos para fins de segurança e telemetria básica.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">3. Como Usamos Seus Dados</h2>
            <p>
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestar os serviços de extração e geração de materiais por IA.</li>
              <li>Personalizar seu cronograma de estudos via algoritmo de repetição espaçada.</li>
              <li>Garantir a segurança da sua conta e evitar fraudes.</li>
              <li>Enviar comunicações importantes sobre a plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">4. Compartilhamento de Dados</h2>
            <p>
              O Axoniq não vende seus dados pessoais. Compartilhamos informações apenas com parceiros essenciais para o funcionamento da plataforma:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Para armazenamento seguro de banco de dados e autenticação.</li>
              <li><strong>OpenAI:</strong> Para o processamento de textos e geração de IA (os dados enviados à OpenAI são anonimizados sempre que possível e protegidos por contratos empresariais de privacidade).</li>
              <li><strong>Resend:</strong> Para o envio de e-mails transacionais.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, incluindo criptografia de dados em trânsito e em repouso, além de rigorosos controles de acesso via RLS (Row Level Security) no Supabase.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">6. Seus Direitos (LGPD)</h2>
            <p>
              Você tem o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirmar a existência do tratamento de seus dados.</li>
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou inexatos.</li>
              <li>Solicitar a exclusão definitiva de seus dados da nossa plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política ou até que você solicite a exclusão de sua conta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">8. Alterações nesta Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. A versão mais recente sempre estará disponível nesta página com a respectiva data de atualização.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-sm">
            Para exercer seus direitos de privacidade, entre em contato: <a href="mailto:privacidade@axoniq.com" className="text-blue-500 hover:underline">privacidade@axoniq.com</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
