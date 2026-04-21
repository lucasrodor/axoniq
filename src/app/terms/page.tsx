'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'

export default function TermsPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">Termos de Uso</h1>
          <p className="text-zinc-500 text-lg">Última atualização: 21 de Abril de 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Axoniq, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">2. Descrição do Serviço</h2>
            <p>
              O Axoniq é uma plataforma de tecnologia educacional que utiliza inteligência artificial para auxiliar estudantes e profissionais da saúde na criação de materiais de estudo, como flashcards, quizzes e mapas mentais, a partir de arquivos e textos fornecidos pelo próprio usuário.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">3. Uso da Inteligência Artificial</h2>
            <p>
              O usuário compreende que o Axoniq utiliza modelos de linguagem de grande escala (LLMs) para processar informações. Embora utilizemos tecnologias de ponta, não garantimos a precisão absoluta do conteúdo gerado pela IA. É responsabilidade exclusiva do usuário revisar e validar clinicamente qualquer informação gerada pela plataforma antes de utilizá-la para fins acadêmicos ou profissionais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">4. Propriedade Intelectual</h2>
            <p>
              O conteúdo original fornecido pelo usuário permanece como propriedade dele. No entanto, ao utilizar a plataforma, o usuário concede ao Axoniq uma licença limitada para processar esses dados para a finalidade única de entregar os serviços solicitados.
            </p>
            <p>
              A interface, algoritmos, logotipos e design do Axoniq são propriedade exclusiva da nossa plataforma e protegidos pelas leis de propriedade intelectual brasileiras e internacionais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">5. Responsabilidades do Usuário</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações precisas durante o cadastro.</li>
              <li>Não utilizar a plataforma para processar conteúdo ilegal ou protegido por direitos autorais sem permissão.</li>
              <li>Manter a segurança de sua conta e senhas.</li>
              <li>Não tentar realizar engenharia reversa ou ataques de negação de serviço contra a plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">6. Limitação de Responsabilidade</h2>
            <p>
              O Axoniq não se responsabiliza por decisões médicas, diagnósticos ou condutas terapêuticas baseadas no conteúdo gerado pela ferramenta. Nossa plataforma possui caráter puramente educacional e de apoio ao estudo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">7. Modificações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários via e-mail ou aviso na plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-zinc-100">8. Foro e Jurisdição</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca da sede da empresa.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-sm">
            Dúvidas sobre os termos? Entre em contato: <a href="mailto:suporte@axoniq.com" className="text-blue-500 hover:underline">suporte@axoniq.com</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
