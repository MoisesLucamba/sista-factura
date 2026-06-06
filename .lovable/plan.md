## Objectivo

1. **Cobrança mensal automática** na página Subscrição — débito recorrente de 8.000 Kz + 1 Kz/documento, integrado com Multicaixa Express, com renovação automática até ao fim do ciclo.
2. **Envio programático do SAF-T à AGT** até ao dia 5 de cada mês, com cron/fila, logs de submissão e estado (`pendente / enviado / erro`) por período.

---

## 1. Base de dados (migration)

**Novas tabelas:**

- `subscriptions` — assinatura activa do utilizador
  - `user_id`, `status` (`active` | `grace` | `suspended` | `cancelled`)
  - `plan_fee` (default 8000), `per_doc_fee` (default 1)
  - `current_period_start`, `current_period_end`, `next_billing_at`
  - `auto_renew` (bool), `payment_method` (`multicaixa` | `wallet` | `transferencia`)
  - `multicaixa_token` (referência reutilizável quando disponível)

- `subscription_invoices` — fatura mensal gerada pelo ciclo
  - `subscription_id`, `user_id`, `period_start`, `period_end`
  - `plan_fee`, `documents_count`, `documents_fee`, `total`
  - `status` (`pending` | `paid` | `failed` | `overdue`)
  - `paid_at`, `payment_reference`, `attempts`

- `saft_submissions` — registo de submissão à AGT
  - `user_id`, `period` (YYYY-MM), `xml_url` (storage), `xml_hash`
  - `status` (`pending` | `sent` | `error`), `agt_reference`, `error_message`
  - `submitted_at`, `attempts`, `last_attempt_at`

Tudo com RLS (owner-only + admin via `has_role`), `GRANT` ao `authenticated` e `service_role`, triggers `update_updated_at_column`.

## 2. Edge functions

- `subscription-billing` (cron mensal, dia 1):
  - itera utilizadores activos, calcula `documents_count` do mês anterior, gera `subscription_invoices`, tenta debitar (wallet → Multicaixa), actualiza `status`, dispara notificação.
- `subscription-charge` (chamada manual / retry): tenta cobrar uma fatura pendente via Multicaixa Express (reutiliza `multicaixa-express` existente) ou debita carteira.
- `saft-submit` (cron mensal, dia 5 às 06:00):
  - para cada `user_id` com docs no mês anterior: gera XML via lógica equivalente a `saft-export.ts`, faz upload para storage bucket `saft`, regista em `saft_submissions`, faz POST para endpoint AGT (configurável via secret `AGT_SAFT_ENDPOINT` + `AGT_SAFT_TOKEN`), grava `agt_reference` ou `error_message`, com retries.
- Agendamento via `pg_cron` + `pg_net` (inserir SQL com a anon key — usar tool `insert`, não migration).

## 3. Storage

- Novo bucket privado `saft` — só admin e dono lê.

## 4. Frontend

**`src/pages/Subscricao.tsx`** (reescrito):
- Cartão "Assinatura activa": estado, próximo débito, método.
- Toggle **renovação automática**.
- Selector de método (Multicaixa Express / Carteira).
- Botão **Activar subscrição** (cria registo `subscriptions` + cobra 1º mês).
- Histórico das `subscription_invoices` com badge de estado, botão "Pagar agora" para `pending/failed`.
- Manter secção de carregamento de carteira.

**Nova página `src/pages/SaftSubmissions.tsx`** + rota `/saft-envios`:
- Tabela: `Período | Status | Submetido em | Ref. AGT | Tentativas | Acções`.
- Botão "Reenviar" para `error`. Botão "Submeter agora" para o período actual.
- Link na sidebar (secção AGT).

**Admin (`AdminDashboard` ou `GestaoFinanceira`)**: vista global das `subscription_invoices` e `saft_submissions` com filtros e acção de reenvio manual.

## 5. Cron (via `supabase--insert`)

```sql
select cron.schedule('subscription-billing-monthly', '0 3 1 * *', $$ ... net.http_post ... $$);
select cron.schedule('saft-submit-monthly',         '0 6 5 * *', $$ ... net.http_post ... $$);
```

## 6. Configuração / secrets

Pedir confirmação para `AGT_SAFT_ENDPOINT` e `AGT_SAFT_TOKEN` (necessários para o POST real à AGT). Enquanto não configurados, o envio fica em modo `dry-run` (gera XML, guarda, marca `pending` com nota "AGT endpoint não configurado").

---

## Detalhes técnicos resumidos

- `documents_count` = `select count(*) from faturas where user_id=$ and incluir_saft=true and data_emissao between period_start and period_end`.
- Total = `plan_fee + documents_count * per_doc_fee`.
- Falha de cobrança → status `grace` por 7 dias → depois `suspended` (`ProtectedRoute` pode bloquear emissão de novos documentos quando suspenso, sem afectar leitura).
- Hash do XML em SHA-256 para auditoria.
- Notificações via tabela `notifications` em cada evento (gerado / pago / falhou / SAF-T enviado / SAF-T erro).

---

## Ordem de implementação

1. Migration (tabelas + RLS + grants + triggers + bucket).
2. Edge functions (`subscription-billing`, `subscription-charge`, `saft-submit`).
3. Pedir secrets AGT.
4. Cron jobs via insert.
5. Reescrever `Subscricao.tsx` + criar `SaftSubmissions.tsx` + sidebar + rotas.
6. Painel admin.

Pronto para começar pela migration?
