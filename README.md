# ⚽ BetAnalytics Pro

> Plataforma de análise de dados do Brasileirão Série A com automação, processamento estatístico e geração de insights para apostas esportivas.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

---

## 🔗 Preview

**Aplicação online:** https://analyticsbrasileirao.lovable.app/

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Objetivos Técnicos](#-objetivos-técnicos)
- [Funcionalidades](#-funcionalidades)
- [Tech Stack](#-tech-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **BetAnalytics Pro** é uma aplicação web que centraliza dados estatísticos do Brasileirão Série A para apoiar decisões em apostas esportivas. A plataforma oferece dashboards interativos, filtros por temporada, análise de confrontos diretos (H2H), estatísticas por mando de campo e sugestões automatizadas de apostas.

---

## 🎯 Objetivos Técnicos

- Centralizar dados estatísticos do Brasileirão Série A em uma aplicação web organizada
- Estruturar consultas, views e funções RPC para análise de desempenho, mercados e confrontos
- Aplicar boas práticas de frontend com React, TypeScript e componentização
- Utilizar Supabase/PostgreSQL como base de dados para processamento e consulta das informações
- Criar uma arquitetura modular preparada para evolução contínua, novas métricas e futuras automações

---

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs principais: total de jogos, médias de gols, escanteios e cartões
- Cards de mercados com taxas de ocorrência (Over/Under Gols, Escanteios, Cartões)
- Gráficos de distribuição por rodada (Recharts)
- Filtro por temporada (2020–2026)
- Indicadores **YoY** (Year-over-Year) com badges comparativos entre temporadas
- **Skeleton loaders** contextuais para estados de carregamento
- Layout responsivo otimizado para mobile (scroll horizontal snap nos KPIs, grid 2 colunas nos mercados)

### ⚽ Jogos
- Tabela paginada de jogos com dados completos (gols, escanteios, cartões, mercados)
- Filtros por rodada, time e temporada
- Formulário de inserção manual de jogos com seletores de times
- Importação CSV/JSON com validação de duplicatas
- Formulário de edição inline de jogos existentes
- Indicadores visuais de resultados e mercados atingidos
- **Empty states** inteligentes quando não há dados

### 🏟️ Times
- **Classificação oficial** do Brasileirão com pontos, V/E/D, GP/GC, saldo de gols e aproveitamento (%)
- **Zonas coloridas**: Libertadores (azul), Pré-Libertadores (azul claro), Sul-Americana (laranja), Rebaixamento (vermelho)
- **Ordenação interativa** por colunas clicáveis (P, V, SG, %, Esc.)
- Indicador de forma recente (últimos 5 jogos) com badges visuais W/D/L
- Legenda visual das zonas de classificação
- Ranking geral com gráfico de barras Top 12 (Gols, Escanteios, Cartões, Jogos)
- Comparação radar entre dois times selecionados
- Estatísticas Casa/Fora por equipe via `CasaForaStats`
- Link direto para perfil individual do time

### 👤 Perfil do Time
- Estatísticas gerais e por mando de campo (Casa/Fora)
- Forma recente via RPC `get_team_form`
- Probabilidades de mercado via RPC `calculate_market_probability`

### ⚔️ Confronto H2H
- Seleção de dois times para análise head-to-head
- Estatísticas de confrontos diretos usando view `stats_h2h_enhanced`
- Recomendação automática de apostas baseada no histórico
- Geração de sugestões via RPC `generate_bet_suggestion`
- **Empty states** inteligentes quando times não foram selecionados

### 📈 Histórico
- Gráficos de tendência de 2020 a 2025
- Evolução de médias de gols, escanteios e cartões ao longo dos anos
- Análise de tendências históricas do campeonato

### 🎰 Central de Apostas
- Sugestões de apostas com mercado, odd sugerida e nível de confiança
- Badges de confiança visual (HIGH/MEDIUM/LOW) com cores semânticas
- Base histórica, H2H e Casa/Fora exibidas nos cards
- Status de resultado (pendente/green/red/void)
- Integração com tabela `apostas_sugeridas` e view `sugestoes_apostas_view`

### 🎨 UX Profissional
- **Skeleton loaders** contextuais: KPIs, tabelas, gráficos, cards de apostas, radar
- **Empty states** inteligentes com ícones, descrições e ações contextuais
- **Badges de confiança** com cores semânticas e barras de progresso
- Animações suaves com Framer Motion
- Design system com tokens semânticos (CSS variables HSL)

---

## 🛠️ Tech Stack

| Camada              | Tecnologia                                                     |
| ------------------- | -------------------------------------------------------------- |
| **Framework**       | React 18 + TypeScript 5                                        |
| **Build**           | Vite 5                                                         |
| **Estilo**          | Tailwind CSS 3 + shadcn/ui (Radix UI)                          |
| **Estado**          | TanStack React Query v5                                        |
| **Gráficos**        | Recharts                                                       |
| **Animações**       | Framer Motion                                                  |
| **Roteamento**      | React Router DOM v6                                            |
| **Backend / Banco** | Supabase / PostgreSQL                                          |
| **Testes**          | Vitest + Playwright                                            |

---

## 🗄️ Arquitetura de Dados

### Views SQL
| View | Descrição |
| ---- | --------- |
| `stats_team_form` | Forma recente dos times (V/E/D, gols, escanteios, últimos 5 jogos) |
| `stats_market_probability` | Probabilidades de mercado por time |
| `stats_h2h_enhanced` | Confronto direto com recomendação automática |
| `sugestoes_apostas_view` | Sugestões com nomes dos times resolvidos |

### Funções RPC
| Função | Descrição |
| ------ | --------- |
| `get_team_form(team_id, last_n)` | Forma recente de um time específico |
| `calculate_market_probability(team_id)` | Probabilidades de mercado calculadas |
| `generate_bet_suggestion(casa_id, fora_id)` | Sugestão automática com modelo ponderado (Geral 30%, H2H 40%, Casa/Fora 30%) |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                    # Componentes shadcn/ui + skeleton loaders, empty states, confidence badges
│   ├── CasaForaStats.tsx      # Estatísticas Casa vs Fora
│   ├── DashboardKPIs.tsx      # Cards de KPIs com badges YoY
│   ├── FormNovoJogo.tsx       # Formulário de novo jogo
│   ├── FormEditarJogo.tsx     # Formulário de edição de jogo
│   ├── GamesTable.tsx         # Tabela de jogos paginada
│   ├── Layout.tsx             # Layout principal com sidebar responsiva
│   ├── MarketCards.tsx        # Cards de mercados de apostas
│   └── NavLink.tsx            # Link de navegação ativo
├── hooks/
│   ├── use-mobile.tsx         # Detecção de dispositivo mobile
│   └── use-toast.ts           # Hook de notificações toast
├── pages/
│   ├── Dashboard.tsx          # Dashboard principal com KPIs e gráficos
│   ├── Jogos.tsx              # Listagem, filtros, importação e edição de jogos
│   ├── Times.tsx              # Classificação, ranking, comparação e forma
│   ├── TimePerfil.tsx         # Perfil individual do time
│   ├── Confronto.tsx          # Análise H2H entre dois times
│   ├── Historico.tsx          # Gráficos de tendência histórica
│   ├── Apostas.tsx            # Central de sugestões de apostas
│   └── NotFound.tsx           # Página 404
├── services/
│   ├── api/                   # Camada de acesso a dados
│   │   ├── games.api.ts       # CRUD e consultas de jogos
│   │   ├── teams.api.ts       # CRUD e consultas de times
│   │   ├── bets.api.ts        # Consultas de apostas sugeridas
│   │   └── stats-views.api.ts # Interface com views SQL e RPCs
│   ├── domain/                # Regras de negócio e transformações
│   │   ├── stats.service.ts   # Agregação estatística
│   │   ├── games.service.ts   # Importação CSV, validação de duplicatas
│   │   └── betting.service.ts # Motor de recomendação de apostas
│   └── supabase/
│       ├── client.ts          # Cliente Supabase (externo)
│       ├── jogosService.ts    # Re-exports (compatibilidade)
│       ├── statsService.ts    # Re-exports (compatibilidade)
│       └── importService.ts   # Re-exports (compatibilidade)
├── integrations/
│   └── supabase/
│       ├── client.ts          # Cliente Supabase (Lovable Cloud)
│       └── types.ts           # Tipos gerados automaticamente
├── types/
│   └── database.ts            # Tipos do banco de dados
├── App.tsx                    # Rotas e providers
├── main.tsx                   # Entry point
└── index.css                  # Design tokens e estilos globais
```

---

## 🚀 Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd betanalytics-pro

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## ⚙️ Configuração local (`.env.local`)

Para rodar fora do ambiente Lovable, é necessário criar um `.env.local` com as
credenciais do Supabase. O arquivo está no `.gitignore` e **nunca** deve ser versionado.

```bash
# Geração interativa (recomendado): pede os valores no terminal
npm run setup:env

# Depois:
npm install
npm run dev
```

Variáveis obrigatórias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Se alguma estiver faltando, a aplicação exibe um overlay de erro no boot listando o que falta.

📖 Passo a passo completo, alternativas manuais e onde encontrar cada valor: **[SETUP_LOCAL.md](./SETUP_LOCAL.md)**.

---

## 💡 Uso

| Rota           | Descrição                              |
| -------------- | -------------------------------------- |
| `/`            | Dashboard com KPIs e gráficos          |
| `/jogos`       | Tabela de jogos com filtros e importação |
| `/times`       | Classificação, ranking e comparação    |
| `/times/:id`   | Perfil detalhado de um time            |
| `/confronto`   | Análise H2H entre dois times           |
| `/historico`   | Gráficos de tendência (2020–2025)      |
| `/apostas`     | Central de sugestões de apostas        |

---

## 📝 Licença

Este projeto é de uso privado. Todos os direitos reservados.
