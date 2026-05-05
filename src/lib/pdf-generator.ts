import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from './format';
import { getAgtSoftwareLine } from './agt-hash';
import { DOCUMENT_TYPES } from './agt-constants';
import fakturaLogoUrl from '@/assets/faktura-logo.png';

/* ══════════════════════════════════════════════════════════════════
   FAKTURA — PDF v5.0  "Mono Clean"
   • Preto e branco — fundo branco, tinta preta
   • Acento âmbar mínimo: apenas filete superior 1.5mm
   • Logo Faktura no topo (empresa OU fallback)
   • AGT-compliant: IVA discriminado, hash, ATCUD, QR, software cert.
   ══════════════════════════════════════════════════════════════════ */

const INK   : [number,number,number] = [ 17,  17,  17];
const SOFT  : [number,number,number] = [ 90,  90,  95];
const RULE  : [number,number,number] = [220, 220, 224];
const ROW   : [number,number,number] = [248, 248, 250];
const AMBER : [number,number,number] = [245, 166,  35];
const WHITE : [number,number,number] = [255, 255, 255];

const TIPO_LABEL: Record<string,string> = Object.fromEntries(
  Object.entries(DOCUMENT_TYPES).map(([k, v]) => [k, v.label.toUpperCase()])
);

const ESTADO_LABEL: Record<string,string> = {
  paga:'Paga', emitida:'Emitida', vencida:'Vencida', anulada:'Anulada', rascunho:'Rascunho',
};

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
  const W  = doc.internal.pageSize.getWidth();
  const H  = doc.internal.pageSize.getHeight();
  const ML = 18;
  const MR = 18;
  let   y  = 0;

  const fc = (c: [number,number,number]) => doc.setFillColor(...c);
  const tc = (c: [number,number,number]) => doc.setTextColor(...c);
  const dc = (c: [number,number,number]) => doc.setDrawColor(...c);
  const B  = () => doc.setFont('helvetica', 'bold');
  const N  = () => doc.setFont('helvetica', 'normal');
  const sz = (n: number) => doc.setFontSize(n);
  const rule = (yy: number, color = RULE, lw = 0.2) => {
    dc(color); doc.setLineWidth(lw); doc.line(ML, yy, W - MR, yy);
  };

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

  /* ── Fundo branco ── */
  fc(WHITE); doc.rect(0, 0, W, H, 'F');

  /* ── Filete âmbar topo (único toque de cor) ── */
  fc(AMBER); doc.rect(0, 0, W, 1.5, 'F');

  y = 14;

  /* ── CABEÇALHO: Logo + nome empresa esquerda · Tipo + número direita ── */
  let logoEnd = ML;
  const logoSrc = compLogo || fakturaLogoUrl;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((ok, no) => { img.onload = () => ok(); img.onerror = () => no(); img.src = logoSrc; });
    doc.addImage(img, 'PNG', ML, y, 16, 16);
    logoEnd = ML + 20;
  } catch { /* skip */ }

  tc(INK); sz(13); B();
  doc.text(compName, logoEnd, y + 6);

  tc(SOFT); sz(7.5); N();
  const line1 = [compNif ? `NIF ${compNif}` : '', compAddr].filter(Boolean).join('  ·  ');
  const line2 = [compPhone, compEmail, compAlv ? `Alvará ${compAlv}` : ''].filter(Boolean).join('  ·  ');
  if (line1) doc.text(line1, logoEnd, y + 11);
  if (line2) doc.text(line2, logoEnd, y + 15);

  // Direita: tipo (ink) + número (grande)
  tc(SOFT); sz(7); B(); doc.text(tipoLabel, W - MR, y, { align: 'right' });
  tc(INK);  sz(20); B(); doc.text(fatura.numero, W - MR, y + 9, { align: 'right' });
  tc(SOFT); sz(7.5); N();
  doc.text(`Emitido ${formatDate(fatura.data_emissao)}`, W - MR, y + 14, { align: 'right' });

  y += 24;
  rule(y, INK, 0.5);
  y += 6;

  /* ── BANNERS ── */
  if (isProforma) {
    fc([255, 248, 225] as [number,number,number]); doc.rect(ML, y, W - ML - MR, 6, 'F');
    tc(INK); sz(7); B();
    doc.text('PROFORMA — DOCUMENTO NÃO FISCAL', W / 2, y + 4, { align: 'center' });
    y += 10;
  }
  if (fatura.estado === 'anulada') {
    fc([20, 20, 20] as [number,number,number]); doc.rect(ML, y, W - ML - MR, 7, 'F');
    tc(WHITE); sz(8); B();
    doc.text('★ DOCUMENTO ANULADO — SEM VALIDADE FISCAL ★', W / 2, y + 5, { align: 'center' });
    y += 11;
  }

  /* ── CLIENTE + DETALHES ── */
  tc(SOFT); sz(6.5); B(); doc.text('CLIENTE', ML, y);
  tc(INK);  sz(11); B(); doc.text(fatura.cliente?.nome || 'Consumidor Final', ML, y + 6);
  tc(SOFT); sz(8); N();
  const cParts: string[] = [];
  if (fatura.cliente?.nif)      cParts.push(`NIF ${fatura.cliente.nif}`);
  if (fatura.cliente?.endereco) cParts.push(fatura.cliente.endereco);
  if (fatura.cliente?.telefone) cParts.push(fatura.cliente.telefone);
  if (fatura.cliente?.email)    cParts.push(fatura.cliente.email);
  if (cParts.length) doc.text(cParts.join('   ·   '), ML, y + 11);

  // Coluna direita
  const dX = W / 2 + 8;
  sz(6.5); B(); tc(SOFT);
  doc.text('EMISSÃO',    dX,       y);
  doc.text('VENCIMENTO', dX + 32,  y);
  doc.text('ESTADO',     dX + 68,  y);
  sz(8.5); N(); tc(INK);
  doc.text(formatDate(fatura.data_emissao),    dX,      y + 6);
  doc.text(formatDate(fatura.data_vencimento), dX + 32, y + 6);
  B(); doc.text(ESTADO_LABEL[fatura.estado] || fatura.estado, dX + 68, y + 6);

  y += 18;
  rule(y, RULE, 0.2);
  y += 7;

  /* ── TABELA ── */
  const xD  = ML;
  const xQ  = ML + 94;
  const xPU = ML + 118;
  const xIV = ML + 144;
  const xDC = ML + 158;
  const xT  = W - MR;

  // Header preto
  const HDR_H = 7.5;
  fc(INK); doc.rect(ML, y, W - ML - MR, HDR_H, 'F');
  sz(6.8); B(); tc(WHITE);
  const yHdr = y + 5.2;
  doc.text('DESCRIÇÃO',   xD + 3,  yHdr);
  doc.text('QTD',         xQ,      yHdr, { align: 'right' });
  doc.text('PREÇO UNIT.', xPU,     yHdr, { align: 'right' });
  doc.text('IVA',         xIV,     yHdr, { align: 'right' });
  doc.text('DESC.',       xDC,     yHdr, { align: 'right' });
  doc.text('TOTAL',       xT,      yHdr, { align: 'right' });
  y += HDR_H + 2;

  const items = fatura.itens || [];
  const ROW_H = 8;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i % 2 !== 0) { fc(ROW); doc.rect(ML, y - 1.5, W - ML - MR, ROW_H, 'F'); }
    rule(y + ROW_H - 2, RULE, 0.1);

    const name  = item.produto?.nome || 'Produto';
    const trunc = name.length > 54 ? name.slice(0, 51) + '...' : name;

    B(); sz(8.5); tc(INK);
    doc.text(trunc, xD + 3, y + 4);
    N(); tc(SOFT);
    doc.text(String(item.quantidade),             xQ,  y + 4, { align: 'right' });
    doc.text(formatCurrency(item.preco_unitario), xPU, y + 4, { align: 'right' });
    doc.text(`${item.taxa_iva}%`,                 xIV, y + 4, { align: 'right' });
    doc.text(`${item.desconto || 0}%`,            xDC, y + 4, { align: 'right' });
    B(); tc(INK);
    doc.text(formatCurrency(item.total), xT, y + 4, { align: 'right' });

    y += ROW_H;
  }

  dc(INK); doc.setLineWidth(0.5); doc.line(ML, y, W - MR, y);
  y += 10;

  /* ── TOTAIS ── */
  const tLX = W - MR - 75;
  const tVX = W - MR;

  sz(8.5);
  N(); tc(SOFT); doc.text('Subtotal', tLX, y);
  B(); tc(INK);  doc.text(formatCurrency(fatura.subtotal), tVX, y, { align: 'right' });
  y += 6;

  const ivaByRate: Record<number, number> = {};
  for (const item of items) {
    const rate = item.taxa_iva || 0;
    ivaByRate[rate] = (ivaByRate[rate] || 0) + (item.valor_iva || 0);
  }
  const sortedRates = Object.keys(ivaByRate).map(Number).sort((a, b) => b - a);

  for (const rate of sortedRates) {
    const label = rate === 0 ? 'IVA Isento' : `IVA ${rate}%`;
    N(); tc(SOFT); doc.text(label, tLX, y);
    B(); tc(INK);  doc.text(formatCurrency(ivaByRate[rate]), tVX, y, { align: 'right' });
    y += 6;
  }
  if (sortedRates.length === 0) {
    N(); tc(SOFT); doc.text('IVA', tLX, y);
    B(); tc(INK);  doc.text(formatCurrency(fatura.total_iva), tVX, y, { align: 'right' });
    y += 6;
  }

  y -= 1;
  dc(INK); doc.setLineWidth(0.5); doc.line(tLX, y, tVX, y);
  y += 7;
  sz(12); B(); tc(INK);
  doc.text('TOTAL A PAGAR', tLX, y);
  doc.text(formatCurrency(fatura.total), tVX, y, { align: 'right' });
  y += 13;

  /* ── OBSERVAÇÕES + MÉTODO ── */
  if (fatura.observacoes || fatura.metodo_pagamento) {
    rule(y, RULE, 0.2); y += 6;
    if (fatura.observacoes) {
      sz(6.5); B(); tc(SOFT); doc.text('OBSERVAÇÕES', ML, y); y += 4.5;
      N(); sz(8); tc(INK);
      const obs = doc.splitTextToSize(fatura.observacoes, W - ML - MR - 60);
      doc.text(obs, ML, y);
      y += obs.length * 4 + 3;
    }
    if (fatura.metodo_pagamento) {
      sz(6.5); B(); tc(SOFT); doc.text('MÉTODO DE PAGAMENTO', ML, y); y += 4.5;
      N(); sz(8.5); tc(INK); doc.text(fatura.metodo_pagamento, ML, y);
    }
  }

  /* ── QR ── */
  const QR_SIZE  = 30;
  const QR_TOP   = H - 60;
  rule(QR_TOP - 7, RULE, 0.2);

  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero, data: fatura.data_emissao,
      total: fatura.total, nif_emitente: compNif,
    });
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 260, margin: 1, color: { dark: '#111111', light: '#FFFFFF' },
    });
    doc.addImage(qrUrl, 'PNG', ML, QR_TOP, QR_SIZE, QR_SIZE);

    sz(7); B(); tc(INK);
    doc.text('Código QR de Verificação', ML + QR_SIZE + 5, QR_TOP + 7);
    sz(7); N(); tc(SOFT);
    doc.text('Digitalize para validar este documento', ML + QR_SIZE + 5, QR_TOP + 13);
    doc.text(`Fatura: ${fatura.numero}`, ML + QR_SIZE + 5, QR_TOP + 19);
    if (fatura.signature_hash) {
      doc.text(`Hash: ${fatura.signature_hash.substring(0, 8).toUpperCase()}...`, ML + QR_SIZE + 5, QR_TOP + 25);
    }
  } catch { /* skip */ }

  /* ── RODAPÉ ── */
  rule(H - 18, INK, 0.4);
  sz(6.5); N(); tc(SOFT);
  const certLabel = compCert ? `  ·  Software certificado nº ${compCert}` : '';
  doc.text(
    `${compName} — Sistema de Faturação Certificado${certLabel}`,
    W / 2, H - 13, { align: 'center' }
  );
  const agtExtracto = (fatura as any).hash_extracto || (fatura.signature_hash || '').substring(0, 4).toUpperCase() || 'XXXX';
  const periodo = (fatura as any).periodo_contabilistico || (fatura.data_emissao || '').substring(0, 7);
  sz(5.5);
  doc.text(
    `${getAgtSoftwareLine(agtExtracto)}  ·  Período: ${periodo}  ·  Documento válido para efeitos fiscais na República de Angola`,
    W / 2, H - 9, { align: 'center'}
  );
  sz(5);
  doc.text(`Faktura Angola © ${new Date().getFullYear()}`, W / 2, H - 5, { align: 'center' });

  // Marca FAKTURA discreta
  sz(7.5); B(); tc(INK);
  doc.text('FAKTURA', W - MR, H - 13, { align: 'right' });
  sz(5.5); N(); tc(SOFT);
  doc.text('faktura.ao', W - MR, H - 9, { align: 'right' });

  /* ── MARCA D'ÁGUA ANULADO ── */
  if (fatura.estado === 'anulada') {
    const gs = (doc as any).GState ? new (doc as any).GState({ opacity: 0.12 }) : null;
    if (gs) (doc as any).setGState(gs);
    tc(INK); B(); sz(95);
    doc.text('ANULADO', W / 2, H / 2, { align: 'center', angle: 35 });
    if (gs) (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
  }

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
