

# Análise de Conformidade AGT — Lacunas Identificadas

Após análise detalhada do código, identifiquei as seguintes não-conformidades com os requisitos da AGT (Decreto Presidencial n.º 71/25 e Decreto Executivo n.º 312/18):

---

## PROBLEMAS CRÍTICOS

### 1. Assinatura Digital NÃO é aplicada nas faturas
O sistema tem `rsa-keygen.ts` para gerar chaves RSA e campos `signature_hash` e `assinatura_digital` na tabela `faturas`, mas **nenhum deles é preenchido** durante a criação da fatura em `useFaturas.ts`. A AGT exige assinatura RSA-SHA256 em todos os documentos fiscais.

**Correcção:** Assinar cada fatura no momento da emissão usando a chave privada do utilizador (armazenada via `agt_config`), e guardar o hash na base de dados.

### 2. Falta encadeamento de hash (Hash Chain)
A AGT exige que cada documento fiscal inclua o hash do documento anterior da mesma série, criando uma cadeia inviolável. O sistema actual não implementa isto.

**Correcção:** Ao criar uma fatura, buscar o `signature_hash` da fatura anterior da mesma série e incluí-lo no cálculo do hash actual.

### 3. QR Code usa ID do utilizador em vez do NIF real
Na linha 160 de `useFaturas.ts`:
```typescript
nif: user!.id.slice(0, 9) // ERRADO - usa UUID
```
Deveria usar o NIF da empresa registado em `agt_config.nif_produtor`.

**Correcção:** Buscar o NIF real do `agt_config` antes de gerar o QR.

### 4. QR Code não segue formato AGT
O QR code deve conter campos específicos exigidos pela AGT: NIF emitente, NIF adquirente, tipo de documento, estado, data, número, ATCUD, hash dos 4 caracteres, total sem IVA, total IVA, total com IVA.

**Correcção:** Reestruturar o payload do QR para incluir todos os campos obrigatórios.

---

## PROBLEMAS IMPORTANTES

### 5. Imutabilidade não é enforçada
O campo `is_locked` existe mas não é activado quando a fatura é emitida, e não há lógica (trigger ou RLS) que impeça a edição de faturas emitidas.

**Correcção:** Definir `is_locked = true` ao emitir e criar trigger SQL que bloqueia updates em faturas locked.

### 6. PDF mostra "IVA 14%" fixo nos totais
A secção de totais do PDF (linha 322) mostra `IVA 14%` hardcoded, mesmo quando os itens têm taxas diferentes (7%, 5%, 2%, 0%). A AGT exige discriminação por taxa.

**Correcção:** Agrupar IVA por taxa e mostrar cada linha separadamente (ex: "IVA 14%: X Kz", "IVA 7%: Y Kz").

### 7. Certificado AGT não é incluído no PDF
O número do certificado do software (`certificate_number` em `agt_config`) não aparece no PDF da fatura, conforme exigido.

**Correcção:** Adicionar no rodapé do PDF: "Software certificado nº [certificate_number]".

### 8. Audit log não é preenchido automaticamente
A tabela `audit_logs` existe mas não é populada quando faturas são criadas, emitidas, pagas ou anuladas.

**Correcção:** Criar trigger SQL ou lógica client-side para registar todas as operações fiscais.

### 9. Notas de crédito sem referência à fatura original
Ao emitir uma nota de crédito, a AGT exige referência ao documento original. O formulário não pede essa informação.

**Correcção:** Adicionar campo obrigatório "Fatura de referência" quando o tipo é `nota-credito`.

### 10. Falta ATCUD (Código Único de Documento)
A AGT pode exigir um código único de documento (ATCUD) por série. O sistema não gera nem inclui este código.

**Correcção:** Gerar ATCUD baseado na série + número sequencial e incluir no QR e no PDF.

---

## Plano de Implementação (por prioridade)

1. **Assinatura digital RSA** — Assinar faturas na emissão com hash chain
2. **QR Code AGT-compliant** — Formato correcto com NIF real e campos obrigatórios
3. **Imutabilidade enforçada** — Trigger SQL para bloquear faturas emitidas
4. **PDF com IVA discriminado** — Agrupar totais por taxa de IVA
5. **Certificado no PDF** — Incluir número do certificado no rodapé
6. **Audit log automático** — Trigger SQL para registar operações
7. **Nota de crédito com referência** — Campo obrigatório para documento original
8. **ATCUD** — Código único por documento

### Detalhes técnicos

**Assinatura + Hash Chain (Migration SQL):**
- Criar função `sign_invoice` que: busca hash anterior da série, concatena dados da fatura, gera hash SHA-256, guarda em `signature_hash`
- Trigger `after insert on faturas` para invocar automaticamente

**Imutabilidade (Migration SQL):**
```
CREATE TRIGGER prevent_locked_invoice_update
BEFORE UPDATE ON faturas
FOR EACH ROW WHEN (OLD.is_locked = true)
EXECUTE FUNCTION block_locked_update();
```

**QR Code (useFaturas.ts):**
- Buscar `agt_config` do utilizador antes de criar fatura
- Construir payload QR com: NIF emitente, NIF cliente, tipo, número, data, totais discriminados, hash (4 chars)

**PDF IVA discriminado (pdf-generator.ts):**
- Agrupar itens por `taxa_iva`
- Mostrar linha separada para cada taxa nos totais

