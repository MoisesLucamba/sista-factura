import { jsPDF } from 'jspdf';
import { formatCurrency } from './format';

/* ══════════════════════════════════════════════════════════════════
   FAKTURA — Report PDF Generator
   Design consistente com as faturas: header escuro + âmbar + tipografia limpa
   ══════════════════════════════════════════════════════════════════ */

const AMBER  : [number,number,number] = [245, 166,  35];
const INK    : [number,number,number] = [ 20,  20,  30];
const DARK   : [number,number,number] = [ 28,  28,  40];
const MUTED  : [number,number,number] = [120, 120, 135];
const RULE   : [number,number,number] = [230, 230, 235];
const ROW_ALT: [number,number,number] = [250, 250, 252];
const WHITE  : [number,number,number] = [255, 255, 255];
const GREEN  : [number,number,number] = [ 34, 197, 94];
const RED    : [number,number,number] = [239,  68, 68];

interface CompanyData {
  nome_empresa?: string;
  nif_produtor?: string;
  endereco_empresa?: string;
  morada?: string;
  cidade?: string;
  provincia?: string;
  telefone?: string;
  email?: string;
  alvara_comercial?: string;
}

interface MonthData {
  mes: string;
  valor: number;
  iva: number;
  numFaturas?: number;
  subtotal?: number;
}

interface EstadoData {
  name: string;
  value: number;
}

interface ClienteData {
  nome: string;
  vendas: number;
}

// ── Helpers ─────────────────────────────────────────────────────
function setupDoc(): { doc: jsPDF; W: number; H: number; ML: number; MR: number } {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  return { doc, W: 210, H: 297, ML: 18, MR: 18 };
}

const fc = (doc: jsPDF, c: [number,number,number]) => doc.setFillColor(...c);
const tc = (doc: jsPDF, c: [number,number,number]) => doc.setTextColor(...c);
const dc = (doc: jsPDF, c: [number,number,number]) => doc.setDrawColor(...c);
const B  = (doc: jsPDF) => doc.setFont('helvetica', 'bold');
const N  = (doc: jsPDF) => doc.setFont('helvetica', 'normal');
const sz = (doc: jsPDF, n: number) => doc.setFontSize(n);

function rule(doc: jsPDF, y: number, ML: number, W: number, MR: number, color = RULE, lw = 0.2) {
  dc(doc, color); doc.setLineWidth(lw); doc.line(ML, y, W - MR, y);
}

function drawHeader(doc: jsPDF, W: number, ML: number, MR: number, company: CompanyData, title: string, subtitle: string): number {
  // Background
  fc(doc, WHITE); doc.rect(0, 0, W, 297, 'F');

  // Dark header block
  fc(doc, DARK); doc.rect(0, 0, W, 46, 'F');
  // Amber stripe
  fc(doc, AMBER); doc.rect(0, 0, W, 3, 'F');

  // Company name
  const compName = (company.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  tc(doc, WHITE); sz(doc, 14); B(doc);
  doc.text(compName, ML, 17);

  // Company info
  tc(doc, [150, 150, 165]); sz(doc, 7); N(doc);
  const compAddr = [company.morada || company.endereco_empresa, company.cidade, company.provincia].filter(Boolean).join(', ');
  const line1 = [company.nif_produtor ? `NIF: ${company.nif_produtor}` : '', compAddr].filter(Boolean).join('   ');
  const line2 = [company.telefone, company.email, company.alvara_comercial ? `Alvará: ${company.alvara_comercial}` : ''].filter(Boolean).join('   ');
  if (line1) doc.text(line1, ML, 24);
  if (line2) doc.text(line2, ML, 29.5);

  // Title pill
  sz(doc, 8); B(doc);
  const pillW = doc.getTextWidth(title) + 12;
  fc(doc, AMBER); doc.roundedRect(W - MR - pillW, 7, pillW, 9, 1.8, 1.8, 'F');
  tc(doc, INK); doc.text(title, W - MR - pillW / 2, 13, { align: 'center' });

  // Subtitle
  tc(doc, WHITE); sz(doc, 18); B(doc);
  doc.text(subtitle, W - MR, 28, { align: 'right' });

  // Date
  tc(doc, [130, 130, 148]); sz(doc, 7.5); N(doc);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-AO')}`, W - MR, 35, { align: 'right' });

  return 52;
}

function drawFooter(doc: jsPDF, W: number, MR: number, company: CompanyData) {
  const H = 297;
  fc(doc, DARK); doc.rect(0, H - 18, W, 18, 'F');
  fc(doc, AMBER); doc.rect(0, H - 18, W, 1.5, 'F');

  sz(doc, 6); N(doc); tc(doc, [150, 150, 165]);
  const compName = (company.nome_empresa || 'FAKTURA ANGOLA').toUpperCase();
  doc.text(`${compName} — Sistema de Faturação Certificado`, W / 2, H - 11, { align: 'center' });
  sz(doc, 5);
  doc.text('Documento gerado automaticamente pelo sistema Faktura Angola', W / 2, H - 7, { align: 'center' });

  sz(doc, 8); B(doc); tc(doc, AMBER);
  doc.text('FAKTURA', W - MR, H - 11, { align: 'right' });
  sz(doc, 5.5); N(doc); tc(doc, [95, 95, 115]);
  doc.text('faktura.ao', W - MR, H - 7, { align: 'right' });
}

function drawTableHeader(doc: jsPDF, y: number, ML: number, W: number, MR: number, columns: { label: string; x: number; align?: 'left' | 'right' }[]): number {
  const HDR_H = 8.5;
  fc(doc, [252, 246, 222]); doc.rect(ML, y, W - ML - MR, HDR_H, 'F');
  fc(doc, AMBER); doc.rect(ML, y, 3, HDR_H, 'F');

  sz(doc, 6.8); B(doc); tc(doc, INK);
  const yH = y + 5.8;
  columns.forEach(col => {
    doc.text(col.label, col.x, yH, { align: col.align || 'left' });
  });
  return y + HDR_H + 2;
}

/* ═══════════════════════════════════════════════════════════════
   MAPA DE IVA
   ═══════════════════════════════════════════════════════════════ */
export function exportMapaIVAPDF(company: CompanyData, year: string, monthData: MonthData[]) {
  const { doc, W, H, ML, MR } = setupDoc();
  let y = drawHeader(doc, W, ML, MR, company, 'RELATÓRIO FISCAL', `Mapa de IVA ${year}`);

  // Summary card
  const totalBase = monthData.reduce((s, m) => s + (m.valor - m.iva), 0);
  const totalIva = monthData.reduce((s, m) => s + m.iva, 0);
  const totalGross = monthData.reduce((s, m) => s + m.valor, 0);

  // Summary boxes
  y += 2;
  const boxW = (W - ML - MR - 6) / 3;
  [
    { label: 'BASE TRIBUTÁVEL', value: formatCurrency(totalBase), color: AMBER },
    { label: 'IVA TOTAL', value: formatCurrency(totalIva), color: RED },
    { label: 'TOTAL BRUTO', value: formatCurrency(totalGross), color: GREEN },
  ].forEach((box, i) => {
    const bx = ML + i * (boxW + 3);
    fc(doc, [248, 248, 250]); doc.roundedRect(bx, y, boxW, 18, 2, 2, 'F');
    dc(doc, box.color); doc.setLineWidth(0.8); doc.line(bx, y + 2, bx, y + 16);
    sz(doc, 6); B(doc); tc(doc, MUTED);
    doc.text(box.label, bx + 6, y + 7);
    sz(doc, 11); B(doc); tc(doc, INK);
    doc.text(box.value, bx + 6, y + 14);
  });
  y += 24;

  // Table
  const xMes = ML + 6;
  const xBase = ML + 65;
  const xIva = ML + 110;
  const xTotal = W - MR;

  y = drawTableHeader(doc, y, ML, W, MR, [
    { label: 'MÊS', x: xMes },
    { label: 'BASE TRIBUTÁVEL (KZ)', x: xBase, align: 'right' },
    { label: 'IVA (KZ)', x: xIva, align: 'right' },
    { label: 'TOTAL (KZ)', x: xTotal, align: 'right' },
  ]);

  monthData.forEach((m, i) => {
    const base = m.valor - m.iva;
    if (i % 2 !== 0) { fc(doc, ROW_ALT); doc.rect(ML, y - 1.5, W - ML - MR, 7, 'F'); }
    rule(doc, y + 5, ML, W, MR, RULE, 0.12);

    B(doc); sz(doc, 8.5); tc(doc, INK);
    doc.text(m.mes, xMes, y + 3.5);
    N(doc); tc(doc, MUTED);
    doc.text(formatCurrency(base), xBase, y + 3.5, { align: 'right' });
    doc.text(formatCurrency(m.iva), xIva, y + 3.5, { align: 'right' });
    B(doc); tc(doc, INK);
    doc.text(formatCurrency(m.valor), xTotal, y + 3.5, { align: 'right' });
    y += 7;
  });

  // Close table
  dc(doc, AMBER); doc.setLineWidth(0.7); doc.line(ML, y, W - MR, y);
  y += 10;

  // Totals
  const tLX = W - MR - 80;
  const tVX = W - MR;
  sz(doc, 8.5);
  N(doc); tc(doc, MUTED); doc.text('Base Tributável', tLX, y);
  B(doc); tc(doc, INK); doc.text(formatCurrency(totalBase), tVX, y, { align: 'right' }); y += 6;
  N(doc); tc(doc, MUTED); doc.text('IVA 14%', tLX, y);
  B(doc); tc(doc, INK); doc.text(formatCurrency(totalIva), tVX, y, { align: 'right' }); y += 5;
  dc(doc, AMBER); doc.setLineWidth(0.7); doc.line(tLX, y, tVX, y); y += 7;
  sz(doc, 12); B(doc);
  tc(doc, INK); doc.text('TOTAL', tLX, y);
  tc(doc, AMBER); doc.text(formatCurrency(totalGross), tVX, y, { align: 'right' });

  // Legal note
  y += 16;
  rule(doc, y, ML, W, MR, RULE, 0.25); y += 6;
  sz(doc, 6.5); B(doc); tc(doc, AMBER); doc.text('NOTA LEGAL', ML, y); y += 4;
  N(doc); sz(doc, 7); tc(doc, MUTED);
  doc.text('Documento gerado em conformidade com o Decreto Presidencial n.º 71/25 e Decreto Executivo n.º 312/18.', ML, y); y += 4;
  doc.text('Taxa de IVA normal: 14% · Moeda: Kwanza Angolano (AOA)', ML, y);

  drawFooter(doc, W, MR, company);
  doc.save(`Mapa_IVA_${year}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   FATURAÇÃO MENSAL
   ═══════════════════════════════════════════════════════════════ */
export function exportFaturacaoMensalPDF(company: CompanyData, year: string, monthData: MonthData[]) {
  const { doc, W, H, ML, MR } = setupDoc();
  let y = drawHeader(doc, W, ML, MR, company, 'RELATÓRIO', `Faturação Mensal ${year}`);

  // Summary
  const totalFaturas = monthData.reduce((s, m) => s + (m.numFaturas || 0), 0);
  const totalSubtotal = monthData.reduce((s, m) => s + (m.subtotal || 0), 0);
  const totalIva = monthData.reduce((s, m) => s + m.iva, 0);
  const totalGross = monthData.reduce((s, m) => s + m.valor, 0);

  y += 2;
  const boxW = (W - ML - MR - 9) / 4;
  [
    { label: 'DOCUMENTOS', value: totalFaturas.toString(), color: AMBER },
    { label: 'SUBTOTAL', value: formatCurrency(totalSubtotal), color: MUTED },
    { label: 'IVA', value: formatCurrency(totalIva), color: RED },
    { label: 'TOTAL', value: formatCurrency(totalGross), color: GREEN },
  ].forEach((box, i) => {
    const bx = ML + i * (boxW + 3);
    fc(doc, [248, 248, 250]); doc.roundedRect(bx, y, boxW, 18, 2, 2, 'F');
    dc(doc, box.color); doc.setLineWidth(0.8); doc.line(bx, y + 2, bx, y + 16);
    sz(doc, 6); B(doc); tc(doc, MUTED);
    doc.text(box.label, bx + 5, y + 7);
    sz(doc, 9); B(doc); tc(doc, INK);
    doc.text(box.value, bx + 5, y + 14);
  });
  y += 24;

  // Table
  const xMes = ML + 6;
  const xNum = ML + 42;
  const xSub = ML + 80;
  const xIva = ML + 120;
  const xTotal = W - MR;

  y = drawTableHeader(doc, y, ML, W, MR, [
    { label: 'MÊS', x: xMes },
    { label: 'Nº FAT.', x: xNum, align: 'right' },
    { label: 'SUBTOTAL (KZ)', x: xSub, align: 'right' },
    { label: 'IVA (KZ)', x: xIva, align: 'right' },
    { label: 'TOTAL (KZ)', x: xTotal, align: 'right' },
  ]);

  monthData.forEach((m, i) => {
    if (i % 2 !== 0) { fc(doc, ROW_ALT); doc.rect(ML, y - 1.5, W - ML - MR, 7, 'F'); }
    rule(doc, y + 5, ML, W, MR, RULE, 0.12);

    B(doc); sz(doc, 8.5); tc(doc, INK);
    doc.text(m.mes, xMes, y + 3.5);
    N(doc); tc(doc, MUTED);
    doc.text((m.numFaturas || 0).toString(), xNum, y + 3.5, { align: 'right' });
    doc.text(formatCurrency(m.subtotal || 0), xSub, y + 3.5, { align: 'right' });
    doc.text(formatCurrency(m.iva), xIva, y + 3.5, { align: 'right' });
    B(doc); tc(doc, INK);
    doc.text(formatCurrency(m.valor), xTotal, y + 3.5, { align: 'right' });
    y += 7;
  });

  dc(doc, AMBER); doc.setLineWidth(0.7); doc.line(ML, y, W - MR, y);
  y += 10;

  // Totals
  const tLX = W - MR - 80;
  const tVX = W - MR;
  sz(doc, 12); B(doc);
  tc(doc, INK); doc.text('TOTAL ANUAL', tLX, y);
  tc(doc, AMBER); doc.text(formatCurrency(totalGross), tVX, y, { align: 'right' });

  drawFooter(doc, W, MR, company);
  doc.save(`Faturacao_Mensal_${year}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   RELATÓRIO ANUAL
   ═══════════════════════════════════════════════════════════════ */
export function exportRelatorioAnualPDF(
  company: CompanyData,
  year: string,
  stats: { faturacaoAnual: number; ivaAnual: number; totalClientes: number; faturasEmitidas: number },
  estadoFaturas: EstadoData[],
  topClientes: ClienteData[],
  monthData: MonthData[],
) {
  const { doc, W, H, ML, MR } = setupDoc();
  let y = drawHeader(doc, W, ML, MR, company, 'RELATÓRIO ANUAL', `Exercício ${year}`);

  // KPI Boxes
  y += 2;
  const boxW = (W - ML - MR - 9) / 4;
  [
    { label: 'FATURAÇÃO', value: formatCurrency(stats.faturacaoAnual), color: AMBER },
    { label: 'IVA COBRADO', value: formatCurrency(stats.ivaAnual), color: RED },
    { label: 'CLIENTES', value: stats.totalClientes.toString(), color: GREEN },
    { label: 'DOCUMENTOS', value: stats.faturasEmitidas.toString(), color: MUTED },
  ].forEach((box, i) => {
    const bx = ML + i * (boxW + 3);
    fc(doc, [248, 248, 250]); doc.roundedRect(bx, y, boxW, 18, 2, 2, 'F');
    dc(doc, box.color); doc.setLineWidth(0.8); doc.line(bx, y + 2, bx, y + 16);
    sz(doc, 6); B(doc); tc(doc, MUTED);
    doc.text(box.label, bx + 5, y + 7);
    sz(doc, 9); B(doc); tc(doc, INK);
    doc.text(box.value, bx + 5, y + 14);
  });
  y += 26;

  // Estado faturas section
  sz(doc, 6.5); B(doc); tc(doc, AMBER);
  doc.text('DISTRIBUIÇÃO POR ESTADO', ML, y); y += 6;

  estadoFaturas.forEach((e, i) => {
    if (i % 2 !== 0) { fc(doc, ROW_ALT); doc.rect(ML, y - 2, W - ML - MR, 7, 'F'); }
    B(doc); sz(doc, 8.5); tc(doc, INK);
    doc.text(e.name, ML + 6, y + 2.5);
    N(doc); tc(doc, MUTED);
    doc.text(`${e.value} documento(s)`, W - MR, y + 2.5, { align: 'right' });
    y += 7;
  });
  y += 4;

  rule(doc, y, ML, W, MR, RULE, 0.25); y += 8;

  // Top clientes
  if (topClientes.length > 0) {
    sz(doc, 6.5); B(doc); tc(doc, AMBER);
    doc.text('TOP CLIENTES POR FATURAÇÃO', ML, y); y += 6;

    y = drawTableHeader(doc, y, ML, W, MR, [
      { label: 'CLIENTE', x: ML + 6 },
      { label: 'FATURAÇÃO (KZ)', x: W - MR, align: 'right' },
    ]);

    topClientes.forEach((c, i) => {
      if (i % 2 !== 0) { fc(doc, ROW_ALT); doc.rect(ML, y - 1.5, W - ML - MR, 7, 'F'); }
      rule(doc, y + 5, ML, W, MR, RULE, 0.12);
      B(doc); sz(doc, 8.5); tc(doc, INK);
      doc.text(c.nome.length > 40 ? c.nome.slice(0, 37) + '...' : c.nome, ML + 6, y + 3.5);
      N(doc); tc(doc, MUTED);
      doc.text(formatCurrency(c.vendas), W - MR, y + 3.5, { align: 'right' });
      y += 7;
    });

    dc(doc, AMBER); doc.setLineWidth(0.7); doc.line(ML, y, W - MR, y);
    y += 10;
  }

  // Monthly breakdown mini-table
  if (y < 200) {
    rule(doc, y, ML, W, MR, RULE, 0.25); y += 8;
    sz(doc, 6.5); B(doc); tc(doc, AMBER);
    doc.text('EVOLUÇÃO MENSAL', ML, y); y += 6;

    monthData.forEach(m => {
      // Mini bar
      const maxVal = Math.max(...monthData.map(d => d.valor), 1);
      const barW = (m.valor / maxVal) * 80;
      fc(doc, [252, 246, 222]); doc.rect(ML + 28, y - 1, 80, 4.5, 'F');
      fc(doc, AMBER); doc.rect(ML + 28, y - 1, barW, 4.5, 'F');

      sz(doc, 7); B(doc); tc(doc, INK);
      doc.text(m.mes, ML + 6, y + 2);
      N(doc); tc(doc, MUTED); sz(doc, 6.5);
      doc.text(formatCurrency(m.valor), ML + 112, y + 2);
      y += 5.8;
    });
  }

  // Legal note
  y = Math.max(y + 8, 240);
  rule(doc, y, ML, W, MR, RULE, 0.25); y += 6;
  sz(doc, 6.5); B(doc); tc(doc, AMBER); doc.text('CONFORMIDADE FISCAL', ML, y); y += 4;
  N(doc); sz(doc, 7); tc(doc, MUTED);
  doc.text('Este relatório foi gerado em conformidade com as normas da AGT — Administração Geral Tributária de Angola.', ML, y); y += 4;
  doc.text('Decreto Presidencial n.º 71/25 · Decreto Executivo n.º 312/18 · Código do IVA (Lei n.º 7/19)', ML, y);

  drawFooter(doc, W, MR, company);
  doc.save(`Relatorio_Anual_${year}.pdf`);
}
