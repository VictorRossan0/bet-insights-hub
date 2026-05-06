# 🛠️ Configuração Local — BetAnalytics Pro

Guia para rodar o projeto fora do ambiente Lovable.

> **Importante:** no ambiente Lovable as variáveis de ambiente são injetadas automaticamente. Estes passos só são necessários para desenvolvimento local (sua máquina) ou em outro host.

---

## 1. Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm, bun ou pnpm

---

## 2. Criar o `.env.local`

O arquivo `.env` **nunca** deve ser versionado. Use `.env.local` (já listado no `.gitignore`).

### Opção A — Script automático (recomendado)

```bash
npm run setup:env
```

O script copia `.env.example` para `.env.local` e pede os valores no terminal:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Opção B — Manual

```bash
cp .env.example .env.local
# edite .env.local e preencha os 3 valores
```

### Onde encontrar os valores

No painel do Lovable Cloud (ou Supabase externo) → **Settings → API**:

| Variável | Origem |
|---|---|
| `VITE_SUPABASE_URL` | Project URL (ex.: `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave **publishable / anon** (segura para frontend) |
| `VITE_SUPABASE_PROJECT_ID` | Subdomínio da URL (parte antes de `.supabase.co`) |

---

## 3. Instalar dependências

```bash
npm install
```

---

## 4. Rodar o projeto

```bash
npm run dev
```

App disponível em `http://localhost:5173`.

---

## 5. Validação automática

No bootstrap, a aplicação verifica se as 3 variáveis estão definidas. Se algo estiver faltando, um overlay vermelho aparece listando as variáveis ausentes — sem quebrar silenciosamente.

---

## ⚠️ Segurança

- **Nunca** faça commit de `.env`, `.env.local`, `.env.production` ou similares.
- O `.gitignore` já cobre esses arquivos por padrão.
- A chave **publishable/anon** é segura para frontend (protegida por RLS). Já a `service_role` **jamais** deve ir para o frontend ou para o git.

---

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run setup:env` | Cria `.env.local` interativamente |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run test` | Testes unitários (Vitest) |
| `npm run lint` | Lint do projeto |
