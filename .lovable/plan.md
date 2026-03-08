

## Análise: O que falta para o sistema Faktura ser robusto

Após uma análise completa do código, identifiquei as seguintes lacunas organizadas por prioridade:

---

### 1. Página de Documentos usa dados mock (CRÍTICO)
`Documentos.tsx` usa `mockDocuments` hardcoded em vez de dados reais da base de dados. Deve ser ligada às faturas reais como as outras páginas.

**Acção:** Substituir mock data por queries reais à tabela `faturas`, reutilizando o hook `useFaturas`.

---

### 2. Falta gestão de stock automática (IMPORTANTE)
Quando uma fatura é emitida, o stock dos produtos não é decrementado. A tabela `produtos` tem campos `stock` e `stock_minimo` mas não são utilizados.

**Acção:**
- Criar trigger SQL que decrementa stock ao emitir fatura
- Criar notificação automática quando stock atinge `stock_minimo`
- Mostrar alertas de stock baixo no Dashboard

---

### 3. Falta detecção automática de faturas vencidas (IMPORTANTE)
Faturas com `data_vencimento` passada e estado `emitida` não são automaticamente marcadas como `vencida`. A detecção é apenas visual.

**Acção:** Criar função SQL agendada ou lógica client-side para atualizar o estado de faturas vencidas e gerar notificações.

---

### 4. Falta edição de faturas em rascunho
Não existe funcionalidade para editar uma fatura antes de ser emitida. Só se pode criar nova.

**Acção:** Adicionar rota `/faturas/editar/:id` e pré-preencher o formulário de `NovaFatura` com dados existentes.

---

### 5. Falta duplicação de faturas
Funcionalidade comum: duplicar uma fatura existente para criar uma nova rapidamente.

**Acção:** Botão "Duplicar" no dropdown de acções das faturas que abre `NovaFatura` pré-preenchida.

---

### 6. Dashboard sem dados de tendência real
O `RevenueChart` e outros componentes do dashboard não mostram comparação mês anterior vs atual.

**Acção:** Calcular variação percentual e mostrar indicadores de crescimento/queda.

---

### 7. Falta exportação de dados (clientes, produtos)
Apenas relatórios fiscais têm exportação PDF. Não existe exportação CSV/Excel de clientes, produtos ou fornecedores.

**Acção:** Adicionar botões de exportação CSV nas páginas de Clientes, Produtos e Fornecedores.

---

### 8. Sidebar não esconde link Admin para não-admins
O link "Admin" na sidebar é visível para todos os utilizadores, mesmo que o acesso seja bloqueado pela rota protegida.

**Acção:** Condicionar a visibilidade do item "Admin" ao role do utilizador.

---

### 9. Falta paginação nas listagens
Faturas, clientes, produtos e fornecedores não têm paginação — todas as queries retornam todos os registos.

**Acção:** Implementar paginação client-side com controles de "anterior/próximo" e limite de itens por página.

---

### 10. Falta validação de NIF angolano
O campo NIF aceita qualquer texto. Deveria validar o formato correcto do NIF angolano.

**Acção:** Adicionar validação de formato (14 dígitos) no registo e na criação de clientes.

---

### Plano de implementação recomendado

Pela ordem de impacto:

1. **Documentos com dados reais** — Substituir mocks em `Documentos.tsx`
2. **Gestão de stock + notificações** — Trigger SQL + alertas no dashboard
3. **Detecção de faturas vencidas** — Lógica automática + notificações
4. **Sidebar condicional por role** — Esconder Admin para não-admins
5. **Paginação nas listagens** — Client-side pagination
6. **Exportação CSV** — Clientes, produtos, fornecedores
7. **Edição de rascunhos** — Rota de edição de faturas
8. **Duplicação de faturas** — Acção rápida
9. **Validação de NIF** — Formato angolano
10. **Tendências no dashboard** — Comparação mensal

