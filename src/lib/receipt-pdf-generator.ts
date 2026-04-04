import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from './format';
import type { CompanyInfo } from './pdf-generator';

/* ══════════════════════════════════════════════════════════════════
   FAKTURA — Thermal Receipt & Medium Format PDF Generators
   Supports: 58mm, 80mm (thermal), 76mm (medium label)
   ══════════════════════════════════════════════════════════════════ */

const INK: [number, number, number] = [20, 20, 30];
const MUTED: [number, number, number] = [100, 100, 110];
const WHITE: [number, number, number] = [255, 255, 255];

type PaperWidth = '58mm' | '80mm' | '76mm';

const PAPER_MM: Record<PaperWidth, number> = {
  '58mm': 48, // printable area ~48mm
  '80mm': 72, // printable area ~72mm
  '76mm': 66, // printable area ~66mm
};

function fmtDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
}

function fmtKz(v: number): string {
  return formatCurrency(v).replace(/\s+/g, '');
}

/* ═══════════════════════════════════════════════════════════════
   THERMAL RECEIPT — 58mm / 80mm
   ═══════════════════════════════════════════════════════════════ */
export async function generateThermalReceiptPDF(
  fatura: Fatura,
  companyInfo?: CompanyInfo,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<Blob> {
  const W = PAPER_MM[paperWidth];
  const ML = 2;
  const MR = 2;
  const PW = W - ML - MR; // printable width
  const is80 = paperWidth === '80mm';

  // Start with tall page, we'll trim later
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, 500] });
  let y = 3;

  const tc = (c: [number, number, number]) => doc.setTextColor(...c);
  const B = () => doc.setFont('courier', 'bold');
  const N = () => doc.setFont('courier', 'normal');
  const sz = (n: number) => doc.setFontSize(n);
  const center = (text: string, yy: number) => doc.text(text, W / 2, yy, { align: 'center' });
  const left = (text: string, yy: number) => doc.text(text, ML, yy);
  const right = (text: string, yy: number) => doc.text(text, W - MR, yy, { align: 'right' });
  const dashes = (yy: number) => {
    const dash = is80 ? '═'.repeat(36) : '═'.repeat(24);
    center(dash, yy);
  };
  const thinDashes = (yy: number) => {
    const dash = is80 ? '─'.repeat(36) : '─'.repeat(24);
    center(dash, yy);
  };

  const compName = (companyInfo?.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  const compAddr = [
    companyInfo?.morada || companyInfo?.endereco_empresa,
    companyInfo?.cidade,
  ].filter(Boolean).join(', ');

  tc(INK);

  // ── Header ──
  sz(is80 ? 10 : 8); B();
  dashes(y); y += 4;

  if (is80) {
    // Larger header for 80mm
    sz(12); B();
    center('FAKTURA ANGOLA', y); y += 5;
    sz(7); N();
    center('www.faktura.ao', y); y += 4;
  } else {
    sz(9); B();
    center('FAKTURA ANGOLA', y); y += 4;
    sz(6); N();
    center('www.faktura.ao', y); y += 3.5;
  }

  sz(is80 ? 7 : 6); N();
  dashes(y); y += 4;

  // Merchant info
  sz(is80 ? 8 : 7); B();
  center(compName, y); y += 3.5;

  sz(is80 ? 7 : 6); N();
  if (compAddr) { center(compAddr, y); y += 3; }
  if (companyInfo?.nif_produtor) { center(`NIF: ${companyInfo.nif_produtor}`, y); y += 3; }
  if (companyInfo?.telefone) { center(`Tel: ${companyInfo.telefone}`, y); y += 3; }

  // Date/Time line
  const dateStr = fmtDate(fatura.data_emissao);
  const timeStr = fmtTime(fatura.created_at || fatura.data_emissao);
  left(dateStr, y); right(timeStr, y); y += 3.5;

  // Invoice number
  sz(is80 ? 8 : 7); B();
  center(fatura.numero, y); y += 4;

  sz(is80 ? 7 : 6); N();
  dashes(y); y += 4;

  // ── Products header ──
  sz(is80 ? 7 : 6); B();
  if (is80) {
    left('PRODUTO', y);
    doc.text('QTD', W / 2, y, { align: 'center' });
    right('PREÇO', y);
  } else {
    left('PRODUTO', y);
    right('PREÇO', y);
  }
  y += 3;
  thinDashes(y); y += 3;

  // ── Products ──
  const items = fatura.itens || [];
  sz(is80 ? 7 : 6); N();

  for (const item of items) {
    const name = item.produto?.nome || 'Produto';
    const maxLen = is80 ? 22 : 14;
    const truncName = name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
    const qty = String(item.quantidade);
    const price = fmtKz(item.total);

    if (is80) {
      // Name    Qty    Price on one line
      left(truncName, y);
      doc.text(qty, W / 2, y, { align: 'center' });
      right(price, y);
      y += 3.5;
      // Show unit price on second line if space
      sz(6); tc(MUTED);
      left(`  ${fmtKz(item.preco_unitario)} x ${qty}`, y);
      y += 3;
      sz(7); tc(INK);
    } else {
      left(truncName, y);
      const qtyPrice = `${qty} ${price}`;
      right(qtyPrice, y);
      y += 3.5;
    }
  }

  thinDashes(y); y += 3.5;

  // ── Totals ──
  sz(is80 ? 7 : 6); N();
  left('SUBTOTAL:', y); right(fmtKz(Number(fatura.subtotal)), y); y += 3.5;

  // IVA breakdown
  const ivaByRate: Record<number, number> = {};
  for (const item of items) {
    const rate = item.taxa_iva || 0;
    ivaByRate[rate] = (ivaByRate[rate] || 0) + (item.valor_iva || 0);
  }
  for (const [rate, val] of Object.entries(ivaByRate)) {
    const label = Number(rate) === 0 ? 'IVA ISENTO:' : `IVA (${rate}%):`;
    left(label, y); right(fmtKz(val), y); y += 3.5;
  }
  if (Object.keys(ivaByRate).length === 0) {
    left(`IVA (14%):`, y); right(fmtKz(Number(fatura.total_iva)), y); y += 3.5;
  }

  sz(is80 ? 9 : 7); B();
  dashes(y); y += 4;
  left('TOTAL:', y); right(fmtKz(Number(fatura.total)), y); y += 4;
  dashes(y); y += 4;

  // ── Payment & Buyer ──
  sz(is80 ? 7 : 6); N();
  if (fatura.metodo_pagamento) {
    left(`MÉTODO: ${fatura.metodo_pagamento}`, y); y += 3.5;
  }
  if (fatura.buyer_faktura_id) {
    left(`COMPRADOR: ${fatura.buyer_faktura_id}`, y); y += 3.5;
  }
  if (fatura.cliente?.nome && fatura.cliente.nome !== 'Consumidor Final') {
    left(`CLIENTE: ${fatura.cliente.nome}`, y); y += 3.5;
  }

  dashes(y); y += 4;

  // ── Footer message ──
  sz(is80 ? 7 : 6); N();
  center('Obrigado pela sua preferência!', y); y += 3.5;
  sz(is80 ? 6 : 5.5); B();
  center('Sem a Faktura, não fakturo.', y); y += 4;

  dashes(y); y += 4;

  // ── QR Code ──
  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero, total: fatura.total,
      data: fatura.data_emissao,
    });
    const qrSize = is80 ? 28 : 20;
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 200, margin: 1,
      color: { dark: '#14141E', light: '#FFFFFF' },
    });
    doc.addImage(qrUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize);
    y += qrSize + 3;
  } catch { /* skip */ }

  dashes(y); y += 5;

  // Trim page to actual content height
  const finalDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, y + 2] });
  finalDoc.setFillColor(...WHITE);
  finalDoc.rect(0, 0, W, y + 2, 'F');

  // Re-render on trimmed page
  return generateThermalReceiptPDF_internal(fatura, companyInfo, paperWidth);
}

// Internal: renders to correct-sized page
async function generateThermalReceiptPDF_internal(
  fatura: Fatura,
  companyInfo?: CompanyInfo,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<Blob> {
  const W = PAPER_MM[paperWidth];
  const ML = 2;
  const MR = 2;
  const is80 = paperWidth === '80mm';

  // First pass: calculate height
  let height = estimateReceiptHeight(fatura, is80);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, height] });
  let y = 3;

  const tc = (c: [number, number, number]) => doc.setTextColor(...c);
  const B = () => doc.setFont('courier', 'bold');
  const N = () => doc.setFont('courier', 'normal');
  const sz = (n: number) => doc.setFontSize(n);
  const center = (text: string, yy: number) => doc.text(text, W / 2, yy, { align: 'center' });
  const left = (text: string, yy: number) => doc.text(text, ML, yy);
  const right = (text: string, yy: number) => doc.text(text, W - MR, yy, { align: 'right' });
  const sep = is80 ? '================================' : '========================';
  const thin = is80 ? '--------------------------------' : '------------------------';

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, W, height, 'F');

  const compName = (companyInfo?.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  const compAddr = [companyInfo?.morada || companyInfo?.endereco_empresa, companyInfo?.cidade].filter(Boolean).join(', ');

  tc(INK);

  // Header
  sz(is80 ? 7 : 6); N(); center(sep, y); y += 4;
  sz(is80 ? 11 : 9); B(); center('FAKTURA ANGOLA', y); y += is80 ? 5 : 4;
  sz(is80 ? 7 : 6); N(); center('www.faktura.ao', y); y += is80 ? 4 : 3.5;
  center(sep, y); y += 4;

  // Merchant
  sz(is80 ? 8 : 7); B(); center(compName, y); y += 3.5;
  sz(is80 ? 7 : 6); N();
  if (compAddr) { center(compAddr, y); y += 3; }
  if (companyInfo?.nif_produtor) { center(`NIF: ${companyInfo.nif_produtor}`, y); y += 3; }
  if (companyInfo?.telefone) { center(`Tel: ${companyInfo.telefone}`, y); y += 3; }

  left(fmtDate(fatura.data_emissao), y);
  right(fmtTime(fatura.created_at || fatura.data_emissao), y);
  y += 3.5;

  sz(is80 ? 8 : 7); B(); center(fatura.numero, y); y += 4;
  sz(is80 ? 7 : 6); N(); center(sep, y); y += 4;

  // Products header
  B();
  left('PRODUTO', y);
  if (is80) { doc.text('QTD', W / 2, y, { align: 'center' }); }
  right('PREÇO', y);
  y += 3; N(); center(thin, y); y += 3;

  // Products
  const items = fatura.itens || [];
  for (const item of items) {
    const name = item.produto?.nome || 'Produto';
    const maxLen = is80 ? 22 : 14;
    const truncName = name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;

    N(); tc(INK);
    if (is80) {
      left(truncName, y);
      doc.text(String(item.quantidade), W / 2, y, { align: 'center' });
      right(fmtKz(item.total), y);
      y += 3.5;
      sz(6); tc(MUTED);
      left(`  ${fmtKz(item.preco_unitario)} x ${item.quantidade}`, y);
      y += 3; sz(is80 ? 7 : 6); tc(INK);
    } else {
      left(truncName, y);
      right(`${item.quantidade} ${fmtKz(item.total)}`, y);
      y += 3.5;
    }
  }

  center(thin, y); y += 3.5;

  // Totals
  N();
  left('SUBTOTAL:', y); right(fmtKz(Number(fatura.subtotal)), y); y += 3.5;

  const ivaByRate: Record<number, number> = {};
  for (const item of items) {
    const rate = item.taxa_iva || 0;
    ivaByRate[rate] = (ivaByRate[rate] || 0) + (item.valor_iva || 0);
  }
  for (const [rate, val] of Object.entries(ivaByRate)) {
    const label = Number(rate) === 0 ? 'IVA ISENTO:' : `IVA (${rate}%):`;
    left(label, y); right(fmtKz(val), y); y += 3.5;
  }
  if (Object.keys(ivaByRate).length === 0) {
    left('IVA (14%):', y); right(fmtKz(Number(fatura.total_iva)), y); y += 3.5;
  }

  sz(is80 ? 9 : 7); B();
  center(sep, y); y += 4;
  left('TOTAL:', y); right(fmtKz(Number(fatura.total)), y); y += 4;
  center(sep, y); y += 4;

  // Payment & buyer
  sz(is80 ? 7 : 6); N();
  if (fatura.metodo_pagamento) { left(`MÉTODO: ${fatura.metodo_pagamento}`, y); y += 3.5; }
  if (fatura.buyer_faktura_id) { left(`COMPRADOR: ${fatura.buyer_faktura_id}`, y); y += 3.5; }
  if (fatura.cliente?.nome && fatura.cliente.nome !== 'Consumidor Final') {
    left(`CLIENTE: ${fatura.cliente.nome}`, y); y += 3.5;
  }
  center(sep, y); y += 4;

  // Footer
  N(); center('Obrigado pela sua preferência!', y); y += 3.5;
  B(); sz(is80 ? 6.5 : 5.5); center('Sem a Faktura, não fakturo.', y); y += 4;
  center(sep, y); y += 4;

  // QR Code
  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero, total: fatura.total, data: fatura.data_emissao,
    });
    const qrSize = is80 ? 26 : 18;
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 200, margin: 1, color: { dark: '#14141E', light: '#FFFFFF' },
    });
    doc.addImage(qrUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize);
    y += qrSize + 2;
  } catch { /* skip */ }

  N(); sz(is80 ? 6 : 5); center(sep, y);

  return doc.output('blob');
}

function estimateReceiptHeight(fatura: Fatura, is80: boolean): number {
  const items = fatura.itens || [];
  let h = 60; // header
  h += items.length * (is80 ? 6.5 : 3.5); // products
  h += 35; // totals
  h += 15; // payment/buyer
  h += 15; // footer
  h += is80 ? 32 : 24; // QR
  h += 10; // padding
  return Math.max(h, 80);
}

/* ═══════════════════════════════════════════════════════════════
   MEDIUM FORMAT — 76mm (3-inch printers)
   ═══════════════════════════════════════════════════════════════ */
export async function generateMediumFormatPDF(
  fatura: Fatura,
  companyInfo?: CompanyInfo
): Promise<Blob> {
  const W = PAPER_MM['76mm'];
  const ML = 3;
  const MR = 3;
  const PW = W - ML - MR;

  let height = estimateMediumHeight(fatura);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, height] });
  let y = 4;

  const tc = (c: [number, number, number]) => doc.setTextColor(...c);
  const B = () => doc.setFont('helvetica', 'bold');
  const N = () => doc.setFont('helvetica', 'normal');
  const sz = (n: number) => doc.setFontSize(n);
  const center = (text: string, yy: number) => doc.text(text, W / 2, yy, { align: 'center' });
  const left = (text: string, yy: number) => doc.text(text, ML, yy);
  const right = (text: string, yy: number) => doc.text(text, W - MR, yy, { align: 'right' });
  const rule = (yy: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(ML, yy, W - MR, yy);
  };
  const thickRule = (yy: number) => {
    doc.setDrawColor(245, 166, 35);
    doc.setLineWidth(0.5);
    doc.line(ML, yy, W - MR, yy);
  };

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, W, height, 'F');

  const compName = (companyInfo?.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  const compAddr = [companyInfo?.morada || companyInfo?.endereco_empresa, companyInfo?.cidade, companyInfo?.provincia].filter(Boolean).join(', ');

  tc(INK);

  // ── Header ──
  // Amber top bar
  doc.setFillColor(245, 166, 35);
  doc.rect(0, 0, W, 2, 'F');
  y = 6;

  sz(11); B(); center('FAKTURA ANGOLA', y); y += 5;
  sz(7); N(); center('www.faktura.ao', y); y += 4;
  thickRule(y); y += 4;

  // Merchant block
  sz(9); B(); center(compName, y); y += 4;
  sz(7); N(); tc(MUTED);
  if (compAddr) { center(compAddr, y); y += 3.5; }
  if (companyInfo?.nif_produtor) { center(`NIF: ${companyInfo.nif_produtor}`, y); y += 3.5; }
  const contactLine = [companyInfo?.telefone, companyInfo?.email].filter(Boolean).join(' · ');
  if (contactLine) { center(contactLine, y); y += 3.5; }
  tc(INK);

  rule(y); y += 4;

  // Invoice details
  sz(8); B();
  left(fatura.numero, y);
  right(fmtDate(fatura.data_emissao), y);
  y += 4;

  // Buyer info
  sz(7); N(); tc(MUTED);
  if (fatura.cliente?.nome) {
    left(`Cliente: ${fatura.cliente.nome}`, y); y += 3.5;
  }
  if (fatura.buyer_faktura_id) {
    left(`Faktura ID: ${fatura.buyer_faktura_id}`, y); y += 3.5;
  }
  if (fatura.cliente?.nif) {
    left(`NIF: ${fatura.cliente.nif}`, y); y += 3.5;
  }
  tc(INK);

  rule(y); y += 4;

  // ── Products ──
  sz(7); B();
  left('DESCRIÇÃO', y); right('TOTAL', y); y += 3;
  rule(y); y += 3;

  const items = fatura.itens || [];
  N(); sz(7);
  for (const item of items) {
    const name = item.produto?.nome || 'Produto';
    const truncName = name.length > 28 ? name.slice(0, 25) + '…' : name;

    B(); tc(INK);
    left(truncName, y); right(fmtKz(item.total), y); y += 3.5;

    // Second line: details
    N(); sz(6); tc(MUTED);
    const detail = `${fmtKz(item.preco_unitario)} x ${item.quantidade}`;
    const extras: string[] = [detail];
    if (item.desconto > 0) extras.push(`Desc: ${item.desconto}%`);
    extras.push(`IVA: ${item.taxa_iva}%`);
    left(extras.join('  ·  '), y);
    y += 3.5;
    sz(7); tc(INK);
  }

  rule(y); y += 4;

  // ── Totals ──
  sz(7); N();
  left('Subtotal', y); right(fmtKz(Number(fatura.subtotal)), y); y += 3.5;

  // IVA breakdown
  const ivaByRate: Record<number, number> = {};
  for (const item of items) {
    const rate = item.taxa_iva || 0;
    ivaByRate[rate] = (ivaByRate[rate] || 0) + (item.valor_iva || 0);
  }
  for (const [rate, val] of Object.entries(ivaByRate)) {
    const label = Number(rate) === 0 ? 'IVA Isento' : `IVA ${rate}%`;
    left(label, y); right(fmtKz(val), y); y += 3.5;
  }

  thickRule(y); y += 4;
  sz(10); B();
  left('TOTAL', y); right(fmtKz(Number(fatura.total)), y); y += 5;
  thickRule(y); y += 4;

  // Payment
  sz(7); N();
  if (fatura.metodo_pagamento) { left(`Método: ${fatura.metodo_pagamento}`, y); y += 3.5; }
  if (fatura.referencia_pagamento) { left(`Ref: ${fatura.referencia_pagamento}`, y); y += 3.5; }

  rule(y); y += 4;

  // Digital signature area
  if (fatura.signature_hash) {
    sz(6); tc(MUTED);
    center('Assinatura Digital', y); y += 3;
    sz(5.5); center(fatura.signature_hash.substring(0, 16).toUpperCase(), y); y += 3.5;
    tc(INK);
  }

  // QR + Barcode area
  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero, total: fatura.total, data: fatura.data_emissao,
    });
    const qrSize = 22;
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 200, margin: 1, color: { dark: '#14141E', light: '#FFFFFF' },
    });
    doc.addImage(qrUrl, 'PNG', ML, y, qrSize, qrSize);

    // Text next to QR
    sz(6); tc(MUTED);
    doc.text('Digitalize para', ML + qrSize + 3, y + 8);
    doc.text('verificar documento', ML + qrSize + 3, y + 12);
    doc.text(fatura.numero, ML + qrSize + 3, y + 16);
    y += qrSize + 3;
  } catch { /* skip */ }

  // Footer
  rule(y); y += 3;
  sz(6); N(); tc(MUTED);
  center('Obrigado pela sua preferência!', y); y += 3;
  sz(5.5); B(); center('Sem a Faktura, não fakturo.', y); y += 3;

  // Amber bottom bar
  doc.setFillColor(245, 166, 35);
  doc.rect(0, y + 1, W, 2, 'F');

  return doc.output('blob');
}

function estimateMediumHeight(fatura: Fatura): number {
  const items = fatura.itens || [];
  let h = 70; // header + merchant
  h += items.length * 7; // products (2 lines each)
  h += 40; // totals
  h += 15; // payment
  h += 30; // QR
  h += 20; // footer
  return Math.max(h, 100);
}

/* ═══════════════════════════════════════════════════════════════
   AMOUNT IN WORDS (Portuguese)
   ═══════════════════════════════════════════════════════════════ */
export function amountInWords(value: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (value === 0) return 'zero kwanzas';

  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    let result = '';
    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)];
      n %= 100;
      if (n > 0) result += ' e ';
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) result += ' e ' + units[n];
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += units[n];
    }
    return result;
  }

  let result = '';
  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    result += millions === 1 ? 'um milhão' : convertGroup(millions) + ' milhões';
    const rest = intPart % 1000000;
    if (rest > 0) result += (rest < 100 ? ' e ' : ' ');
    if (rest >= 1000) {
      const thousands = Math.floor(rest / 1000);
      result += thousands === 1 ? 'mil' : convertGroup(thousands) + ' mil';
      const r2 = rest % 1000;
      if (r2 > 0) result += (r2 < 100 ? ' e ' : ' ') + convertGroup(r2);
    } else if (rest > 0) {
      result += convertGroup(rest);
    }
  } else if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    result += thousands === 1 ? 'mil' : convertGroup(thousands) + ' mil';
    const rest = intPart % 1000;
    if (rest > 0) result += (rest < 100 ? ' e ' : ' ') + convertGroup(rest);
  } else {
    result = convertGroup(intPart);
  }

  result += intPart === 1 ? ' kwanza' : ' kwanzas';

  if (decPart > 0) {
    result += ' e ' + convertGroup(decPart) + ' cêntimos';
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
