import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from './format';

const COLORS = {
  primary: [212, 160, 50] as [number, number, number], // Amber/Gold
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
  background: [248, 248, 248] as [number, number, number],
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const companyName = companyInfo?.nome_empresa || 'FAKTURA ANGOLA';
  const companyNif = companyInfo?.nif_produtor;
  const companyAddress = companyInfo?.morada || companyInfo?.endereco_empresa;
  const companyCity = companyInfo?.cidade;
  const companyProvince = companyInfo?.provincia;
  const companyPhone = companyInfo?.telefone;
  const companyEmail = companyInfo?.email;
  const companyWebsite = companyInfo?.website;
  const companyActivity = companyInfo?.actividade_comercial;
  const companyAlvara = companyInfo?.alvara_comercial;

  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), margin, 20);

  // Company details under name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let headerY = 26;
  if (companyNif) {
    doc.text(`NIF: ${companyNif}`, margin, headerY);
    headerY += 4;
  }
  if (companyAddress) {
    const addr = [companyAddress, companyCity, companyProvince].filter(Boolean).join(', ');
    doc.text(addr, margin, headerY);
    headerY += 4;
  }
  const contactParts = [companyPhone, companyEmail].filter(Boolean);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), margin, headerY);
    headerY += 4;
  }
  if (companyAlvara) {
    doc.text(`Alvará: ${companyAlvara}`, margin, headerY);
  }

  // Invoice type badge
  const tipoTexto = {
    'fatura': 'FATURA',
    'fatura-recibo': 'FATURA-RECIBO',
    'recibo': 'RECIBO',
    'nota-credito': 'NOTA DE CRÉDITO',
  }[fatura.tipo];

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tipoTexto, pageWidth - margin, 22, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(fatura.numero, pageWidth - margin, 30, { align: 'right' });

  y = 60;

  // Invoice details section
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);

  // Left column - Client info
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(fatura.cliente?.nome || 'Cliente não especificado', margin, y);
  y += 5;

  doc.setTextColor(...COLORS.muted);
  doc.text(`NIF: ${fatura.cliente?.nif || 'N/A'}`, margin, y);
  y += 5;
  doc.text(fatura.cliente?.endereco || '', margin, y);
  y += 5;
  if (fatura.cliente?.telefone) {
    doc.text(`Tel: ${fatura.cliente.telefone}`, margin, y);
    y += 5;
  }
  if (fatura.cliente?.email) {
    doc.text(fatura.cliente.email, margin, y);
    y += 5;
  }

  // Right column - Invoice dates
  const rightCol = pageWidth / 2 + 10;
  let yRight = 60;

  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHES', rightCol, yRight);
  yRight += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  doc.text(`Data de Emissão: ${formatDate(fatura.data_emissao)}`, rightCol, yRight);
  yRight += 5;
  doc.text(`Data de Vencimento: ${formatDate(fatura.data_vencimento)}`, rightCol, yRight);
  yRight += 5;
  if (fatura.data_pagamento) {
    doc.text(`Data de Pagamento: ${formatDate(fatura.data_pagamento)}`, rightCol, yRight);
    yRight += 5;
  }

  const estadoTexto = {
    'rascunho': 'Rascunho',
    'emitida': 'Emitida',
    'paga': 'Paga',
    'anulada': 'Anulada',
    'vencida': 'Vencida',
  }[fatura.estado];

  doc.text(`Estado: ${estadoTexto}`, rightCol, yRight);

  y = Math.max(y, yRight) + 15;

  // Items table header
  doc.setFillColor(...COLORS.background);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  const colX = [margin + 2, margin + 62, margin + 82, margin + 112, margin + 132, margin + 157];

  doc.text('Descrição', colX[0], y + 5.5);
  doc.text('Qtd.', colX[1], y + 5.5);
  doc.text('Preço Unit.', colX[2], y + 5.5);
  doc.text('IVA', colX[3], y + 5.5);
  doc.text('Desc.', colX[4], y + 5.5);
  doc.text('Total', colX[5], y + 5.5);

  y += 12;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (fatura.itens && fatura.itens.length > 0) {
    for (const item of fatura.itens) {
      doc.setTextColor(...COLORS.text);
      
      const produtoNome = item.produto?.nome || 'Produto';
      const truncatedName = produtoNome.length > 35 ? produtoNome.slice(0, 32) + '...' : produtoNome;
      
      doc.text(truncatedName, colX[0], y);
      doc.text(String(item.quantidade), colX[1], y);
      doc.text(formatCurrency(item.preco_unitario), colX[2], y);
      doc.text(`${item.taxa_iva}%`, colX[3], y);
      doc.text(`${item.desconto}%`, colX[4], y);
      doc.text(formatCurrency(item.total), colX[5], y);

      y += 7;

      doc.setDrawColor(...COLORS.border);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    }
  }

  y += 10;

  // Totals section
  const totalsX = pageWidth - margin - 60;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text('Subtotal:', totalsX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(fatura.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 6;

  doc.setTextColor(...COLORS.muted);
  doc.text('IVA (14%):', totalsX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(fatura.total_iva), pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Total box
  doc.setFillColor(...COLORS.primary);
  doc.rect(totalsX - 5, y - 4, 65, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX, y + 4);
  doc.text(formatCurrency(fatura.total), pageWidth - margin, y + 4, { align: 'right' });

  y += 25;

  // Observations
  if (fatura.observacoes) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    
    const lines = doc.splitTextToSize(fatura.observacoes, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 10;
  }

  // Payment method
  if (fatura.metodo_pagamento) {
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Método de Pagamento:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fatura.metodo_pagamento, margin + 45, y);
    y += 10;
  }

  // QR Code
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
      color: {
        dark: '#1e1e1e',
        light: '#ffffff',
      },
    });

    const qrY = pageHeight - 55;
    doc.addImage(qrCodeDataUrl, 'PNG', margin, qrY, 35, 35);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text('Código QR de Verificação', margin, qrY + 40);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }

  // Footer
  doc.setFillColor(...COLORS.background);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `Documento processado por ${companyName} - Sistema de Faturação`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  // Legal text
  doc.setFontSize(7);
  doc.text(
    `Emitido em ${formatDate(fatura.data_emissao)} | Documento válido para efeitos fiscais em Angola`,
    pageWidth / 2,
    pageHeight - 3,
    { align: 'center' }
  );

  return doc.output('blob');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
