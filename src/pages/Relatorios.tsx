import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { formatCurrency, getMonthName } from '@/lib/format';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  TrendingUp,
  Receipt,
  Users,
  Package,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFaturas, useDashboardStats } from '@/hooks/useFaturas';
import { useClientes } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border-2 border-primary/20 rounded-xl shadow-xl p-4">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-bold text-xs"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Relatorios() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: faturas = [], isLoading: loadingFaturas } = useFaturas();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: clientes = [] } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const { data: agtConfig } = useAgtConfig();

  // Filter faturas by selected year
  const faturasDoAno = useMemo(() => {
    return faturas.filter(f => f.data_emissao?.startsWith(selectedYear));
  }, [faturas, selectedYear]);

  // Build monthly billing data from real faturas
  const faturacaoMensal = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((mes, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const faturasDoMes = faturasDoAno.filter(f => {
        const m = f.data_emissao?.split('-')[1];
        return m === monthStr && f.estado !== 'anulada';
      });
      const valor = faturasDoMes.reduce((sum, f) => sum + Number(f.total || 0), 0);
      const iva = faturasDoMes.reduce((sum, f) => sum + Number(f.total_iva || 0), 0);
      return { mes, valor, iva };
    });
  }, [faturasDoAno]);

  // Build invoice status pie chart from real data
  const estadoFaturas = useMemo(() => {
    const pagas = faturasDoAno.filter(f => f.estado === 'paga').length;
    const emitidas = faturasDoAno.filter(f => f.estado === 'emitida').length;
    const vencidas = faturasDoAno.filter(f => f.estado === 'vencida' || (f.estado === 'emitida' && new Date(f.data_vencimento) < new Date())).length;
    const rascunhos = faturasDoAno.filter(f => f.estado === 'rascunho').length;
    const anuladas = faturasDoAno.filter(f => f.estado === 'anulada').length;
    return [
      { name: 'Pagas', value: pagas, color: 'hsl(var(--success, 142 71% 45%))' },
      { name: 'Emitidas', value: emitidas, color: 'hsl(var(--primary))' },
      { name: 'Vencidas', value: vencidas, color: 'hsl(var(--destructive))' },
      { name: 'Rascunhos', value: rascunhos, color: 'hsl(var(--muted-foreground))' },
      { name: 'Anuladas', value: anuladas, color: 'hsl(var(--chart-4, 280 65% 60%))' },
    ].filter(e => e.value > 0);
  }, [faturasDoAno]);

  // Build top products from real invoice items
  const topProdutos = useMemo(() => {
    const productTotals: Record<string, { nome: string; vendas: number }> = {};
    faturasDoAno.forEach(f => {
      if (f.estado === 'anulada') return;
      // We don't have items loaded on list query, so aggregate by total per product from faturas
      // Instead, use the produtos list and match to faturas indirectly
    });
    // Since faturas list doesn't include items, we aggregate total per client as proxy
    // Better approach: query itens_fatura. For now, show client-based breakdown
    const clientTotals: Record<string, { nome: string; vendas: number }> = {};
    faturasDoAno.forEach(f => {
      if (f.estado === 'anulada') return;
      const clientName = (f.cliente as any)?.nome || 'Desconhecido';
      if (!clientTotals[clientName]) {
        clientTotals[clientName] = { nome: clientName, vendas: 0 };
      }
      clientTotals[clientName].vendas += Number(f.total || 0);
    });
    return Object.values(clientTotals)
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);
  }, [faturasDoAno]);

  // Real stats
  const realStats = useMemo(() => {
    const faturacaoAnual = faturasDoAno
      .filter(f => f.estado !== 'anulada')
      .reduce((sum, f) => sum + Number(f.total || 0), 0);
    const ivaAnual = faturasDoAno
      .filter(f => f.estado !== 'anulada')
      .reduce((sum, f) => sum + Number(f.total_iva || 0), 0);
    const faturasEmitidas = faturasDoAno.filter(f => f.estado !== 'anulada' && f.estado !== 'rascunho').length;
    return { faturacaoAnual, ivaAnual, totalClientes: clientes.length, faturasEmitidas };
  }, [faturasDoAno, clientes]);

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear.toString());
    faturas.forEach(f => {
      const y = f.data_emissao?.split('-')[0];
      if (y) years.add(y);
    });
    return Array.from(years).sort().reverse();
  }, [faturas, currentYear]);

  // --- EXPORT FUNCTIONS ---

  const exportMapaIVA = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Mapa de IVA', 14, 22);
      doc.setFontSize(10);
      doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      if (agtConfig?.nif_produtor) doc.text(`NIF: ${agtConfig.nif_produtor}`, 14, 42);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-AO')}`, 14, 48);

      let y = 58;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Mês', 14, y);
      doc.text('Base Tributável (Kz)', 60, y);
      doc.text('IVA (Kz)', 120, y);
      doc.text('Total (Kz)', 160, y);
      y += 2;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      let totalBase = 0, totalIva = 0, totalGeral = 0;
      faturacaoMensal.forEach(m => {
        const base = m.valor - m.iva;
        doc.text(m.mes, 14, y);
        doc.text(formatCurrency(base), 60, y);
        doc.text(formatCurrency(m.iva), 120, y);
        doc.text(formatCurrency(m.valor), 160, y);
        totalBase += base;
        totalIva += m.iva;
        totalGeral += m.valor;
        y += 7;
      });

      y += 2;
      doc.line(14, y, 196, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 14, y);
      doc.text(formatCurrency(totalBase), 60, y);
      doc.text(formatCurrency(totalIva), 120, y);
      doc.text(formatCurrency(totalGeral), 160, y);

      doc.save(`Mapa_IVA_${selectedYear}.pdf`);
      toast.success('Mapa de IVA exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar Mapa de IVA');
    }
  };

  const exportFaturacaoMensal = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório de Faturação Mensal', 14, 22);
      doc.setFontSize(10);
      doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      if (agtConfig?.nif_produtor) doc.text(`NIF: ${agtConfig.nif_produtor}`, 14, 42);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-AO')}`, 14, 48);

      let y = 58;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Mês', 14, y);
      doc.text('Nº Faturas', 50, y);
      doc.text('Subtotal (Kz)', 80, y);
      doc.text('IVA (Kz)', 120, y);
      doc.text('Total (Kz)', 155, y);
      y += 2;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      months.forEach((mes, i) => {
        const monthStr = String(i + 1).padStart(2, '0');
        const fMes = faturasDoAno.filter(f => f.data_emissao?.split('-')[1] === monthStr && f.estado !== 'anulada');
        const count = fMes.length;
        const subtotal = fMes.reduce((s, f) => s + Number(f.subtotal || 0), 0);
        const iva = fMes.reduce((s, f) => s + Number(f.total_iva || 0), 0);
        const total = fMes.reduce((s, f) => s + Number(f.total || 0), 0);
        doc.text(mes, 14, y);
        doc.text(count.toString(), 50, y);
        doc.text(formatCurrency(subtotal), 80, y);
        doc.text(formatCurrency(iva), 120, y);
        doc.text(formatCurrency(total), 155, y);
        y += 7;
      });

      doc.save(`Faturacao_Mensal_${selectedYear}.pdf`);
      toast.success('Relatório de faturação exportado!');
    } catch {
      toast.error('Erro ao exportar relatório');
    }
  };

  const exportRelatorioAnual = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório Anual', 14, 22);
      doc.setFontSize(10);
      doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      if (agtConfig?.nif_produtor) doc.text(`NIF: ${agtConfig.nif_produtor}`, 14, 42);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-AO')}`, 14, 48);

      let y = 60;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Anual', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Faturas: ${realStats.faturasEmitidas}`, 14, y); y += 6;
      doc.text(`Total de Clientes: ${realStats.totalClientes}`, 14, y); y += 6;
      doc.text(`Faturação Total: ${formatCurrency(realStats.faturacaoAnual)}`, 14, y); y += 6;
      doc.text(`IVA Total: ${formatCurrency(realStats.ivaAnual)}`, 14, y); y += 12;

      // Invoice breakdown by status
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Estado', 14, y); y += 8;
      doc.setFont('helvetica', 'normal');
      estadoFaturas.forEach(e => {
        doc.text(`${e.name}: ${e.value} fatura(s)`, 14, y);
        y += 6;
      });
      y += 6;

      // Invoice breakdown by type
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Tipo de Documento', 14, y); y += 8;
      doc.setFont('helvetica', 'normal');
      const tipos: Record<string, string> = { 'fatura': 'Fatura', 'fatura-recibo': 'Fatura-Recibo', 'recibo': 'Recibo', 'nota-credito': 'Nota de Crédito', 'proforma': 'Proforma' };
      Object.entries(tipos).forEach(([key, label]) => {
        const count = faturasDoAno.filter(f => f.tipo === key).length;
        if (count > 0) {
          doc.text(`${label}: ${count}`, 14, y);
          y += 6;
        }
      });
      y += 6;

      // Top clients
      if (topProdutos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Top Clientes por Faturação', 14, y); y += 8;
        doc.setFont('helvetica', 'normal');
        topProdutos.forEach(p => {
          doc.text(`${p.nome}: ${formatCurrency(p.vendas)}`, 14, y);
          y += 6;
        });
      }

      doc.save(`Relatorio_Anual_${selectedYear}.pdf`);
      toast.success('Relatório anual exportado!');
    } catch {
      toast.error('Erro ao exportar relatório');
    }
  };

  const exportSAFT = () => {
    try {
      const empresa = agtConfig;
      const now = new Date().toISOString();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">\n`;
      xml += `  <Header>\n`;
      xml += `    <AuditFileVersion>1.01_01</AuditFileVersion>\n`;
      xml += `    <CompanyID>${empresa?.nif_produtor || 'N/A'}</CompanyID>\n`;
      xml += `    <TaxRegistrationNumber>${empresa?.nif_produtor || 'N/A'}</TaxRegistrationNumber>\n`;
      xml += `    <CompanyName>${empresa?.nome_empresa || 'N/A'}</CompanyName>\n`;
      xml += `    <CompanyAddress>\n`;
      xml += `      <AddressDetail>${empresa?.endereco_empresa || empresa?.morada || 'N/A'}</AddressDetail>\n`;
      xml += `      <City>${empresa?.cidade || 'Luanda'}</City>\n`;
      xml += `      <Country>AO</Country>\n`;
      xml += `    </CompanyAddress>\n`;
      xml += `    <FiscalYear>${selectedYear}</FiscalYear>\n`;
      xml += `    <StartDate>${selectedYear}-01-01</StartDate>\n`;
      xml += `    <EndDate>${selectedYear}-12-31</EndDate>\n`;
      xml += `    <DateCreated>${now.split('T')[0]}</DateCreated>\n`;
      xml += `    <CurrencyCode>AOA</CurrencyCode>\n`;
      xml += `    <TaxEntity>Global</TaxEntity>\n`;
      xml += `    <ProductCompanyTaxID>${empresa?.nif_produtor || 'N/A'}</ProductCompanyTaxID>\n`;
      xml += `    <SoftwareCertificateNumber>${empresa?.certificate_number || '0'}</SoftwareCertificateNumber>\n`;
      xml += `    <ProductID>Faktura/Faktura Angola</ProductID>\n`;
      xml += `    <ProductVersion>1.0</ProductVersion>\n`;
      xml += `  </Header>\n`;

      // MasterFiles - Customers
      xml += `  <MasterFiles>\n`;
      clientes.forEach(c => {
        xml += `    <Customer>\n`;
        xml += `      <CustomerID>${c.id}</CustomerID>\n`;
        xml += `      <CustomerTaxID>${c.nif || '999999999'}</CustomerTaxID>\n`;
        xml += `      <CompanyName>${c.nome}</CompanyName>\n`;
        xml += `      <BillingAddress>\n`;
        xml += `        <AddressDetail>${c.endereco}</AddressDetail>\n`;
        xml += `        <City>Luanda</City>\n`;
        xml += `        <Country>AO</Country>\n`;
        xml += `      </BillingAddress>\n`;
        xml += `      <Telephone>${c.telefone || ''}</Telephone>\n`;
        xml += `      <Email>${c.email || ''}</Email>\n`;
        xml += `    </Customer>\n`;
      });

      // Products
      produtos.forEach(p => {
        xml += `    <Product>\n`;
        xml += `      <ProductType>${p.tipo === 'servico' ? 'S' : 'P'}</ProductType>\n`;
        xml += `      <ProductCode>${p.codigo}</ProductCode>\n`;
        xml += `      <ProductDescription>${p.nome}</ProductDescription>\n`;
        xml += `      <ProductNumberCode>${p.codigo}</ProductNumberCode>\n`;
        xml += `    </Product>\n`;
      });

      // Tax Table
      xml += `    <TaxTable>\n`;
      xml += `      <TaxTableEntry>\n`;
      xml += `        <TaxType>IVA</TaxType>\n`;
      xml += `        <TaxCountryRegion>AO</TaxCountryRegion>\n`;
      xml += `        <TaxCode>NOR</TaxCode>\n`;
      xml += `        <Description>IVA Taxa Normal</Description>\n`;
      xml += `        <TaxPercentage>14.00</TaxPercentage>\n`;
      xml += `      </TaxTableEntry>\n`;
      xml += `      <TaxTableEntry>\n`;
      xml += `        <TaxType>IVA</TaxType>\n`;
      xml += `        <TaxCountryRegion>AO</TaxCountryRegion>\n`;
      xml += `        <TaxCode>ISE</TaxCode>\n`;
      xml += `        <Description>IVA Isento</Description>\n`;
      xml += `        <TaxPercentage>0.00</TaxPercentage>\n`;
      xml += `      </TaxTableEntry>\n`;
      xml += `    </TaxTable>\n`;
      xml += `  </MasterFiles>\n`;

      // SourceDocuments - SalesInvoices
      xml += `  <SourceDocuments>\n`;
      xml += `    <SalesInvoices>\n`;
      xml += `      <NumberOfEntries>${faturasDoAno.length}</NumberOfEntries>\n`;
      xml += `      <TotalDebit>0.00</TotalDebit>\n`;
      xml += `      <TotalCredit>${realStats.faturacaoAnual.toFixed(2)}</TotalCredit>\n`;

      faturasDoAno.forEach(f => {
        const tipoMap: Record<string, string> = { 'fatura': 'FT', 'fatura-recibo': 'FR', 'recibo': 'RC', 'nota-credito': 'NC', 'proforma': 'PRO' };
        const invoiceType = tipoMap[f.tipo] || 'FT';
        const statusMap: Record<string, string> = { 'rascunho': 'N', 'emitida': 'N', 'paga': 'F', 'anulada': 'A', 'vencida': 'N' };
        xml += `      <Invoice>\n`;
        xml += `        <InvoiceNo>${f.numero}</InvoiceNo>\n`;
        xml += `        <InvoiceStatus>\n`;
        xml += `          <InvoiceStatus>${statusMap[f.estado] || 'N'}</InvoiceStatus>\n`;
        xml += `          <InvoiceStatusDate>${f.updated_at || f.data_emissao}</InvoiceStatusDate>\n`;
        xml += `        </InvoiceStatus>\n`;
        xml += `        <Hash>${f.assinatura_digital || '0'}</Hash>\n`;
        xml += `        <InvoiceDate>${f.data_emissao}</InvoiceDate>\n`;
        xml += `        <InvoiceType>${invoiceType}</InvoiceType>\n`;
        xml += `        <CustomerID>${f.cliente_id}</CustomerID>\n`;
        xml += `        <DocumentTotals>\n`;
        xml += `          <TaxPayable>${Number(f.total_iva || 0).toFixed(2)}</TaxPayable>\n`;
        xml += `          <NetTotal>${Number(f.subtotal || 0).toFixed(2)}</NetTotal>\n`;
        xml += `          <GrossTotal>${Number(f.total || 0).toFixed(2)}</GrossTotal>\n`;
        xml += `          <Currency>\n`;
        xml += `            <CurrencyCode>AOA</CurrencyCode>\n`;
        xml += `            <CurrencyAmount>${Number(f.total || 0).toFixed(2)}</CurrencyAmount>\n`;
        xml += `          </Currency>\n`;
        xml += `        </DocumentTotals>\n`;
        xml += `      </Invoice>\n`;
      });

      xml += `    </SalesInvoices>\n`;
      xml += `  </SourceDocuments>\n`;
      xml += `</AuditFile>`;

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SAF-T_AO_${selectedYear}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ficheiro SAF-T exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar SAF-T');
    }
  };

  const isLoading = loadingFaturas || loadingStats;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Header with Gradient */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Relatórios
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Análise fiscal e financeira
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedYear}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px] h-11 border-primary/20">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Faturação Anual</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatCurrency(realStats.faturacaoAnual)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">IVA Anual</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatCurrency(realStats.ivaAnual)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Clientes Activos</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {realStats.totalClientes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Faturas Emitidas</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {realStats.faturasEmitidas}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="card-shadow lg:col-span-2 border-primary/10">
          <CardHeader className="pb-4 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                Evolução da Faturação
              </CardTitle>
              <Badge variant="outline" className="text-xs">Mensal</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={faturacaoMensal}>
                  <defs>
                    <linearGradient id="colorFaturacao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}K` : '0'} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Faturação" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturacao)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-primary/10">
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Estado das Faturas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              {estadoFaturas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadoFaturas}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      label={CustomPieLabel}
                      labelLine={false}
                    >
                      {estadoFaturas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-medium">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem dados de faturas para {selectedYear}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="card-shadow border-primary/10">
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-destructive rounded-full" />
              IVA Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faturacaoMensal}>
                  <defs>
                    <linearGradient id="colorIVA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}K` : '0'} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="iva" name="IVA" fill="url(#colorIVA)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-primary/10">
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Top Clientes por Faturação
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              {topProdutos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProdutos} layout="vertical">
                    <defs>
                      <linearGradient id="colorProdutos" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}K` : '0'} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nome" className="text-xs fill-muted-foreground" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="vendas" name="Faturação" fill="url(#colorProdutos)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem dados para {selectedYear}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="card-shadow border-primary/10">
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Exportar Relatórios
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              <FileDown className="w-3 h-3 mr-1" />
              Múltiplos formatos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all"
              onClick={exportMapaIVA}
            >
              <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Mapa de IVA</span>
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={exportFaturacaoMensal}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Faturação Mensal</span>
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
              onClick={exportRelatorioAnual}
            >
              <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Relatório Anual</span>
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-destructive/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              onClick={exportSAFT}
            >
              <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">SAF-T Angola</span>
                <span className="text-xs text-muted-foreground">XML</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
