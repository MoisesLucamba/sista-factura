# Faktura API — Guia Completo de Integração

**Versão:** v1  
**Base URL:** `https://ewfjvgzachtonehujvom.supabase.co/functions/v1/faktura-api`  
**Autenticação:** Header `x-api-key: fkt_live_...` (gerada em **API & Integrações** dentro da conta).

Faktura é a infra-estrutura de facturação certificada AGT de Angola. Este guia
descreve como integrar Faktura em **marketplaces, e-commerces, ERPs, POS
externos e apps móveis**. Todos os utilizadores da plataforma — comprador,
vendedor e operador de marketplace — têm um **ID Faktura** (`FK-244-XXXXXX`)
que é a chave universal de identidade fiscal dentro do ecossistema.

> **Princípio central:** qualquer sistema externo pode emitir facturas em nome
> de um vendedor, cobrar comissões próprias, entregar o documento ao comprador
> e obter o SAF-T mensal — tudo referenciando utilizadores pelo ID Faktura.

---

## Índice

1. [Conceitos](#1-conceitos)
2. [Autenticação e chaves](#2-autenticação-e-chaves)
3. [Modelo de identidade — ID Faktura](#3-modelo-de-identidade--id-faktura)
4. [Endpoints](#4-endpoints)
   - 4.1 [Health](#41-get-health)
   - 4.2 [Resolver ID Faktura](#42-get-v1lookupfk-id)
   - 4.3 [Clientes](#43-clientes)
   - 4.4 [Produtos](#44-produtos)
   - 4.5 [Emitir factura (vendedor → comprador)](#45-post-v1invoices)
   - 4.6 [Emitir factura de comissão (marketplace → vendedor)](#46-post-v1marketplacecommission-invoice)
   - 4.7 [Consultar / listar facturas](#47-consultar--listar-facturas)
   - 4.8 [Descarregar PDF](#48-get-v1invoicesidpdf)
   - 4.9 [Descarregar SAF-T (AGT)](#49-get-v1saftperiod)
5. [Cenários de integração](#5-cenários-de-integração)
   - Marketplace multi-vendedor
   - E-commerce próprio
   - POS externo / ERP
6. [Webhooks](#6-webhooks-em-breve)
7. [Códigos de erro](#7-códigos-de-erro)
8. [Rate limits](#8-rate-limits)
9. [Compliance AGT](#9-compliance-agt)

---

## 1. Conceitos

| Termo | Significado |
|-------|-------------|
| **ID Faktura** | Identificador único do utilizador dentro do ecossistema (`FK-244-000123`). Serve como "número de conta" universal. |
| **Vendedor** | Utilizador que emite facturas para os seus clientes. |
| **Comprador** | Utilizador final que recebe facturas — pode ser identificado pelo ID Faktura ou pelo NIF. |
| **Marketplace / Host** | Plataforma que agrega vendedores e cobra comissão sobre cada venda. Também precisa emitir facturas (das comissões que cobra aos vendedores) para efeitos de SAF-T próprio. |
| **API Key** | Credencial de autenticação da integração. Está **associada a um único utilizador Faktura** (o dono da chave). Todas as operações que a chave faz são registadas como se fossem desse utilizador. |
| **SAF-T (AO)** | Ficheiro XML mensal exigido pela AGT. Faktura gera-o automaticamente e disponibiliza-o por API. |

---

## 2. Autenticação e chaves

Todas as chamadas exigem o header:

```
x-api-key: fkt_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

A chave só é exibida **uma vez** no momento da criação (página *API &
Integrações* na app). Guarde-a como qualquer secret.

**Boas práticas:**

- Nunca use a chave em código de frontend público. Faça o `fetch` a partir do
  seu backend.
- Rotacione a chave a cada 90 dias.
- Use chaves separadas para ambientes de teste e produção.

**Contexto do utilizador.** Uma API key é associada a um utilizador Faktura
(que pode ser um vendedor comum ou um marketplace/host). Todas as facturas,
clientes e produtos que a chave criar pertencem a esse utilizador — é ele que
aparece como emitente no PDF e no SAF-T.

Se você é um **marketplace**, o fluxo típico é:

1. Criar uma conta Faktura para o marketplace (`FK-244-XXXXXX`).
2. Gerar 1 API key para o marketplace.
3. Cada vendedor da sua plataforma também tem uma conta Faktura própria (com o
   próprio ID). Você usa o endpoint [`/v1/marketplace/commission-invoice`](#46-post-v1marketplacecommission-invoice)
   para emitir automaticamente a factura da comissão que cobra a esse vendedor.
4. As vendas ao consumidor final continuam a ser emitidas pelo vendedor (via
   sua própria API key ou via [`/v1/invoices`](#45-post-v1invoices) chamado
   pelo marketplace usando o header `x-on-behalf-of: FK-244-XXXXXX`).

---

## 3. Modelo de identidade — ID Faktura

Todo o utilizador — comprador, vendedor, contador, marketplace — tem um ID no
formato `FK-244-XXXXXX`. Este ID substitui NIFs, emails e IDs internos em
qualquer chamada à API. Sempre que um endpoint aceita `cliente_id`,
`buyer_faktura_id`, `seller_faktura_id` ou `on_behalf_of`, você pode passar
o ID Faktura.

**Como obter o ID de um utilizador:**

```http
GET /v1/lookup/FK-244-000123
```

Devolve nome, email, telefone, NIF e tipo (`vendedor` | `comprador` |
`marketplace`). Útil para auto-completar dados numa checkout page ou para
validar que o ID que o comprador introduziu existe.

---

## 4. Endpoints

### 4.1 `GET /health`

Verifica que a API está online. Não requer autenticação.

```bash
curl https://ewfjvgzachtonehujvom.supabase.co/functions/v1/faktura-api/health
```

```json
{ "ok": true, "service": "faktura-api", "version": "1.0" }
```

---

### 4.2 `GET /v1/lookup/:fk_id`

Resolve um ID Faktura para obter os dados fiscais do utilizador.

```bash
curl -H "x-api-key: $FKT_KEY" \
  https://.../faktura-api/v1/lookup/FK-244-000123
```

**Resposta 200:**

```json
{
  "data": {
    "faktura_id": "FK-244-000123",
    "nome": "João da Silva",
    "nif": "5401234567",
    "telefone": "+244923000000",
    "email": "joao@exemplo.ao",
    "tipo": "comprador"
  }
}
```

---

### 4.3 Clientes

#### `GET /v1/clients`

Lista os últimos 200 clientes do utilizador da chave.

#### `POST /v1/clients`

```json
{
  "nome": "Empresa X, Lda",
  "nif": "5400000000",
  "endereco": "Luanda",
  "tipo": "empresa",
  "telefone": "+244923000000",
  "email": "financeiro@empresa.ao"
}
```

Se o cliente já é utilizador Faktura, pode ser identificado directamente pelo
seu ID no momento da emissão (ver 4.5), sem precisar criá-lo primeiro.

---

### 4.4 Produtos

#### `GET /v1/products`

Lista até 500 produtos do utilizador.

#### `POST /v1/products`

```json
{
  "nome": "Serviço de consultoria",
  "codigo": "SERV-001",
  "tipo": "servico",
  "preco_unitario": 25000,
  "unidade": "un",
  "taxa_iva": 14
}
```

---

### 4.5 `POST /v1/invoices`

Emite uma factura em nome do utilizador dono da API key.

**Header opcional:** `x-on-behalf-of: FK-244-XXXXXX` — se a sua chave tem
permissão de marketplace, permite emitir em nome de um vendedor conectado.

**Body:**

```json
{
  "tipo": "fatura",
  "cliente_id": "uuid-ou-null",
  "buyer_faktura_id": "FK-244-000456",
  "data_emissao": "2026-07-04",
  "data_vencimento": "2026-08-04",
  "moeda": "AOA",
  "observacoes": "Encomenda #A123 via marketplace X",
  "itens": [
    {
      "produto_id": "uuid-do-produto",
      "quantidade": 2,
      "preco_unitario": 5000,
      "desconto": 0,
      "taxa_iva": 14
    }
  ]
}
```

- `cliente_id` OU `buyer_faktura_id` são aceites. Se enviar `buyer_faktura_id`
  e o comprador não existir como cliente do vendedor, é criado automaticamente
  a partir do perfil Faktura.
- Tipos aceites: `fatura`, `fatura-recibo`, `recibo`, `nota-credito`,
  `nota-debito`, `fatura-global`, `fatura-generica`, `auto-faturacao`,
  `proforma`, `orcamento`, `guia-remessa`.

**Resposta 201:**

```json
{
  "data": {
    "id": "uuid",
    "numero": "FT/2026/000123",
    "serie": "FT",
    "estado": "emitida",
    "total": 11400,
    "total_iva": 1400,
    "hash_extracto": "abc123...",
    "atcud": "FT-000123",
    "pdf_url": "https://.../v1/invoices/uuid/pdf"
  }
}
```

---

### 4.6 `POST /v1/marketplace/commission-invoice`

**Endpoint dedicado a marketplaces / plataformas de e-commerce.**  
Emite automaticamente a factura da **comissão** que o marketplace cobra a um
vendedor sobre uma venda.

A factura fica registada no SAF-T do marketplace (não do vendedor), e o
vendedor recebe o PDF automaticamente como despesa dedutível.

**Body:**

```json
{
  "seller_faktura_id": "FK-244-000789",
  "order_reference": "ORD-2026-000123",
  "gross_amount": 100000,
  "commission_rate": 0.12,
  "description": "Comissão sobre venda #ORD-2026-000123",
  "data_emissao": "2026-07-04",
  "taxa_iva": 14,
  "metadata": {
    "plataforma": "meu-marketplace.ao",
    "categoria": "electronica"
  }
}
```

- `gross_amount` — valor bruto da venda que o vendedor fez ao consumidor
  final.
- `commission_rate` — percentagem (0.12 = 12 %). Alternativamente pode enviar
  `commission_amount` fixo.

**Resposta 201:**

```json
{
  "data": {
    "id": "uuid",
    "numero": "FT/2026/000045",
    "total": 13680,
    "commission_base": 12000,
    "iva": 1680,
    "pdf_url": "https://.../v1/invoices/uuid/pdf"
  }
}
```

---

### 4.7 Consultar / listar facturas

#### `GET /v1/invoices?from=2026-01-01&to=2026-12-31&tipo=fatura&estado=emitida&buyer=FK-244-000456`

Filtros aceites: `from`, `to`, `tipo`, `estado`, `buyer` (ID Faktura),
`limit` (max 200).

#### `GET /v1/invoices/:id`

Devolve a factura completa com itens e cliente.

---

### 4.8 `GET /v1/invoices/:id/pdf`

Devolve o PDF binário ou uma URL assinada válida por 1 hora
(`?redirect=false` → JSON com `url`).

```bash
curl -L -H "x-api-key: $FKT_KEY" \
  -o factura.pdf \
  https://.../faktura-api/v1/invoices/uuid/pdf
```

O comprador identificado pelo `buyer_faktura_id` da factura também tem
acesso a este PDF através da sua própria chave (chaves de comprador estão
restritas a leitura).

---

### 4.9 `GET /v1/saft/:period`

Gera / descarrega o SAF-T (AO) do utilizador da chave para um período mensal
`YYYY-MM`.

```bash
curl -H "x-api-key: $FKT_KEY" \
  https://.../faktura-api/v1/saft/2026-06 \
  -o saft-2026-06.xml
```

**Resposta:** XML SAF-T assinado, pronto para submissão à AGT.  
Se ainda não existir para o período, é gerado on-demand e cacheado.

Para marketplaces, este endpoint devolve o SAF-T que agrega **todas as
facturas de comissão** emitidas pelo marketplace no período.

---

## 5. Cenários de integração

### 5.1 Marketplace multi-vendedor

**Fluxo por venda:**

1. Comprador finaliza checkout no marketplace.
2. Marketplace chama `POST /v1/invoices` com header
   `x-on-behalf-of: <seller_faktura_id>` para emitir a factura ao consumidor
   em nome do vendedor.
3. Em paralelo, chama `POST /v1/marketplace/commission-invoice` para emitir
   a factura da sua comissão ao vendedor.
4. Fim do mês: `GET /v1/saft/2026-06` para obter o SAF-T do marketplace
   (comissões) — cada vendedor obtém o seu próprio SAF-T das vendas.

### 5.2 E-commerce próprio

Se o e-commerce é operado directamente pelo vendedor (single-tenant),
basta usar `POST /v1/invoices` sem `x-on-behalf-of`. O PDF pode ser
descarregado e anexado ao email de confirmação de encomenda.

### 5.3 POS externo / ERP

Sincronize o catálogo com `GET /v1/products` na inicialização e emita
facturas de cada talão com `POST /v1/invoices` em modo `tipo: "fatura-recibo"`.
Use `x-idempotency-key: <talão_id>` para evitar duplicações em caso de retry.

---

## 6. Webhooks (em breve)

Configure em *API & Integrações* → *Webhooks* uma URL HTTPS para receber:

| Evento | Payload |
|--------|---------|
| `invoice.created` | Factura emitida |
| `invoice.paid` | Marcada como paga |
| `invoice.cancelled` | Anulada |
| `commission.invoice.created` | Comissão de marketplace emitida |
| `saft.generated` | SAF-T mensal disponível |

Assinatura HMAC-SHA256 no header `x-faktura-signature`.

---

## 7. Códigos de erro

| Código | Significado |
|--------|-------------|
| 400 | Body inválido / validação falhou |
| 401 | API key ausente ou inválida |
| 403 | API key revogada ou sem permissão para a operação |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex.: `x-idempotency-key` reutilizado) |
| 422 | Regra de negócio violada (ex.: vendedor suspenso) |
| 429 | Rate limit excedido |
| 500 | Erro interno |

Corpo típico de erro:

```json
{ "error": "Descrição legível", "code": "invalid_body", "field": "itens" }
```

---

## 8. Rate limits

- **Chave standard:** 60 requests / minuto, 5.000 / dia.
- **Chave marketplace:** 300 requests / minuto, 100.000 / dia.

Header de resposta `x-ratelimit-remaining` indica quantas chamadas restam.

---

## 9. Compliance AGT

- Todas as facturas emitidas via API são **assinadas digitalmente com
  RSA-SHA256** e ligadas por hash-chain (cumprindo o Decreto 71/25).
- Cada documento tem `hash_extracto` e `atcud` (código de validação AGT).
- Facturas em estado `emitida` ficam **imutáveis** — só podem ser anuladas
  ou creditadas via nota de crédito.
- Retenção obrigatória de 5 anos garantida pela Faktura.
- QR fiscal embutido no PDF cumpre o formato exigido pela AGT.

---

**Suporte:** `dev@faktura.ao` · **NIF Faktura Angola:** 5002964031  
**Repositório de exemplos:** *disponibilizado no dashboard de API Keys*.
