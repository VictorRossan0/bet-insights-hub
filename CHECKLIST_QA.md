# Checklist de Validação Manual

Use este roteiro para validar a aplicação aba por aba antes de cada release. Cada item tem critério objetivo de PASS/FAIL.

> Dica: rode também `npm run health` (rota `/health`) e `npm run test:ci` para validação automatizada.

---

## 🟢 Dashboard (`/`)
- [ ] Página carrega sem erro no console
- [ ] KPIs principais exibem valores numéricos (não `NaN`/`undefined`)
- [ ] Comparação YoY (Year-over-Year) aparece com indicadores ↑/↓
- [ ] Skeletons aparecem durante o load (sem flash de tela vazia)

## ⚽ Jogos (`/jogos`)
- [ ] Tabela popula com pelo menos 1 linha (`data-testid="row-jogo-*"`)
- [ ] Filtro de **temporada** muda a tabela
- [ ] Filtro de **rodada** muda a tabela
- [ ] Busca por **time** filtra resultados
- [ ] Paginação avança/volta corretamente
- [ ] **Admin**: botões "Novo Jogo", "JSON", "CSV", "Template" visíveis
- [ ] **Público**: botões de admin **não** aparecem
- [ ] **Admin**: criar jogo → toast de sucesso + linha aparece
- [ ] **Admin**: editar cartões → toast de sucesso **OU** modal RLS com SQL copyable
- [ ] **Admin**: excluir jogo → confirm dialog → linha some

## 🛡️ Times (`/times`)
- [ ] Tabela de classificação carregada com 20 times
- [ ] Coluna de pontos ordenada decrescente
- [ ] Tiebreakers (saldo de gols, vitórias) aplicados
- [ ] Forma (W/D/L) dos últimos 5 jogos visível
- [ ] Click em time → vai para `/times/:id`

## ⚔️ Confronto (`/confronto`)
- [ ] Dois selects de time renderizam todos os 20 times
- [ ] Selecionar Time A e Time B exibe comparativo H2H
- [ ] Stats consolidados (LEAST/GREATEST) mostram valores corretos
- [ ] Trocar a ordem dos times mantém os mesmos números

## 📊 Histórico (`/historico`)
- [ ] Cards de mercados exibem variações YoY em %
- [ ] Setas verde/vermelha condizem com o sinal do delta
- [ ] Faltas/Cartões/Escanteios aparecem (atenção: 2020/2021 sem escanteios)

## 💰 Apostas (`/apostas`)
- [ ] Lista de apostas sugeridas (3 pilares: geral 30% / H2H 40% / casa-fora 30%)
- [ ] Badge de confiança visível (4 chamas = ≥90%)
- [ ] Empty state aparece quando não há sugestões

## 🔑 Admin (`/admin`)
- [ ] Acesso bloqueado para usuários não-admin (redirect ou mensagem)
- [ ] Login admin → painel carrega
- [ ] Logs de auditoria aparecem no console (`[AUDIT] ...`) ao editar/excluir
- [ ] Modal `RlsErrorAlert` exibe SQL copyable se UPDATE/DELETE bloqueado

---

## ✅ Critérios globais
- [ ] Sem erro vermelho no console em nenhuma aba
- [ ] Sem requests com status 5xx no DevTools → Network
- [ ] Layout responsivo (testar 375px, 768px, 1280px)
- [ ] Dark mode consistente — sem cores fora do design system
