# PRD – "MedMind" – Plataforma de flashcards para estudantes de Medicina 

## Visão geral 

### Objetivo 

Criar uma plataforma web que gere flashcards inteligentes a partir de artigos, resumos ou aulas de medicina enviados pelo usuário. A plataforma deve aplicar técnicas de active recall (perguntas e respostas), repetição espaçada e análise de desempenho para ajudar estudantes de medicina a memorizar conteúdos complexos de forma eficiente. 

### Problema 

Estudantes de medicina precisam rever grandes quantidades de informação e muitas vezes não sabem o melhor momento de revisar. O método tradicional de reler textos não garante retenção de longo prazo e é pouco eficiente. Flashcards combinados com revisão espaçada são uma solução reconhecida: a revisão espaçada permite revisar conteúdos em intervalos crescentes, como 1 dia, 7 dias e 30 dias após o estudo inicial . Além disso, flashcards tornam o estudo mais interativo e personalizado .

## Público‑alvo 

Estudantes de medicina de graduação ou residência. Professores ou monitores que desejam criar e distribuir flashcards para seus alunos. 

##  Principais requisitos e funcionalidades 

### Essenciais (MVP) 

1. **Autenticação e conta do usuário** 

    - Página de login e cadastro com e‑mail/senha (usar Supabase Auth) ou login social. 
    - Gerenciamento de sessão e recuperação de senha. 

2. **Upload de documentos** 

    - Suportar PDF, Word ou texto bruto.
    - Extrair texto do documento e armazenar no banco de dados. 
    - Validar tamanho máximo por plano. 

3. **Geração automática de flashcards**  

    - Implementar pipeline que envia o texto para uma API de modelo de linguagem (OpenAI ou Anthropic) para gerar pares pergunta/resposta. Dividir o texto em trechos e gerar 10–30 flashcards por documento conforme preferência do usuário. 
    - Armazenar flashcards com nível de dificuldade e referência ao parágrafo original. 
    - O usuário deve poder pré‑visualizar os flashcards antes de começar a revisão. 

4. **Interface de estudo (Deck de flashcards)** 
    - Mostrar pergunta e permitir revelar a resposta. O usuário marca se acertou ou errou. 
    - A cada resposta, registrar o resultado e calcular a próxima data de revisão usando uma sequência simples de revisão espaçada: 1º dia, 7 dias e 30 dias . O algoritmo pode usar o sistema Leitner, onde cartões errados voltam à caixa anterior e são revisados com mais frequência.
    - Limitar a sessão a uma faixa escolhida pelo usuário (p.ex. 10–15, 15–20 ou até 30 cartões) para evitar sobrecarga. 

5. **Painel do usuário / histórico de estudos** 

    - Lista de documentos enviados, com status de processamento. 
    - Agenda de revisões: mostrar “revisões pendentes hoje” e permitir iniciar a sessão de revisão.
    - Estatísticas simples de desempenho: acertos, erros, tempo médio de resposta e tópicos com maior taxa de erro. Incluir recomendações de revisão nos pontos mais fracos. 

6. **Planos de assinatura e pagamentos** 

    - Plano Free : permite 1 upload de documento por semana (até X palavras) e até 3 gerações de flashcards. Com revisão espaçada básica.
    - Plano Pro : número maior de uploads por mês, maior limite de palavras, gerações ilimitadas de flashcards e acesso ao histórico de revisões.
    - Plano Premium : inclui tudo do plano Pro, mais relatórios de desempenho avançados, upload ilimitado e exportação de dados.
    - Integrar com Stripe para cobrança recorrente, controle de períodos de teste e atualização/ cancelamento de planos. 

### Desejáveis (pós‑MVP) 

- Adaptativo : perguntas de múltipla escolha baseadas nos flashcards para reforçar conceitos. 

- Simulações clínicas : estudos de caso interativos para treinar tomada de decisão. 

- Colaboração e compartilhamento : permitir que usuários compartilhem decks de flashcards ou colaborem na criação de conteúdos. 

- Aplicativo mobile : sincronizar com WebApp e oferecer estudo offline. 9. 10. 11. 12. 13. 14. 



##  Experiência do usuário (fluxo de telas) 

| Tela | Descrição | Componentes principais |
|------|----------|-------------------------|
| Página inicial / Landing | Apresenta o propósito da plataforma, benefícios de flashcards (interatividade, personalização e revisão espaçada) e planos disponíveis. | Banner, descrição, botão “Começar Agora”, seção de planos |
| Cadastro/Login | Autenticação via Supabase; campos de e-mail, senha e confirmação. | Formulário de cadastro, link para recuperar senha |
| Dashboard | Após o login, mostra resumo do usuário: próximos estudos, decks em aberto, plano atual e atalho para upgrade. | Lista de revisões pendentes, botões “Enviar novo artigo” e “Estudar” |
| Upload de documento | Formulário para selecionar arquivo, escolher quantidade de flashcards desejada e enviar. Mostra progresso de processamento. | Campo de upload (arrastar/soltar), seletor de quantidade de flashcards, mensagens de sucesso/erro |
| Lista de documentos | Exibe documentos já processados, com data de envio, número de flashcards e status (gerado, em processamento, erro). | Tabela paginada, ações “Ver flashcards” e “Reprocessar” |
| Tela de estudo / Revisão | Exibe cada flashcard: pergunta, botão “Mostrar resposta” e botões “Acertou” e “Errou”. | Barra de progresso, opção de pular, contador de cartões restantes |
| Relatórios | Apresenta gráficos de acertos/erros e tempos de revisão, além de sugestões de estudo extra para conteúdos com alta taxa de erro. | Gráficos, lista de tópicos mais errados, botão para refazer flashcards desses tópicos |
| Página de planos / Pagamento | Descrição de cada plano e botão para assinar. Redireciona para checkout do Stripe. | Cartões de plano, comparativo de benefícios, integração de pagamento |
| Admin (interno) | Gerencia usuários, monitoramento de erros e cancelamentos. | Lista de usuários, planos ativos, métricas gerais |


## Estrutura de dados (Banco de dados) 

- users : id (uuid), nome, email, senha_hash, plano_id (FK), data_criacao, data_expiracao_plano. 

- plans : id, nome, valor_mensal, limite_uploads, limite_palavras, descricao. 

- documents : id, user_id (FK), nome_arquivo, texto_extraido, data_upload, status (processando, pronto, erro), num_flashcards. 

- flashcards : id, document_id (FK), pergunta, resposta, dificuldade, ordem_inicial (para embaralhamento), criado_em. 

- reviews : id, user_id (FK), flashcard_id (FK), data_agendada, data_realizada, resultado (acerto/ erro), nivel_caixa (1 a 3), proxima_data; – O algoritmo de revisão calcula proxima_data conforme acerto ou erro:
    - Caixa 1 → revisão após 1 dia; 
    - Caixa 2 → revisão após 7 dias;
    - Caixa 3 → revisão após 30 dias . Cartões errados retornam à caixa 1

- payments : id, user_id (FK), plan_id (FK), status, valor, data_pagamento, stripe_session_id. 

## Arquitetura técnica 

**Front‑end** 
- Framework : Next.js com React – permite server‑side rendering e integração fácil com Vercel. 

- UI : Tailwind CSS ou Chakra UI para estilização rápida. 

- Gerenciamento de estado : React Context ou Redux para autenticação e dados de flashcards. 

- Internacionalização : O produto inicia em português, mas pode usar next ‑i18next para suporte a outros idiomas futuramente. 

**Back‑end / API**
- Linguagem : Node.js com Express ou Python (FastAPI). Ambas suportam integração com modelos de linguagem e são fáceis de implantar. 

- Serviços :
    - Supabase : banco de dados PostgreSQL e autenticação.
    - Armazenamento de arquivos : Supabase Storage ou AWS S3 para armazenar os PDFs. 
    - Fila de tarefas : uso de BullMQ (Node) ou Celery (Python) para processar documentos de forma assíncrona. 
    - Integração com API de IA : chamadas à API da OpenAI ou Claude para gerar perguntas/ respostas; é necessário dividir o texto em chunks e enviar a prompt adequada, além de incluir um limite de tokens por chamada. 

**Infraestrutura e DevOps** 
- Hospedagem : Vercel para o front‑end; Supabase fornece DB e funções. O back‑end pode ser hospedado em Vercel Serverless Functions ou em um serviço como Render/Fly.io. 

- Ambiente de desenvolvimento : GitHub/GitLab para repositório; integração contínua (CI) com GitHub Actions para testes e deploy automático. 

- Segurança :
    - Criptografia de senha via bcrypt. 
    - Proteção de API keys e tokens em variáveis de ambiente. 
    - Filtragem de extensões de upload e limite de tamanho para evitar injeção de código. 
    - Cumprimento da LGPD: informar ao usuário sobre uso dos dados e permitir exclusão. 

- Monitoramento : uso de LogRocket ou Sentry para rastrear erros no front‑end; monitoramento do back‑end com Grafana/Prometheus ou a solução integrada da plataforma (ex.: Vercel Analytics). 

## Algoritmo de geração de flashcards (exemplo) 

1. Extração do texto : Após o upload, o PDF é convertido para texto. 
2. Pré‑processamento : Remover cabeçalhos, rodapés e referências para focar no conteúdo. Dividir em parágrafos ou seções lógicas. 
3. Chunking : Dividir o texto em pedaços de tamanho adequado para a API de IA (por exemplo, 1.500 caracteres). 
4. Prompt de geração : Para cada chunk, enviar um prompt como: “Crie perguntas e respostas em português sobre o trecho a seguir para flashcards de estudantes de medicina. Seja conciso e cubra os principais conceitos.”. 
5. Pós‑processamento : Consolidar perguntas e respostas geradas, remover duplicatas e filtrar Q&A triviais. 
6. Classificação de dificuldade : Calcular a dificuldade com base no tamanho da resposta ou na complexidade, ou permitir que o usuário ajuste manualmente. 
7. Armazenar : Salvar as perguntas e respostas no banco com referências ao trecho original para posterior consulta. 

## Estratégia de revisão espaçada 

Usar o método Leitner, que consiste em separar os cartões em “caixas” conforme o nível de domínio. A revisão espaçada, segundo a literatura educacional, recomenda revisar o conteúdo 1 dia, 7 dias e 30 dias após o estudo para reforçar a memória . A cada revisão: 
- Se o usuário acertar , o flashcard avança para a próxima caixa, que tem um intervalo maior (ex.: da caixa 1 para a 2 → próxima revisão em 7 dias; da 2 para a 3 → 30 dias).
- Se errar , ele retorna à caixa 1, revisando no dia seguinte.
- Os flashcards na caixa 3 são revisados mensalmente até serem considerados “dominados”. 

## Plano de desenvolvimento (etapas) 

A seguir está um roteiro dividido em fases, ideal para construir o MVP com qualidade e clareza de escopo. 

1. ### Descoberta e planejamento (Semana 1) 

    1. Levantamento de requisitos detalhados :
        - Validar com usuários (alunos de medicina) se os requisitos propostos atendem às dores. 
        - Definir métricas de sucesso (ex.: número de documentos enviados, taxa de conclusão de revisões, retenção de usuários). 

    2. Wireframes e UX : desenhar protótipos de baixa fidelidade das telas (Figma). 

    3. Definição do nome e marca : verificar se “MedMind” está disponível (domínio, redes sociais). 

    4. Planejamento do backlog : priorizar funcionalidades essenciais para o MVP. 

2. ### Configuração da infraestrutura (Semana 1–2) 

    1. Configurar repositório e CI/CD : criar projeto no GitHub, configurar linters, testes e deploy automático para Vercel (front-end) e Supabase. 

    2. Criar conta no Supabase : configurar banco de dados, autenticação e storage. 

    3. Configurar Stripe : criar planos e chaves de API de teste. 

    4. Definir arquitetura do back-end : iniciar repositório com Express/FastAPI e configurar endpoints básicos. 

3. ### Desenvolvimento da autenticação e plano de assinatura (Semana 2–3) 

    1. Implementar tela de login/cadastro no front‑end. 
    2. Integrar Supabase Auth para criação e autenticação de usuários. 
    3. Criar tabela de planos e lógica no back‑end para controlar limites de upload.
    4. Integrar Stripe com endpoints de webhook para receber notificações de pagamento e atualizar o plano do usuário. 

4. ### Upload e processamento de documentos (Semana 3–4) 

    1. Construir página de upload com validação de formatos e limites. 

    2. Implementar serviço assíncrono que extrai o texto do PDF/Word. Utilizar bibliotecas como  pdfplumber ou textract .

    3. Integrar com modelo de IA : criar função que envia o texto em pedaços para a API (OpenAI ou Claude) e retorna flashcards. 

    4. Salvar flashcards no banco e notificar o usuário quando prontos (e‑mail ou notificação in‑app). 

5. ### Revisão e algoritmo de repetição (Semana 4–5) 

    1. Construir interface de estudo : implementar deck de flashcards com botões de acerto/erro. 

    2. Implementar algoritmo de Leitner no back‑end para agendar revisões com base no desempenho .

    3. Registrar revisões : salvar no banco a data em que o usuário responde, o resultado e a próxima revisão. 

    4. Exibir agenda de revisões : criar painel com cards das revisões pendentes e um contador de dias. 

6. ### Histórico e analytics (Semana 5–6) 

    1. Página de histórico : listar os documentos e flashcards com estatísticas de acertos/erros. 

    2. Gráficos de desempenho : usar bibliotecas como Chart.js ou Recharts para mostrar progresso. 

    3. Recomendações personalizadas : identificar tópicos com maior taxa de erro e sugerir revisões extras; basear-se na diferença de acertos e erros em cada flashcard. 

7. ### Testes, segurança e lançamento beta (Semana 6–7) 

    1. Testes unitários e de integração : Cobertura mínima de 80 %. 

    2. Testes de usabilidade : convidar alguns estudantes de medicina para testar a plataforma e recolher feedback. 

    3. Revisar LGPD e termos de uso : garantir transparência no uso dos dados e no processamento de textos sensíveis. 

    4. Implantação beta : publicar a aplicação, monitorar métricas e resolver bugs reportados. 

## Considerações finais 

A plataforma MedMind terá como diferencial a geração automática de flashcards alinhada à revisão espaçada e à análise de desempenho. Para garantir retenção de longo prazo, recomenda‑se seguir uma sequência de revisão em 1 dia, 7 dias e 30 dias . Essa abordagem, aliada à interatividade e personalização que os flashcards oferecem , forma uma solução poderosa para estudantes de medicina que precisam memorizar conteúdos densos. O MVP proposto permite validar a proposta com baixo investimento inicial, e as etapas seguintes permitem expandir o produto com funcionalidades mais sofisticadas. Stoodi | Como usar a revisão espaçada para memorizar conteúdos? 

### **Fontes**

> https://blog.stoodi.com.br/blog/dicas-de-estudo/como-usar-a-revisao-espacada-para-memorizar-conteudos/
> https://aprovatotal.com.br/flashcards/
