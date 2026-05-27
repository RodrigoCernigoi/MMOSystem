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
```

### Groq

`GROQ_API_KEY` e opcional. Quando configurada, o backend usa Groq para sugerir missoes a partir de um objetivo escrito pelo usuario.

Sem chave, o projeto continua funcionando com um fallback local.

### Supabase

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ativam persistencia/autenticacao com Supabase.

Antes de usar, rode o SQL de `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

Sem essas variaveis, o app usa `localStorage`.

## Sistemas Implementados

### Missoes

As missoes representam tarefas reais. Elas podem ser:

- unicas;
- diarias;
- semanais;
- habitos.

Completar missoes gera XP, moedas, atributos e historico diario.

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
- pre-requisitos entre habilidades;
- evidencia real para marcar uma skill como adquirida;
- conexoes visuais entre habilidades relacionadas.

### Recompensas

A loja permite criar recompensas reais, como lazer, descanso, compras planejadas ou experiencias. O usuario resgata recompensas usando moedas ganhas nas missoes.

### Encerramento Diario

O fluxo de "Encerrar dia" cria um relatorio com:

- XP ganho;
- moedas obtidas;
- missoes concluidas;
- habitos registrados;
- rank do dia;
- bonus de fechamento.

O mesmo dia so pode ser encerrado uma vez, evitando bonus duplicado.

### Relatorios

A tela de relatorios mostra historico de fechamentos, graficos simples e estatisticas de progresso.

### Game Feel

O projeto usa recursos sensoriais para tornar o progresso mais satisfatorio:

- splash screen;
- transicoes de tela;
- particulas e efeitos com PixiJS;
- feedback sonoro com Tone.js;
- toasts de recompensa;
- efeitos ao completar missoes, subir de nivel e desbloquear skills.

O som e os efeitos visuais podem ser ajustados na tela de configuracoes.

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

## Roadmap

Ideias futuras:

- presets de sensacao visual/sonora;
- onboarding inicial;
- editor mais avancado da arvore de skills;
- melhores relatorios semanais e mensais;
- vincular recompensas a ciclos de habito;
- modo mobile mais refinado;
- exportacao/importacao dos dados;
- deploy do backend em serverless;
- suporte multiusuario completo via Supabase.

## Observacoes de Seguranca

Chaves privadas, como `GROQ_API_KEY`, devem ficar no backend ou em ambiente serverless. Nunca exponha chaves privadas no frontend.

O arquivo `.env.example` nao deve conter chaves reais.
