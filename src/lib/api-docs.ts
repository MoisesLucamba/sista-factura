// Documentação completa da Faktura API — usada para download a partir da página API.
export const API_DOCS_MARKDOWN = `# Faktura API — Documentação

Versão: v1
Base URL: https://ewfjvgzachtonehujvom.supabase.co/functions/v1/faktura-api

## Autenticação

Todas as chamadas exigem o header:

\`\`\`
x-api-key: fkt_live_xxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`

As chaves são geradas na página **API & Integrações** (apenas exibidas uma vez).

## Endpoints

### POST /invoices — Emitir documento
Cria e emite um documento certificado (FT, FR, RC, NC, ND, FG, FGe, AF, PF, OR, GR).

**Body (JSON):**
\`\`\`json
{
  "tipo": "fatura",
  "cliente_id": "uuid-do-cliente",
  "data_vencimento": "2026-07-01",
  "observacoes": "Pagamento a 30 dias",
  "itens": [
    {
      "produto_id": "uuid-produto",
      "quantidade": 2,
      "preco_unitario": 5000,
      "desconto": 0,
      "taxa_iva": 14
    }
  ]
}
\`\`\`

**Resposta 200:**
\`\`\`json
{
  "id": "uuid",
  "numero": "FT 2026/000123",
  "estado": "emitida",
  "total": 11400,
  "pdf_url": "https://.../faturas/uuid.pdf",
  "hash": "abc123...",
  "atcud": "AAAA-000123"
}
\`\`\`

### GET /invoices/:id — Consultar documento

### GET /invoices — Listar documentos
Query params: \`?from=2026-01-01&to=2026-12-31&tipo=fatura&estado=emitida\`

### POST /customers — Criar cliente
\`\`\`json
{ "nome": "Empresa X, Lda", "nif": "5400000000", "endereco": "Luanda", "tipo": "empresa" }
\`\`\`

### GET /customers — Listar clientes

### POST /products — Criar produto

### GET /products — Listar produtos

## Códigos de erro

| Código | Significado |
|--------|-------------|
| 401 | API key ausente ou inválida |
| 403 | API key revogada |
| 400 | Body inválido / validação falhou |
| 404 | Recurso não encontrado |
| 429 | Limite de requisições excedido |
| 500 | Erro interno |

## Tipos de documento suportados (AGT)

- **FT** — Fatura
- **FR** — Fatura-Recibo
- **RC** — Recibo
- **NC** — Nota de Crédito
- **ND** — Nota de Débito
- **FG** — Fatura Global
- **FGe** — Fatura Genérica
- **AF** — Auto-Facturação
- **PF** — Proforma
- **OR** — Orçamento
- **GR** — Guia de Remessa

## Webhooks (em breve)
Configure URL para receber eventos: invoice.created, invoice.paid, invoice.cancelled.

---
© Faktura Angola — Sistema certificado AGT.
`;
