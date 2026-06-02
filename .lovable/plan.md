# Plano — Correcções AGT + API Pública Faktura

Vou executar em 4 blocos sequenciais. Cada bloco é commitable e testável.

---

## BLOCO 1 — Bugs bloqueantes (entrega imediata)

**1.1 — Erro 400 em `/rest/v1/faturas?select=*`**
Investigar a query. A causa mais provável **não** é RLS (as policies já estão correctas conforme schema injectado) — é uma coluna inexistente referenciada num `select` ou um filtro mal formado após o último migration. Vou:
- Capturar a request real via `code--read_network_requests`
- Identificar o caller (provavelmente `useFaturas.ts` ou `Faturas.tsx`)
- Corrigir o `select(...)` ou filtro

**1.2 — Subtotal errado em FT/2026/000023**
Bug em `NovaFatura.tsx` (e `POS.tsx`): o subtotal mostrado provavelmente usa só a primeira linha em vez de `reduce`. Corrigir o cálculo do total e do `subtotal` da fatura para somar TODAS as linhas. Adicionar teste rápido.

**1.3 — Hash vazio em FT/2026/000020 (convertida de PF)**
No hook `useProformaConversion.ts` a fatura nova provavelmente é inserida sem passar pelo pipeline de assinatura. Garantir que após conversão se gera `hash_doc`, `hash_extracto`, `hash_anterior` via `agt-hash.ts` + `invoice-signing.ts`.

---

## BLOCO 2 — Documentos AGT em falta no UI

A maioria já existe em `agt-constants.ts` mas pode não estar visível no selector de `/faturas/nova` e `/pos`. Vou:
- Garantir que o `<Select>` de tipo de documento expõe **TODOS** os 11 tipos (FT, FR, RC, NC, ND, FG, FGe, AF, GR, PF, OR) com labels claros
- Para **NC/ND**: forçar campo "Documento de origem" (procurar fatura existente) e gerar `order_reference_id` + `order_reference_numero`
- Para **GR**: mostrar campos `guia_morada_carga`, `guia_morada_descarga`, `guia_matricula_viatura`, `guia_data_transporte`
- Para **FG**: mostrar `periodo_global_inicio/fim`
- Para **AF**: badge visível "Auto-Faturação" no PDF
- Para **moeda estrangeira**: select de moeda + campo taxa de câmbio manual (já existem colunas)
- **Taxa 8.8%**: o campo IVA por linha já é numérico livre — vou garantir que aceita decimais (`step=0.01`) e adicionar no preset rápido junto com 14/5/0

---

## BLOCO 3 — SAF-T XML refinements

Rever `src/lib/saft-export.ts`:
- ✅ `OrderReferences` já existe quando `order_reference_numero` está preenchido — garantir que o trigger de conversão preenche este campo (Bloco 1.3 cobre)
- ✅ `SettlementAmount` já existe — verificar
- ✅ `TaxExemptionReason/Code` já existe por linha
- ✅ `UnitPrice` já em 4 decimais
- Confirmar `Period` extraído como número 1-12 (não YYYY-MM)
- Confirmar `HashControl` preenchido (não `'0'` quando há hash real)

---

## BLOCO 4 — API pública Faktura

**4.1 — Edge function `faktura-api`** (`/functions/v1/faktura-api/*`)
Endpoints REST simplificados com autenticação por **API Key própria** (tabela nova `api_keys` com `key_hash`, `user_id`, `scopes`, `last_used`):
- `POST /faktura-api/v1/invoices` — criar fatura completa (cliente + items + emitir)
- `GET  /faktura-api/v1/invoices/:id` — consultar
- `GET  /faktura-api/v1/invoices/:id/pdf` — URL do PDF
- `POST /faktura-api/v1/clients` — criar cliente
- `GET  /faktura-api/v1/products` — listar produtos
- `GET  /faktura-api/v1/health`

Header: `x-api-key: fkt_live_...`

**4.2 — Gestão de API Keys no UI**
Página `/configuracoes` ganha aba "API & Integrações" para gerar/revogar chaves.

**4.3 — Documentação**
- Markdown: `/mnt/documents/faktura-api-docs.md` com endpoints, schemas, exemplos curl e JS
- Versão PDF gerada do mesmo (com `pdf-lib`/`jspdf`)
- Artifact partilhável

---

## Detalhes técnicos

- **Migrations novas**: `api_keys` (com `key_prefix`, `key_hash` SHA-256, `user_id`, `name`, `scopes text[]`, `last_used_at`, `revoked_at`)
- **Edge function**: `supabase/functions/faktura-api/index.ts`, `verify_jwt = false`, valida `x-api-key` contra hash em DB, opera com `service_role` mas filtra por `user_id` da key
- **Sem alteração de branding/design** — apenas adições UI mínimas no selector de tipo e na aba de API
- Após cada bloco verifico via build + (quando aplicável) `read_network_requests` ou query directa à DB

## Ordem de execução

1. Bloco 1 (bugs) — primeiro commit
2. Bloco 2 (UI docs) — segundo commit
3. Bloco 3 (SAF-T) — terceiro commit
4. Bloco 4 (API + docs) — quarto commit + artifact

Confirmar para arrancar pelo Bloco 1.
