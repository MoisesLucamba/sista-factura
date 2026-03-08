import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from './format';

/* ══════════════════════════════════════════════════════════════════
   FAKTURA — PDF v4.0  "Ultra Clean"
   Princípios:
   • Branco total — zero fundos cinza, zero cards, zero bordas duplas
   • Âmbar APENAS onde importa: topo, total, separador, barra tabela
   • Tipografia limpa: hierarquia por tamanho e peso, não por caixas
   • Espaço generoso — uma fatura que respira
   ══════════════════════════════════════════════════════════════════ */

// ── Paleta minimalista ────────────────────────────────────────────
const AMBER  : [number,number,number] = [245, 166,  35];
const INK    : [number,number,number] = [ 20,  20,  30];
const DARK   : [number,number,number] = [ 28,  28,  40];   // header
const MUTED  : [number,number,number] = [120, 120, 135];
const RULE   : [number,number,number] = [230, 230, 235];   // linhas finas
const ROW_ALT: [number,number,number] = [250, 250, 252];   // zebra subtil
const WHITE  : [number,number,number] = [255, 255, 255];

// ── Estado pills ──────────────────────────────────────────────────
const ESTADO_BG: Record<string,[number,number,number]> = {
  paga    : [220, 252, 231],
  emitida : [254, 249, 215],
  vencida : [254, 228, 228],
  anulada : [240, 240, 242],
  rascunho: [240, 240, 242],
};
const ESTADO_FG: Record<string,[number,number,number]> = {
  paga    : [ 22, 163,  74],
  emitida : [161,  98,   7],
  vencida : [185,  28,  28],
  anulada : [100, 100, 110],
  rascunho: [100, 100, 110],
};
const ESTADO_LABEL: Record<string,string> = {
  paga:'Paga', emitida:'Emitida', vencida:'Vencida', anulada:'Anulada', rascunho:'Rascunho',
};

const TIPO_LABEL: Record<string,string> = {
  'fatura'       : 'FATURA',
  'fatura-recibo': 'FATURA-RECIBO',
  'recibo'       : 'RECIBO',
  'nota-credito' : 'NOTA DE CRÉDITO',
  'proforma'     : 'FATURA PROFORMA',
};

// ── Tipos ─────────────────────────────────────────────────────────
export interface CompanyInfo {
  nome_empresa?:        string;
  nif_produtor?:        string;
  endereco_empresa?:    string;
  telefone?:            string;
  email?:               string;
  website?:             string;
  morada?:              string;
  cidade?:              string;
  provincia?:           string;
  actividade_comercial?:string;
  alvara_comercial?:    string;
  logo_url?:            string;
  certificate_number?:  string;
}

/* ════════════════════════════════════════════════════════════════ */
export async function generateInvoicePDF(
  fatura: Fatura,
  companyInfo?: CompanyInfo
): Promise<Blob> {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W  = doc.internal.pageSize.getWidth();   // 210
  const H  = doc.internal.pageSize.getHeight();  // 297
  const ML = 18;   // margem esquerda
  const MR = 18;   // margem direita
  let   y  = 0;

  /* ── Helpers ─────────────────────────────────────────────────── */
  const fc = (c: [number,number,number]) => doc.setFillColor(...c);
  const tc = (c: [number,number,number]) => doc.setTextColor(...c);
  const dc = (c: [number,number,number]) => doc.setDrawColor(...c);
  const B  = () => doc.setFont('helvetica', 'bold');
  const N  = () => doc.setFont('helvetica', 'normal');
  const sz = (n: number) => doc.setFontSize(n);

  // Linha horizontal fina
  const rule = (yy: number, color = RULE, lw = 0.2) => {
    dc(color); doc.setLineWidth(lw); doc.line(ML, yy, W - MR, yy);
  };

  // Pill de estado (pequena)
  const statePill = (label: string, x: number, yy: number, bg: [number,number,number], fg: [number,number,number]) => {
    const tw = doc.getTextWidth(label);
    const pw = tw + 7; const ph = 5.8;
    fc(bg); doc.roundedRect(x, yy - 4.2, pw, ph, 1.2, 1.2, 'F');
    tc(fg); sz(7); B(); doc.text(label, x + pw / 2, yy, { align: 'center' });
    N();
  };

  /* ── Dados empresa ───────────────────────────────────────────── */
  const compName  = (companyInfo?.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  const compNif   = companyInfo?.nif_produtor  || '';
  const compAddr  = [
    companyInfo?.morada || companyInfo?.endereco_empresa,
    companyInfo?.cidade, companyInfo?.provincia,
  ].filter(Boolean).join(', ');
  const compPhone = companyInfo?.telefone       || '';
  const compEmail = companyInfo?.email          || '';
  const compAlv   = companyInfo?.alvara_comercial || '';
  const compLogo  = companyInfo?.logo_url;
  const compCert  = companyInfo?.certificate_number || '';

  const tipoLabel  = TIPO_LABEL[fatura.tipo] || 'FATURA';
  const isProforma = fatura.tipo === 'proforma';

  /* ════════════════════════════════════════════════════════════
     ① FUNDO — branco puro
  ════════════════════════════════════════════════════════════ */
  fc(WHITE); doc.rect(0, 0, W, H, 'F');

  /* ════════════════════════════════════════════════════════════
     ② CABEÇALHO ESCURO  (0 → 48mm)
        Só dois elementos: faixa âmbar 3mm no topo, bloco ink
  ════════════════════════════════════════════════════════════ */
  // Bloco escuro
  fc(DARK); doc.rect(0, 0, W, 50, 'F');
  // Faixa âmbar — 3mm topo
  fc(AMBER); doc.rect(0, 0, W, 3, 'F');

  // Logo (opcional)
  let logoEnd = ML;
  if (compLogo) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((ok, no) => { img.onload = () => ok(); img.onerror = () => no(); img.src = compLogo; });
      doc.addImage(img, 'PNG', ML, 9, 15, 15);
      logoEnd = ML + 19;
    } catch { /* skip */ }
  }

  // Nome empresa — grande, branco
  tc(WHITE); sz(15); B();
  doc.text(compName, logoEnd, 19);

  // Info empresa — 1–2 linhas, cinzento claro
  tc([150, 150, 165] as [number,number,number]); sz(7.5); N();
  const line1 = [compNif ? `NIF: ${compNif}` : '', compAddr].filter(Boolean).join('   ');
  const line2 = [compPhone, compEmail, compAlv ? `Alvará: ${compAlv}` : ''].filter(Boolean).join('   ');
  if (line1) doc.text(line1, logoEnd, 26);
  if (line2) doc.text(line2, logoEnd, 31.5);

  // ── Lado direito: tipo em pill âmbar + número + data ──────────
  // Pill tipo
  const pillTw = doc.getTextWidth(tipoLabel) + 12;
  fc(AMBER);
  doc.roundedRect(W - MR - pillTw, 7, pillTw, 9, 1.8, 1.8, 'F');
  tc(INK); sz(8.5); B();
  doc.text(tipoLabel, W - MR - pillTw / 2, 13, { align: 'center' });

  // Número — grande
  tc(WHITE); sz(20); B();
  doc.text(fatura.numero, W - MR, 30, { align: 'right' });

  // Data de emissão
  tc([130, 130, 148] as [number,number,number]); sz(7.5); N();
  doc.text(`Emitido em ${formatDate(fatura.data_emissao)}`, W - MR, 37, { align: 'right' });

  y = 55;

  /* ════════════════════════════════════════════════════════════
     ③ BANNER PROFORMA
  ════════════════════════════════════════════════════════════ */
  if (isProforma) {
    fc([255, 244, 204] as [number,number,number]); doc.rect(0, y, W, 7.5, 'F');
    fc(AMBER); doc.rect(0, y, 3.5, 7.5, 'F');
    tc([140, 82, 0] as [number,number,number]); sz(7); B();
    doc.text('DOCUMENTO PROFORMA — NÃO VÁLIDO COMO DOCUMENTO FISCAL', W / 2, y + 5, { align: 'center' });
    y += 12;
  }

  /* ════════════════════════════════════════════════════════════
     ④ CLIENTE  +  DETALHES  — sem nenhuma borda, tipografia pura
  ════════════════════════════════════════════════════════════ */
  y += 6;

  // Label "CLIENTE" âmbar pequeno
  tc(AMBER); sz(6.5); B();
  doc.text('CLIENTE', ML, y);
  y += 5.5;

  // Nome do cliente — destaque
  tc(INK); sz(11); B();
  doc.text(fatura.cliente?.nome || 'Consumidor Final', ML, y);
  y += 5.5;

  // Info cliente em linha única
  N(); sz(8); tc(MUTED);
  const cParts: string[] = [];
  if (fatura.cliente?.nif)      cParts.push(`NIF ${fatura.cliente.nif}`);
  if (fatura.cliente?.endereco) cParts.push(fatura.cliente.endereco);
  if (fatura.cliente?.telefone) cParts.push(fatura.cliente.telefone);
  if (fatura.cliente?.email)    cParts.push(fatura.cliente.email);
  if (cParts.length) {
    doc.text(cParts.join('   ·   '), ML, y);
  }

  // ── Detalhes (coluna direita, mesmo nível vertical) ───────────
  const dX  = W / 2 + 5;
  const dY0 = y - 11;   // alinhado com o nome do cliente

  // 3 colunas: Emissão / Vencimento / Estado
  sz(6.5); B(); tc(MUTED);
  doc.text('EMISSÃO',    dX,       dY0);
  doc.text('VENCIMENTO', dX + 36,  dY0);
  doc.text('ESTADO',     dX + 76,  dY0);

  sz(8.5); N(); tc(INK);
  doc.text(formatDate(fatura.data_emissao),    dX,      dY0 + 6);
  doc.text(formatDate(fatura.data_vencimento), dX + 36, dY0 + 6);

  const eLabel = ESTADO_LABEL[fatura.estado] || fatura.estado;
  statePill(
    eLabel, dX + 76, dY0 + 6,
    ESTADO_BG[fatura.estado] || [240,240,242],
    ESTADO_FG[fatura.estado] || [100,100,110]
  );

  y += 10;

  /* ════════════════════════════════════════════════════════════
     ⑤ SEPARADOR fino
  ════════════════════════════════════════════════════════════ */
  rule(y, RULE, 0.3);
  y += 7;

  /* ════════════════════════════════════════════════════════════
     ⑥ TABELA
     Header: fundo âmbar pálido + barra âmbar esquerda 3px
     Linhas: zero bordas, só zebra muito subtil + linha inferior fina
  ════════════════════════════════════════════════════════════ */

  // Colunas X (right-aligned excepto Descrição)
  const xD  = ML;           // descrição (left)
  const xQ  = ML + 94;      // qty
  const xPU = ML + 118;     // preço unit
  const xIV = ML + 144;     // iva
  const xDC = ML + 158;     // desconto
  const xT  = W - MR;       // total

  // Header row
  const HDR_H = 8.5;
  fc([252, 246, 222] as [number,number,number]);
  doc.rect(ML, y, W - ML - MR, HDR_H, 'F');
  // Barra âmbar esquerda
  fc(AMBER); doc.rect(ML, y, 3, HDR_H, 'F');

  sz(6.8); B(); tc(INK);
  const yHdr = y + 5.8;
  doc.text('DESCRIÇÃO',   xD + 6,  yHdr);
  doc.text('QTD',         xQ,      yHdr, { align: 'right' });
  doc.text('PREÇO UNIT.', xPU,     yHdr, { align: 'right' });
  doc.text('IVA',         xIV,     yHdr, { align: 'right' });
  doc.text('DESC.',       xDC,     yHdr, { align: 'right' });
  doc.text('TOTAL',       xT,      yHdr, { align: 'right' });
  y += HDR_H + 2;

  // Itens
  const items = fatura.itens || [];
  const ROW_H = 8;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Zebra alternada — apenas fundo muito subtil
    if (i % 2 !== 0) {
      fc(ROW_ALT); doc.rect(ML, y - 1.5, W - ML - MR, ROW_H, 'F');
    }

    // Linha inferior fina
    rule(y + ROW_H - 2, RULE, 0.15);

    const name  = item.produto?.nome || 'Produto';
    const trunc = name.length > 54 ? name.slice(0, 51) + '...' : name;

    // Descrição — bold ink
    B(); sz(8.5); tc(INK);
    doc.text(trunc, xD + 6, y + 4);

    // Valores — normal muted
    N(); tc(MUTED);
    doc.text(String(item.quantidade),             xQ,  y + 4, { align: 'right' });
    doc.text(formatCurrency(item.preco_unitario), xPU, y + 4, { align: 'right' });
    doc.text(`${item.taxa_iva}%`,                 xIV, y + 4, { align: 'right' });
    doc.text(`${item.desconto || 0}%`,            xDC, y + 4, { align: 'right' });

    // Total — bold ink
    B(); tc(INK);
    doc.text(formatCurrency(item.total), xT, y + 4, { align: 'right' });

    y += ROW_H;
  }

  // Fechar tabela: linha âmbar
  dc(AMBER); doc.setLineWidth(0.7);
  doc.line(ML, y, W - MR, y);
  y += 12;

  /* ════════════════════════════════════════════════════════════
     ⑦ TOTAIS — IVA discriminado por taxa (AGT-compliant)
  ════════════════════════════════════════════════════════════ */
  const tLX = W - MR - 75;
  const tVX = W - MR;

  sz(8.5);
  // Subtotal
  N(); tc(MUTED); doc.text('Subtotal', tLX, y);
  B(); tc(INK);   doc.text(formatCurrency(fatura.subtotal), tVX, y, { align: 'right' });
  y += 6.5;

  // IVA discriminado por taxa
  const ivaByRate: Record<number, number> = {};
  for (const item of items) {
    const rate = item.taxa_iva || 0;
    ivaByRate[rate] = (ivaByRate[rate] || 0) + (item.valor_iva || 0);
  }
  const sortedRates = Object.keys(ivaByRate).map(Number).sort((a, b) => b - a);
  
  for (const rate of sortedRates) {
    const label = rate === 0 ? 'IVA Isento' : `IVA ${rate}%`;
    N(); tc(MUTED); doc.text(label, tLX, y);
    B(); tc(INK);   doc.text(formatCurrency(ivaByRate[rate]), tVX, y, { align: 'right' });
    y += 6.5;
  }

  // If no items, show single IVA line
  if (sortedRates.length === 0) {
    N(); tc(MUTED); doc.text('IVA', tLX, y);
    B(); tc(INK);   doc.text(formatCurrency(fatura.total_iva), tVX, y, { align: 'right' });
    y += 6.5;
  }

  y -= 1.5;

  // Linha âmbar — apenas entre IVA e Total
  dc(AMBER); doc.setLineWidth(0.7);
  doc.line(tLX, y, tVX, y);
  y += 8;

  // Total — maior, âmbar
  sz(13); B();
  tc(INK);   doc.text('TOTAL A PAGAR', tLX, y);
  tc(AMBER); doc.text(formatCurrency(fatura.total), tVX, y, { align: 'right' });
  y += 14;

  /* ════════════════════════════════════════════════════════════
     ⑧ OBSERVAÇÕES + MÉTODO PAGAMENTO — linha simples
  ════════════════════════════════════════════════════════════ */
  if (fatura.observacoes || fatura.metodo_pagamento) {
    rule(y, RULE, 0.25);
    y += 7;

    if (fatura.observacoes) {
      sz(6.5); B(); tc(AMBER); doc.text('OBSERVAÇÕES', ML, y);
      y += 5;
      N(); sz(8); tc(MUTED);
      const obs = doc.splitTextToSize(fatura.observacoes, W - ML - MR - 60);
      doc.text(obs, ML, y);
      y += obs.length * 4.2 + 4;
    }

    if (fatura.metodo_pagamento) {
      sz(6.5); B(); tc(MUTED); doc.text('MÉTODO DE PAGAMENTO', ML, y);
      y += 5;
      N(); sz(8.5); tc(INK); doc.text(fatura.metodo_pagamento, ML, y);
    }
  }

  /* ════════════════════════════════════════════════════════════
     ⑨ QR CODE — canto inferior esquerdo, bem acima do rodapé
     QR: 32×32mm, começa a H-65 → termina a H-33 → rodapé a H-20
  ════════════════════════════════════════════════════════════ */
  const QR_SIZE  = 32;          // tamanho do QR em mm
  const QR_TOP   = H - 65;      // começa bem acima do rodapé
  const RULE_Y   = QR_TOP - 8;  // linha separadora acima do QR

  rule(RULE_Y, RULE, 0.25);

  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero, data: fatura.data_emissao,
      total: fatura.total, nif_emitente: compNif,
    });
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 260, margin: 1,
      color: { dark: '#14141E', light: '#FFFFFF' },
    });
    doc.addImage(qrUrl, 'PNG', ML, QR_TOP, QR_SIZE, QR_SIZE);

    // Texto ao lado do QR
    sz(7); B(); tc(INK);
    doc.text('Código QR de Verificação', ML + QR_SIZE + 5, QR_TOP + 8);
    sz(7); N(); tc(MUTED);
    doc.text('Digitalize para validar este documento', ML + QR_SIZE + 5, QR_TOP + 14);
    doc.text(`Fatura: ${fatura.numero}`, ML + QR_SIZE + 5, QR_TOP + 20);
  } catch { /* skip */ }

  /* ════════════════════════════════════════════════════════════
     ⑩ RODAPÉ — escuro + linha âmbar topo  (H-20 → fundo)
  ════════════════════════════════════════════════════════════ */
  fc(DARK);  doc.rect(0, H - 20, W, 20, 'F');
  fc(AMBER); doc.rect(0, H - 20, W, 1.5, 'F');

  sz(6.5); N(); tc([150, 150, 165] as [number,number,number]);
  doc.text(
    `${compName} — Sistema de Faturação Certificado  ·  Emitido em ${formatDate(fatura.data_emissao)}`,
    W / 2, H - 13, { align: 'center' }
  );
  sz(5.5);
  doc.text(
    'Documento válido para efeitos fiscais na República de Angola',
    W / 2, H - 8.5, { align: 'center' }
  );
  sz(5);
  doc.text(
    `Faktura Angola © ${new Date().getFullYear()} — Todos os direitos reservados`,
    W / 2, H - 4.5, { align: 'center' }
  );

  // Marca FAKTURA canto direito
  sz(8.5); B(); tc(AMBER);
  doc.text('FAKTURA', W - MR, H - 13, { align: 'right' });
  sz(6); N(); tc([95, 95, 115] as [number,number,number]);
  doc.text('faktura.ao', W - MR, H - 8.5, { align: 'right' });

  return doc.output('blob');
}

/* ═══════════════════════════════════════════════════════════════ */
function formatDate(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('pt-AO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function downloadInvoicePDF(blob: Blob, filename: string) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}