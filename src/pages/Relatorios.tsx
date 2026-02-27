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
import { formatCurrency } from '@/lib/format';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  Receipt,
  Users,
  Package,
  BarChart3,
  FileDown,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFaturas, useDashboardStats } from '@/hooks/useFaturas';
import { useClientes } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

/* ─── Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-xl p-4 min-w-[160px]">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Pie label ─── */
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ─── KPI Card ─── */
const KpiCard = ({
  label, value, sub, icon, colorClass, bgClass, borderClass,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string;
}) => (
  <Card className={`relative overflow-hidden border-l-4 ${borderClass} hover:shadow-lg transition-shadow duration-200`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight text-foreground truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ─── Export Button ─── */
const ExportBtn = ({
  title, subtitle, format, icon, onClick, colorClass, bgClass,
}: {
  title: string; subtitle: string; format: string; icon: React.ReactNode;
  onClick: () => void; colorClass: string; bgClass: string;
}) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-2xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 p-5 group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Badge variant="secondary" className="text-xs font-bold tracking-wider">{format}</Badge>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </div>
    </div>
  </button>
);

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function Relatorios() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: faturas = [], isLoading: loadingFaturas } = useFaturas();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: clientes = [] } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const { data: agtConfig } = useAgtConfig();

  const faturasDoAno = useMemo(
    () => faturas.filter(f => f.data_emissao?.startsWith(selectedYear)),
    [faturas, selectedYear]
  );

  const faturacaoMensal = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((mes, i) => {
      const m = String(i + 1).padStart(2, '0');
      const fMes = faturasDoAno.filter(f => f.data_emissao?.split('-')[1] === m && f.estado !== 'anulada');
      return {
        mes,
        valor: fMes.reduce((s, f) => s + Number(f.total || 0), 0),
        iva: fMes.reduce((s, f) => s + Number(f.total_iva || 0), 0),
      };
    });
  }, [faturasDoAno]);

  const estadoFaturas = useMemo(() => {
    return [
      { name: 'Pagas',    value: faturasDoAno.filter(f => f.estado === 'paga').length,    color: '#22c55e' },
      { name: 'Emitidas', value: faturasDoAno.filter(f => f.estado === 'emitida').length, color: '#3b82f6' },
      { name: 'Vencidas', value: faturasDoAno.filter(f => f.estado === 'vencida' || (f.estado === 'emitida' && new Date(f.data_vencimento) < new Date())).length, color: '#ef4444' },
      { name: 'Rascunho', value: faturasDoAno.filter(f => f.estado === 'rascunho').length, color: '#6b7280' },
      { name: 'Anuladas', value: faturasDoAno.filter(f => f.estado === 'anulada').length,  color: '#a855f7' },
    ].filter(e => e.value > 0);
  }, [faturasDoAno]);

  const topClientes = useMemo(() => {
    const totals: Record<string, { nome: string; vendas: number }> = {};
    faturasDoAno.forEach(f => {
      if (f.estado === 'anulada') return;
      const nome = (f.cliente as any)?.nome || 'Desconhecido';
      if (!totals[nome]) totals[nome] = { nome, vendas: 0 };
      totals[nome].vendas += Number(f.total || 0);
    });
    return Object.values(totals).sort((a, b) => b.vendas - a.vendas).slice(0, 5);
  }, [faturasDoAno]);

  const realStats = useMemo(() => {
    const active = faturasDoAno.filter(f => f.estado !== 'anulada');
    return {
      faturacaoAnual:  active.reduce((s, f) => s + Number(f.total || 0), 0),
      ivaAnual:        active.reduce((s, f) => s + Number(f.total_iva || 0), 0),
      totalClientes:   clientes.length,
      faturasEmitidas: faturasDoAno.filter(f => f.estado !== 'anulada' && f.estado !== 'rascunho').length,
    };
  }, [faturasDoAno, clientes]);

  const availableYears = useMemo(() => {
    const years = new Set<string>([currentYear.toString()]);
    faturas.forEach(f => { const y = f.data_emissao?.split('-')[0]; if (y) years.add(y); });
    return Array.from(years).sort().reverse();
  }, [faturas, currentYear]);

  /* ── Exports ── */
  const exportMapaIVA = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text('Mapa de IVA', 14, 22);
      doc.setFontSize(10); doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      if (agtConfig?.nif_produtor) doc.text(`NIF: ${agtConfig.nif_produtor}`, 14, 42);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-AO')}`, 14, 48);
      let y = 58;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Mês', 14, y); doc.text('Base (Kz)', 60, y); doc.text('IVA (Kz)', 115, y); doc.text('Total (Kz)', 160, y);
      y += 2; doc.line(14, y, 196, y); y += 6; doc.setFont('helvetica', 'normal');
      let tb = 0, ti = 0, tt = 0;
      faturacaoMensal.forEach(m => {
        const base = m.valor - m.iva;
        doc.text(m.mes, 14, y); doc.text(formatCurrency(base), 60, y); doc.text(formatCurrency(m.iva), 115, y); doc.text(formatCurrency(m.valor), 160, y);
        tb += base; ti += m.iva; tt += m.valor; y += 7;
      });
      y += 2; doc.line(14, y, 196, y); y += 6; doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 14, y); doc.text(formatCurrency(tb), 60, y); doc.text(formatCurrency(ti), 115, y); doc.text(formatCurrency(tt), 160, y);
      doc.save(`Mapa_IVA_${selectedYear}.pdf`);
      toast.success('Mapa de IVA exportado!');
    } catch { toast.error('Erro ao exportar'); }
  };

  const exportFaturacaoMensal = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text('Faturação Mensal', 14, 22);
      doc.setFontSize(10); doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-AO')}`, 14, 42);
      let y = 52;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Mês', 14, y); doc.text('Nº Fat.', 50, y); doc.text('Subtotal', 75, y); doc.text('IVA', 115, y); doc.text('Total', 155, y);
      y += 2; doc.line(14, y, 196, y); y += 6; doc.setFont('helvetica', 'normal');
      ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].forEach((mes, i) => {
        const ms = String(i + 1).padStart(2, '0');
        const fMes = faturasDoAno.filter(f => f.data_emissao?.split('-')[1] === ms && f.estado !== 'anulada');
        doc.text(mes, 14, y); doc.text(fMes.length.toString(), 50, y);
        doc.text(formatCurrency(fMes.reduce((s, f) => s + Number(f.subtotal || 0), 0)), 75, y);
        doc.text(formatCurrency(fMes.reduce((s, f) => s + Number(f.total_iva || 0), 0)), 115, y);
        doc.text(formatCurrency(fMes.reduce((s, f) => s + Number(f.total || 0), 0)), 155, y);
        y += 7;
      });
      doc.save(`Faturacao_Mensal_${selectedYear}.pdf`);
      toast.success('Relatório de faturação exportado!');
    } catch { toast.error('Erro ao exportar'); }
  };

  const exportRelatorioAnual = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text('Relatório Anual', 14, 22);
      doc.setFontSize(10); doc.text(`Ano: ${selectedYear}`, 14, 30);
      if (agtConfig?.nome_empresa) doc.text(`Empresa: ${agtConfig.nome_empresa}`, 14, 36);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-AO')}`, 14, 42);
      let y = 54;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Resumo Anual', 14, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Faturas emitidas: ${realStats.faturasEmitidas}`, 14, y); y += 6;
      doc.text(`Clientes: ${realStats.totalClientes}`, 14, y); y += 6;
      doc.text(`Faturação total: ${formatCurrency(realStats.faturacaoAnual)}`, 14, y); y += 6;
      doc.text(`IVA total: ${formatCurrency(realStats.ivaAnual)}`, 14, y); y += 12;
      doc.setFont('helvetica', 'bold'); doc.text('Por Estado', 14, y); y += 8;
      doc.setFont('helvetica', 'normal');
      estadoFaturas.forEach(e => { doc.text(`${e.name}: ${e.value}`, 14, y); y += 6; });
      y += 6;
      if (topClientes.length > 0) {
        doc.setFont('helvetica', 'bold'); doc.text('Top Clientes', 14, y); y += 8;
        doc.setFont('helvetica', 'normal');
        topClientes.forEach(c => { doc.text(`${c.nome}: ${formatCurrency(c.vendas)}`, 14, y); y += 6; });
      }
      doc.save(`Relatorio_Anual_${selectedYear}.pdf`);
      toast.success('Relatório anual exportado!');
    } catch { toast.error('Erro ao exportar'); }
  };

  const exportSAFT = () => {
    try {
      const empresa = agtConfig;
      const now = new Date().toISOString();
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">\n`;
      xml += `  <Header>\n    <AuditFileVersion>1.01_01</AuditFileVersion>\n    <CompanyID>${empresa?.nif_produtor||'N/A'}</CompanyID>\n    <TaxRegistrationNumber>${empresa?.nif_produtor||'N/A'}</TaxRegistrationNumber>\n    <CompanyName>${empresa?.nome_empresa||'N/A'}</CompanyName>\n    <CompanyAddress><AddressDetail>${empresa?.endereco_empresa||empresa?.morada||'N/A'}</AddressDetail><City>${empresa?.cidade||'Luanda'}</City><Country>AO</Country></CompanyAddress>\n    <FiscalYear>${selectedYear}</FiscalYear>\n    <StartDate>${selectedYear}-01-01</StartDate>\n    <EndDate>${selectedYear}-12-31</EndDate>\n    <DateCreated>${now.split('T')[0]}</DateCreated>\n    <CurrencyCode>AOA</CurrencyCode>\n    <TaxEntity>Global</TaxEntity>\n    <ProductCompanyTaxID>${empresa?.nif_produtor||'N/A'}</ProductCompanyTaxID>\n    <SoftwareCertificateNumber>${empresa?.certificate_number||'0'}</SoftwareCertificateNumber>\n    <ProductID>Faktura/Faktura Angola</ProductID>\n    <ProductVersion>1.0</ProductVersion>\n  </Header>\n`;
      xml += `  <MasterFiles>\n`;
      clientes.forEach(c => { xml += `    <Customer><CustomerID>${c.id}</CustomerID><CustomerTaxID>${c.nif||'999999999'}</CustomerTaxID><CompanyName>${c.nome}</CompanyName><BillingAddress><AddressDetail>${c.endereco}</AddressDetail><City>Luanda</City><Country>AO</Country></BillingAddress><Telephone>${c.telefone||''}</Telephone><Email>${c.email||''}</Email></Customer>\n`; });
      produtos.forEach(p => { xml += `    <Product><ProductType>${p.tipo==='servico'?'S':'P'}</ProductType><ProductCode>${p.codigo}</ProductCode><ProductDescription>${p.nome}</ProductDescription><ProductNumberCode>${p.codigo}</ProductNumberCode></Product>\n`; });
      xml += `    <TaxTable><TaxTableEntry><TaxType>IVA</TaxType><TaxCountryRegion>AO</TaxCountryRegion><TaxCode>NOR</TaxCode><Description>IVA Taxa Normal</Description><TaxPercentage>14.00</TaxPercentage></TaxTableEntry><TaxTableEntry><TaxType>IVA</TaxType><TaxCountryRegion>AO</TaxCountryRegion><TaxCode>ISE</TaxCode><Description>IVA Isento</Description><TaxPercentage>0.00</TaxPercentage></TaxTableEntry></TaxTable>\n  </MasterFiles>\n`;
      xml += `  <SourceDocuments>\n    <SalesInvoices>\n      <NumberOfEntries>${faturasDoAno.length}</NumberOfEntries>\n      <TotalDebit>0.00</TotalDebit>\n      <TotalCredit>${realStats.faturacaoAnual.toFixed(2)}</TotalCredit>\n`;
      const tipoMap: Record<string,string> = {'fatura':'FT','fatura-recibo':'FR','recibo':'RC','nota-credito':'NC','proforma':'PRO'};
      const statusMap: Record<string,string> = {'rascunho':'N','emitida':'N','paga':'F','anulada':'A','vencida':'N'};
      faturasDoAno.forEach(f => { xml += `      <Invoice><InvoiceNo>${f.numero}</InvoiceNo><InvoiceStatus><InvoiceStatus>${statusMap[f.estado]||'N'}</InvoiceStatus><InvoiceStatusDate>${f.updated_at||f.data_emissao}</InvoiceStatusDate></InvoiceStatus><Hash>${f.assinatura_digital||'0'}</Hash><InvoiceDate>${f.data_emissao}</InvoiceDate><InvoiceType>${tipoMap[f.tipo]||'FT'}</InvoiceType><CustomerID>${f.cliente_id}</CustomerID><DocumentTotals><TaxPayable>${Number(f.total_iva||0).toFixed(2)}</TaxPayable><NetTotal>${Number(f.subtotal||0).toFixed(2)}</NetTotal><GrossTotal>${Number(f.total||0).toFixed(2)}</GrossTotal><Currency><CurrencyCode>AOA</CurrencyCode><CurrencyAmount>${Number(f.total||0).toFixed(2)}</CurrencyAmount></Currency></DocumentTotals></Invoice>\n`; });
      xml += `    </SalesInvoices>\n  </SourceDocuments>\n</AuditFile>`;
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `SAF-T_AO_${selectedYear}.xml`; a.click();
      URL.revokeObjectURL(url);
      toast.success('SAF-T exportado!');
    } catch { toast.error('Erro ao exportar SAF-T'); }
  };

  /* ── Loading ── */
  if (loadingFaturas || loadingStats) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">A carregar dados...</p>
        </div>
      </MainLayout>
    );
  }

  /* ── Render ── */
  return (
    <MainLayout>
      <div className="space-y-6">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Análise fiscal e financeira · {selectedYear}</p>
            </div>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36 h-10">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Faturação Anual"
            value={formatCurrency(realStats.faturacaoAnual)}
            sub={`${realStats.faturasEmitidas} documentos`}
            icon={<TrendingUp className="w-5 h-5" />}
            colorClass="text-primary"
            bgClass="bg-primary/10"
            borderClass="border-l-primary"
          />
          <KpiCard
            label="IVA Acumulado"
            value={formatCurrency(realStats.ivaAnual)}
            sub="14% taxa normal"
            icon={<Receipt className="w-5 h-5" />}
            colorClass="text-destructive"
            bgClass="bg-destructive/10"
            borderClass="border-l-destructive"
          />
          <KpiCard
            label="Clientes Activos"
            value={realStats.totalClientes.toString()}
            sub="base total"
            icon={<Users className="w-5 h-5" />}
            colorClass="text-green-600 dark:text-green-400"
            bgClass="bg-green-100 dark:bg-green-950"
            borderClass="border-l-green-500"
          />
          <KpiCard
            label="Faturas Emitidas"
            value={realStats.faturasEmitidas.toString()}
            sub={`em ${selectedYear}`}
            icon={<Package className="w-5 h-5" />}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-100 dark:bg-amber-950"
            borderClass="border-l-amber-500"
          />
        </div>

        {/* ─── CHARTS ROW 1 ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Area chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Evolução da Faturação
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Mensal</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-2">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={faturacaoMensal} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}K` : '0'} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Faturação" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#areaFill)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Estado das Faturas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 pb-2">
              {estadoFaturas.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={estadoFaturas} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" label={CustomPieLabel} labelLine={false}>
                      {estadoFaturas.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} fatura(s)`]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={v => <span className="text-xs text-muted-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                  Sem dados para {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── CHARTS ROW 2 ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* IVA bar */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                  IVA Mensal
                </CardTitle>
                <Badge variant="outline" className="text-xs">14%</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={faturacaoMensal} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ivaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}K` : '0'} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="iva" name="IVA" fill="url(#ivaFill)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top clients */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Top Clientes
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Por faturação</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-2">
              {topClientes.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topClientes} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clientFill" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}K` : '0'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="vendas" name="Faturação" fill="url(#clientFill)" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Sem dados para {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── EXPORT ─── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileDown className="w-4 h-4 text-primary" />
                Exportar Relatórios
              </CardTitle>
              <Badge variant="secondary" className="text-xs">PDF · XML</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <ExportBtn
                title="Mapa de IVA"
                subtitle="Resumo fiscal mensal"
                format="PDF"
                icon={<FileSpreadsheet className="w-5 h-5" />}
                onClick={exportMapaIVA}
                colorClass="text-green-600 dark:text-green-400"
                bgClass="bg-green-100 dark:bg-green-950"
              />
              <ExportBtn
                title="Faturação Mensal"
                subtitle="Detalhe mês a mês"
                format="PDF"
                icon={<FileText className="w-5 h-5" />}
                onClick={exportFaturacaoMensal}
                colorClass="text-primary"
                bgClass="bg-primary/10"
              />
              <ExportBtn
                title="Relatório Anual"
                subtitle={`Sumário de ${selectedYear}`}
                format="PDF"
                icon={<Calendar className="w-5 h-5" />}
                onClick={exportRelatorioAnual}
                colorClass="text-amber-600 dark:text-amber-400"
                bgClass="bg-amber-100 dark:bg-amber-950"
              />
              <ExportBtn
                title="SAF-T Angola"
                subtitle="Ficheiro de auditoria fiscal"
                format="XML"
                icon={<Receipt className="w-5 h-5" />}
                onClick={exportSAFT}
                colorClass="text-destructive"
                bgClass="bg-destructive/10"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}