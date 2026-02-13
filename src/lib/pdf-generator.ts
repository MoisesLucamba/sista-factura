import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from './format';

const COLORS = {
  primary: [212, 160, 50] as [number, number, number],
  primaryDark: [180, 130, 30] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [100, 100, 100] as [number, number, number],
  border: [220, 210, 190] as [number, number, number],
  background: [252, 250, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  headerBg: [40, 40, 50] as [number, number, number],
};

export interface CompanyInfo {
  nome_empresa?: string;
  nif_produtor?: string;
  endereco_empresa?: string;
  telefone?: string;
  email?: string;
  website?: string;
  morada?: string;
  cidade?: string;
  provincia?: string;
  actividade_comercial?: string;
  alvara_comercial?: string;
  logo_url?: string;
}

export async function generateInvoicePDF(fatura: Fatura, companyInfo?: CompanyInfo): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 0;

  const companyName = companyInfo?.nome_empresa || 'FAKTURA ANGOLA';
  const companyNif = companyInfo?.nif_produtor;
  const companyAddress = companyInfo?.morada || companyInfo?.endereco_empresa;
  const companyCity = companyInfo?.cidade;
  const companyProvince = companyInfo?.provincia;
  const companyPhone = companyInfo?.telefone;
  const companyEmail = companyInfo?.email;
  const companyWebsite = companyInfo?.website;
  const companyAlvara = companyInfo?.alvara_comercial;
  const companyLogo = companyInfo?.logo_url;

  // ── Top accent bar ──
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // ── Header area ──
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 4, pageWidth, 42, 'F');

  // Company logo
  let logoLoaded = false;
  if (companyLogo) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = companyLogo;
      });
      doc.addImage(img, 'PNG', margin, 8, 14, 14);
      logoLoaded = true;
    } catch (e) {
      console.warn('Could not load company logo:', e);
    }
  }

  // Company name
  const nameX = logoLoaded ? margin + 17 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), nameX, 17);

  // Company details
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  let hY = 22;
  if (companyNif) { doc.text(`NIF: ${companyNif}`, nameX, hY); hY += 3.5; }
  if (companyAddress) {
    const addr = [companyAddress, companyCity, companyProvince].filter(Boolean).join(', ');
    doc.text(addr, nameX, hY); hY += 3.5;
  }
  const contacts = [companyPhone, companyEmail].filter(Boolean);
  if (contacts.length) { doc.text(contacts.join(' | '), nameX, hY); hY += 3.5; }
  if (companyAlvara) { doc.text(`Alvará: ${companyAlvara}`, nameX, hY); }

  // Invoice type badge (right side)
  const isProforma = fatura.tipo === 'proforma';
  const tipoTexto = {
    'fatura': 'FATURA',
    'fatura-recibo': 'FATURA-RECIBO',
    'recibo': 'RECIBO',
    'nota-credito': 'NOTA DE CRÉDITO',
    'proforma': 'FATURA PROFORMA',
  }[fatura.tipo] || 'FATURA';

  // Badge background
  doc.setFillColor(...COLORS.primary);
  const badgeW = doc.getTextWidth(tipoTexto) * 1.3 + 10;
  doc.roundedRect(pageWidth - margin - badgeW, 8, badgeW, 9, 2, 2, 'F');
  doc.setTextColor(...COLORS.headerBg);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(tipoTexto, pageWidth - margin - badgeW / 2, 14, { align: 'center' });

  // Invoice number
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(fatura.numero, pageWidth - margin, 28, { align: 'right' });

  y = 46;

  // Proforma disclaimer
  if (isProforma) {
    doc.setFillColor(255, 240, 180);
    doc.rect(0, y, pageWidth, 8, 'F');
    doc.setTextColor(120, 80, 0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTO PROFORMA – NÃO VÁLIDO COMO DOCUMENTO FISCAL', pageWidth / 2, y + 5, { align: 'center' });
    y += 12;
  } else {
    y += 4;
  }

  // ── Two-column: Client & Details ──
  const colW = (pageWidth - 2 * margin - 10) / 2;
  const leftX = margin;
  const rightX = margin + colW + 10;

  // Client card
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(leftX, y, colW, 38, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(leftX, y, colW, 38, 2, 2, 'S');

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(leftX, y, colW, 7, 2, 2, 'F');
  doc.rect(leftX, y + 4, colW, 3, 'F'); // fill bottom corners
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', leftX + 4, y + 5);

  let cY = y + 12;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(fatura.cliente?.nome || 'Consumidor Final', leftX + 4, cY);
  cY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text(`NIF: ${fatura.cliente?.nif || 'N/A'}`, leftX + 4, cY);
  cY += 4;
  if (fatura.cliente?.endereco) { doc.text(fatura.cliente.endereco, leftX + 4, cY); cY += 4; }
  if (fatura.cliente?.telefone) { doc.text(`Tel: ${fatura.cliente.telefone}`, leftX + 4, cY); cY += 4; }
  if (fatura.cliente?.email) { doc.text(fatura.cliente.email, leftX + 4, cY); }

  // Details card
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(rightX, y, colW, 38, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(rightX, y, colW, 38, 2, 2, 'S');

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(rightX, y, colW, 7, 2, 2, 'F');
  doc.rect(rightX, y + 4, colW, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHES', rightX + 4, y + 5);

  let dY = y + 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  const details = [
    ['Emissão:', formatDate(fatura.data_emissao)],
    ['Vencimento:', formatDate(fatura.data_vencimento)],
    ...(fatura.data_pagamento ? [['Pagamento:', formatDate(fatura.data_pagamento)]] : []),
    ['Estado:', { 'rascunho': 'Rascunho', 'emitida': 'Emitida', 'paga': 'Paga', 'anulada': 'Anulada', 'vencida': 'Vencida' }[fatura.estado] || fatura.estado],
  ];
  for (const [label, val] of details) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(label, rightX + 4, dY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(val, rightX + 28, dY);
    dY += 5;
  }

  y += 44;

  // ── Items table ──
  // Header
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  const colX = [margin + 3, margin + 70, margin + 88, margin + 110, margin + 130, margin + 152];
  doc.text('DESCRIÇÃO', colX[0], y + 5.5);
  doc.text('QTD', colX[1], y + 5.5);
  doc.text('PREÇO UNIT.', colX[2], y + 5.5);
  doc.text('IVA', colX[3], y + 5.5);
  doc.text('DESC.', colX[4], y + 5.5);
  doc.text('TOTAL', colX[5], y + 5.5);
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (fatura.itens && fatura.itens.length > 0) {
    for (let i = 0; i < fatura.itens.length; i++) {
      const item = fatura.itens[i];
      // Alternating row bg
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.background);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 7, 'F');
      }
      doc.setTextColor(...COLORS.text);
      const prodName = item.produto?.nome || 'Produto';
      const truncated = prodName.length > 38 ? prodName.slice(0, 35) + '...' : prodName;
      doc.text(truncated, colX[0], y);
      doc.text(String(item.quantidade), colX[1], y);
      doc.text(formatCurrency(item.preco_unitario), colX[2], y);
      doc.text(`${item.taxa_iva}%`, colX[3], y);
      doc.text(`${item.desconto}%`, colX[4], y);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(item.total), colX[5], y);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }
  }

  y += 6;

  // ── Totals ──
  const totalsW = 70;
  const totalsX = pageWidth - margin - totalsW;

  // Separator line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text('Subtotal:', totalsX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(fatura.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.setTextColor(...COLORS.muted);
  doc.text('IVA (14%):', totalsX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(fatura.total_iva), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Total box
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(totalsX - 3, y - 4, totalsW + 3, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX + 2, y + 4);
  doc.text(formatCurrency(fatura.total), pageWidth - margin - 2, y + 4, { align: 'right' });

  y += 20;

  // Observations
  if (fatura.observacoes) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    const lines = doc.splitTextToSize(fatura.observacoes, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 3.5 + 6;
  }

  // Payment method
  if (fatura.metodo_pagamento) {
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Método de Pagamento:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fatura.metodo_pagamento, margin + 40, y);
    y += 8;
  }

  // ── QR Code ──
  try {
    const qrData = fatura.qr_code || JSON.stringify({
      numero: fatura.numero,
      data: fatura.data_emissao,
      total: fatura.total,
      nif_emitente: companyNif || '',
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: '#1e1e1e', light: '#ffffff' },
    });
    const qrY = pageHeight - 50;
    doc.addImage(qrCodeDataUrl, 'PNG', margin, qrY, 30, 30);
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text('Código QR de Verificação', margin, qrY + 33);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }

  // ── Footer ──
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  // Accent line
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 12, pageWidth, 1.5, 'F');

  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Documento processado por ${companyName} – Sistema de Faturação Certificado`,
    pageWidth / 2, pageHeight - 6, { align: 'center' }
  );
  doc.setFontSize(6);
  doc.text(
    `Emitido em ${formatDate(fatura.data_emissao)} | Documento válido para efeitos fiscais em Angola`,
    pageWidth / 2, pageHeight - 2.5, { align: 'center' }
  );

  return doc.output('blob');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function downloadInvoicePDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
