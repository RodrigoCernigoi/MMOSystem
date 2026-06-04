# MMO System

Um sistema gamificado de tarefas, habitos e progresso pessoal inspirado em interfaces de status de RPG, mas pensado como uma extensao da vida real. A ideia nao e transformar a rotina em um jogo separado da realidade, e sim criar um tracker que registre missoes, projetos, habilidades reais, recompensas e progresso diario com uma camada visual e sonora mais envolvente.

## Visao Geral

O MMO System combina organizacao pessoal com feedback de jogo:

- missoes diarias, semanais, unicas e habitos;
- projetos com missoes vinculadas;
- missoes mestras para metas maiores;
- arvore de habilidades reais com pre-requisitos;
- loja de recompensas reais;
- conquistas, atributos, XP, moedas e ranks;
- encerramento diario com relatorio animado;
- historico de relatorios diarios;
- arquivo de evidencias reais;
- efeitos visuais com PixiJS;
- transicoes com Motion;
- audio feedback com Tone.js;
- sugestao opcional de missoes com Groq;
- persistencia local por padrao e Supabase opcional.

## Stack

- React 19
- TypeScript
- Vite
- Motion
- PixiJS
- Tone.js
- React Flow (`@xyflow/react`)
- Lucide React
- Game Icons via Iconify
- Supabase opcional
- Groq opcional
- Vitest

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Inicie frontend e backend local:

```bash
npm run dev
```

Por padrao:

- Frontend: `http://localhost:5173`
- API local: `http://localhost:8787`

Se a porta da API estiver ocupada, o script tenta encontrar outra porta livre automaticamente e ajusta o proxy do Vite.

## Scripts

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run preview
npm test
```

## Variaveis de Ambiente

Crie um `.env` baseado no arquivo `.env.example`.

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
API_PORT=8787
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

### Groq

`GROQ_API_KEY` e opcional. Quando configurada, o backend usa Groq para sugerir missoes a partir de um objetivo escrito pelo usuario.

Sem chave, o backend usa fallback local. Em deploy sem backend, o frontend tambem cai para uma sugestao local.

`VITE_API_BASE_URL` e opcional. Use apenas quando a API estiver publicada separadamente, por exemplo:

```env
VITE_API_BASE_URL=https://sua-api.onrender.com
```

Se ficar vazio, o frontend chama `/api/quest-suggestions`. No desenvolvimento local, o Vite faz proxy para a API local.

### Supabase

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ativam persistencia/autenticacao com Supabase.

Antes de usar, rode o SQL de `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

Com Supabase ativo, o app usa login e sincroniza player, missoes, projetos, skills, recompensas e sessoes de foco por usuario.

Sem essas variaveis, o app usa `localStorage`.

## Sistemas Implementados

### Missoes

As missoes representam tarefas reais. Elas podem ser:

- unicas;
- diarias;
- semanais;
- habitos.

Completar missoes gera XP, moedas, atributos e historico diario.

Missoes importantes podem ser marcadas para exigir evidencia. Nesse caso, o check rapido abre a ficha da missao e a conclusao so acontece depois de registrar uma prova real, nota de aprendizado ou resultado concreto.

### Habitos

Habitos nao sao encerrados como tarefas comuns. Eles recebem check-ins diarios e mantem log para streaks.

### Projetos

Projetos agrupam missoes relacionadas a uma meta concreta. Um projeto pode ser concluido automaticamente quando todas as missoes vinculadas forem finalizadas.

### Missoes Mestras

Missoes Mestras sao metas maiores, como marcos de vida ou objetivos de longo prazo. Elas sao concluidas manualmente, porque representam conquistas reais que nem sempre podem ser inferidas apenas por tarefas menores.

### Skills

As habilidades nao funcionam como poderes comprados. Elas representam capacidades reais adquiridas.

A tela de Skills usa React Flow para exibir uma arvore/constelacao com:

- categorias por atributo;
- busca;
- filtros por constelacao;
- seletor visual de icone por habilidade;
- pre-requisitos entre habilidades;
- evidencia real para marcar uma skill como adquirida;
- conexoes visuais entre habilidades relacionadas.

### Recompensas

A loja permite criar recompensas reais, como lazer, descanso, compras planejadas ou experiencias. O usuario resgata recompensas usando moedas ganhas nas missoes.

As recompensas possuem categorias:

- lazer;
- descanso;
- social;
- compra;
- saude;
- aprendizado.

A loja tambem inicia com recompensas padrao para dar uma escala de economia:

- 30 moedas: pausa curta;
- 80 moedas: lazer comum;
- 140+ moedas: experiencia maior;
- 300+ moedas: recompensa de ciclo.

Recompensas criadas manualmente tem custo minimo de 20 moedas para evitar inflacao artificial.

### Economia

O sistema evita que progresso alto seja computado sem rastro real:

- missoes de rank Hard e Elite exigem evidencia automaticamente;
- missoes comuns continuam podendo ser concluidas rapidamente;
- o encerramento diario so pode ser feito uma vez por dia;
- recompensas padrao usam valores mais altos que tarefas pequenas para preservar o valor da moeda.
- a loja exibe ganho semanal, gasto semanal e um orcamento sugerido;
- alertas suaves aparecem quando o gasto passa do orcamento ou ha recompensas baratas demais.

### Encerramento Diario

O fluxo de "Encerrar dia" cria um relatorio com:

- XP ganho;
- moedas obtidas;
- missoes concluidas;
- habitos registrados;
- rank do dia;
- evidencias reais registradas;
- bonus de fechamento.

O mesmo dia so pode ser encerrado uma vez, evitando bonus duplicado.

### Relatorios

A tela de relatorios mostra historico de fechamentos, graficos simples e estatisticas de progresso.

### Evidencias

A tela de Evidencias centraliza provas reais vindas de missoes e skills. E possivel filtrar por tipo, atributo, projeto e texto, ajudando o usuario a enxergar progresso concreto em vez de apenas pontos abstratos.

### Game Feel

O projeto usa recursos sensoriais para tornar o progresso mais satisfatorio:

- splash screen;
- transicoes de tela;
- particulas e efeitos com PixiJS;
- feedback sonoro com Tone.js;
- emblemas visuais com Game Icons;
- toasts de recompensa;
- efeitos ao completar missoes, subir de nivel e desbloquear skills.

O som e os efeitos visuais podem ser ajustados na tela de configuracoes.

Os efeitos sonoros customizados ficam em `public/sounds`. A camada de audio carrega esses arquivos por evento e usa Tone.js como fallback quando um asset nao estiver disponivel.

### Creditos Visuais

Alguns emblemas usam icones do [Game-icons.net](https://game-icons.net/) por meio do endpoint SVG do [Iconify](https://iconify.design/). Os icones do Game Icons sao distribuidos sob licenca CC BY 3.0.

A tela de Creditos centraliza bibliotecas, assets visuais, sons e observacoes de licenca para facilitar publicacao e testes externos.

## Arquitetura

O projeto foi organizado com baixo acoplamento:

```text
src/domain          Regras puras de negocio
src/application     Casos de uso e portas
src/infrastructure  Adaptadores de storage, API, Supabase e Groq
src/presentation    React, telas, hooks e componentes visuais
server              Backend local para sugestoes de missoes
supabase            Schema SQL opcional
```

O dominio nao depende de React, navegador, localStorage, Supabase ou Groq. Isso facilita trocar persistencia, evoluir o backend e testar regras isoladamente.

## Testes

Rode:

```bash
npm test
```

Atualmente ha testes para:

- progressao e recompensas;
- conclusao automatica de projetos;
- desbloqueio de skills por Missao Mestra;
- fechamento diario sem duplicar bonus.

## Build

```bash
npm run build
```

O build executa `tsc --noEmit` e `vite build`.

## Deploy

### Frontend na Vercel

1. Suba o repositorio no GitHub.
2. Importe o projeto na Vercel.
3. Configure:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Adicione as variaveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`, opcional
5. Rode o SQL de `supabase/schema.sql` no Supabase.

O arquivo `vercel.json` garante fallback para `index.html` em rotas SPA.

### Frontend na Netlify

1. Importe o repositorio na Netlify.
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Adicione as mesmas variaveis de ambiente.

O arquivo `public/_redirects` garante fallback SPA no Netlify.

### Backend Groq em producao

O app funciona sem backend publicado, usando sugestoes locais. Para sugestoes com Groq em producao, publique a pasta `server` em um provedor Node como Render, Railway ou Fly e defina:

```env
GROQ_API_KEY=sua-chave
GROQ_MODEL=llama-3.1-8b-instant
API_PORT=8787
```

Depois coloque a URL publica dessa API em `VITE_API_BASE_URL` no deploy do frontend.

### Checklist de Teste Externo

- criar conta;
- passar pelo onboarding;
- criar uma missao;
- criar uma missao marcada como "exigir evidencia";
- confirmar que ela nao conclui sem registrar uma prova;
- abrir modo foco e salvar sessao;
- abrir a tela de Evidencias e conferir filtros;
- encerrar o dia;
- exportar backup;
- abrir em outro dispositivo com a mesma conta;
- confirmar que missoes, skills, recompensas e sessoes aparecem.

### Checklist de Seguranca e Deploy

- manter `GROQ_API_KEY` apenas no backend/provedor serverless;
- expor no frontend somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
- confirmar que o SQL de `supabase/schema.sql` foi executado com RLS ativo;
- conferir se as URLs do site estao permitidas no painel Auth do Supabase;
- usar HTTPS no dominio publicado;
- testar login, logout e recuperacao de sessao em navegador anonimo;
- testar uma conta nova antes de enviar o link para terceiros;
- evitar commitar `.env` real.

## Roadmap

Ideias futuras:

- presets de sensacao visual/sonora;
- editor mais avancado da arvore de skills;
- melhores relatorios mensais;
- vincular recompensas a ciclos de habito;
- modo mobile mais refinado;
- deploy do backend em serverless;
- resolver conflitos de sync com timestamps por entidade.

## Observacoes de Seguranca

Chaves privadas, como `GROQ_API_KEY`, devem ficar no backend ou em ambiente serverless. Nunca exponha chaves privadas no frontend.

O arquivo `.env.example` nao deve conter chaves reais.

`VITE_SUPABASE_ANON_KEY` e uma chave publicavel. A seguranca dos dados depende principalmente das politicas RLS do Supabase e do uso correto de `auth.uid()` nas tabelas.
