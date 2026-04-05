# ⚽ BetAnalytics Pro

> Plataforma de análise estatística de apostas para o **Brasileirão Série A**, cobrindo a temporada 2026 e histórico de 2016 a 2025.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
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

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs principais: total de jogos, médias de gols, escanteios e cartões
- Cards de mercados com taxas de ocorrência (Over/Under Gols, Escanteios, Cartões)
- Gráficos de distribuição por rodada (Recharts)
- Filtro por temporada (2020–2026)
- Indicadores **YoY** (Year-over-Year) com badges comparativos entre temporadas
- Layout responsivo otimizado para mobile (scroll horizontal snap nos KPIs, grid 2 colunas nos mercados)

### ⚽ Jogos
- Tabela paginada de jogos com dados completos (gols, escanteios, cartões, mercados)
- Filtros por rodada, time e temporada
- Indicadores visuais de resultados e mercados atingidos

### 🏟️ Times
- Listagem de todos os times da Série A
- Perfil individual com estatísticas gerais e por mando de campo (Casa/Fora)
- Componente `CasaForaStats` com comparação visual

### ⚔️ Confronto H2H
- Seleção de dois times para análise head-to-head
- Estatísticas de confrontos diretos usando view `stats_h2h`
- Recomendação automática de apostas baseada no histórico

### 📈 Histórico
- Gráficos de tendência de 2016 a 2025
- Evolução de médias de gols, escanteios e cartões ao longo dos anos
- Análise de tendências históricas do campeonato

### 🎰 Central de Apostas
- Sugestões de apostas com mercado, odd sugerida e nível de confiança
- Status de resultado (pendente/green/red)
- Integração com tabela `sugestoes_apostas` no banco de dados

---

## 🛠️ Tech Stack

| Camada        | Tecnologia                                                     |
| ------------- | -------------------------------------------------------------- |
| **Framework** | React 18 + TypeScript 5                                        |
| **Build**     | Vite 5                                                         |
| **Estilo**    | Tailwind CSS 3 + shadcn/ui (Radix UI)                          |
| **Estado**    | TanStack React Query v5                                        |
| **Gráficos**  | Recharts                                                       |
| **Animações** | Framer Motion                                                  |
| **Roteamento**| React Router DOM v6                                            |
| **Backend**   | Lovable Cloud (Supabase)                                       |
| **Testes**    | Vitest + Playwright                                            |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                    # Componentes shadcn/ui (Button, Card, Table, etc.)
│   ├── CasaForaStats.tsx      # Estatísticas Casa vs Fora
│   ├── DashboardKPIs.tsx      # Cards de KPIs com badges YoY
│   ├── GamesTable.tsx         # Tabela de jogos paginada
│   ├── Layout.tsx             # Layout principal com sidebar responsiva
│   ├── MarketCards.tsx        # Cards de mercados de apostas
│   └── NavLink.tsx            # Link de navegação ativo
├── hooks/
│   ├── use-mobile.tsx         # Detecção de dispositivo mobile
│   └── use-toast.ts           # Hook de notificações toast
├── pages/
│   ├── Dashboard.tsx          # Dashboard principal com KPIs e gráficos
│   ├── Jogos.tsx              # Listagem e filtros de jogos
│   ├── Times.tsx              # Listagem de times
│   ├── TimePerfil.tsx         # Perfil individual do time
│   ├── Confronto.tsx          # Análise H2H entre dois times
│   ├── Historico.tsx          # Gráficos de tendência histórica
│   ├── Apostas.tsx            # Central de sugestões de apostas
│   └── NotFound.tsx           # Página 404
├── services/
│   ├── api/                   # Camada de acesso a dados (Supabase)
│   │   ├── games.api.ts       # CRUD e consultas de jogos
│   │   ├── teams.api.ts       # CRUD e consultas de times
│   │   └── bets.api.ts        # Consultas de apostas sugeridas
│   ├── domain/                # Regras de negócio e transformações
│   │   ├── stats.service.ts   # Agregação estatística (acumulado, rodada, time, H2H)
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

## 💡 Uso

| Rota           | Descrição                              |
| -------------- | -------------------------------------- |
| `/`            | Dashboard com KPIs e gráficos          |
| `/jogos`       | Tabela de jogos com filtros            |
| `/times`       | Listagem de times da Série A           |
| `/times/:id`   | Perfil detalhado de um time            |
| `/confronto`   | Análise H2H entre dois times           |
| `/historico`   | Gráficos de tendência (2016–2025)      |
| `/apostas`     | Central de sugestões de apostas        |

---

## 📝 Licença

Este projeto é de uso privado. Todos os direitos reservados.
