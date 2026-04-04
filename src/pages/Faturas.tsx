import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFaturas, useFatura, useUpdateFaturaEstado, type Fatura } from '@/hooks/useFaturas';
import { useConvertProforma } from '@/hooks/useProformaConversion';
import { formatCurrency } from '@/lib/format';
import { generateInvoicePDF, downloadInvoicePDF, type CompanyInfo } from '@/lib/pdf-generator';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import {
  Plus, Search, MoreVertical, Eye, Download, Printer,
  FileText, XCircle, CheckCircle, Loader2, Send,
  TrendingUp, ArrowUpRight, X, AlertCircle, Calendar,
  DollarSign, RefreshCw, Activity, Sparkles, ChevronDown,
  Receipt, Filter, Copy, Edit, Link2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SendInvoiceDialog } from '@/components/faturas/SendInvoiceDialog';
import { CreatePaymentLinkDialog } from '@/components/pagamentos/CreatePaymentLinkDialog';

/* ─── Types ─────────────────────────────────────────── */
type EstadoFatura   = 'rascunho' | 'emitida' | 'paga' | 'anulada' | 'vencida';
type TipoDocumento  = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito' | 'proforma';

/* ─── Config maps ────────────────────────────────────── */
const estadoStyles: Record<EstadoFatura, { label: string; className: string; dot: string; icon: any }> = {
  rascunho: { label: 'Rascunho', dot: 'bg-gray-400',   className: 'bg-muted text-muted-foreground border-muted-foreground/20',                            icon: FileText    },
  emitida:  { label: 'Emitida',  dot: 'bg-blue-500',   className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',         icon: Send        },
  paga:     { label: 'Paga',     dot: 'bg-green-500',  className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',     icon: CheckCircle },
  anulada:  { label: 'Anulada',  dot: 'bg-gray-400',   className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',          icon: XCircle     },
  vencida:  { label: 'Vencida',  dot: 'bg-red-500',    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',               icon: AlertCircle },
};

const tipoIcons: Record<TipoDocumento, { label: string; short: string; color: string; bg: string }> = {
  'fatura':        { label: 'Fatura',         short: 'FT',  color: 'text-primary',                               bg: 'bg-primary/10'                                    },
  'fatura-recibo': { label: 'Fatura-Recibo',  short: 'FR',  color: 'text-indigo-600 dark:text-indigo-400',       bg: 'bg-indigo-100 dark:bg-indigo-950'                 },
  'recibo':        { label: 'Recibo',         short: 'RC',  color: 'text-emerald-600 dark:text-emerald-400',     bg: 'bg-emerald-100 dark:bg-emerald-950'               },
  'nota-credito':  { label: 'Nota de Crédito',short: 'NC',  color: 'text-orange-600 dark:text-orange-400',       bg: 'bg-orange-100 dark:bg-orange-950'                 },
  'proforma':      { label: 'Proforma',       short: 'PRO', color: 'text-violet-600 dark:text-violet-400',       bg: 'bg-violet-100 dark:bg-violet-950'                 },
};

/* ─── FadeUp ─────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity .55s cubic-bezier(.4,0,.2,1), transform .55s cubic-bezier(.4,0,.2,1)' }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Faturas() {
  const { data: faturas = [], isLoading } = useFaturas();
  const { data: agtConfig } = useAgtConfig();
  const updateEstado   = useUpdateFaturaEstado();
  const convertProforma = useConvertProforma();
  const navigate = useNavigate();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [estadoFilter,     setEstadoFilter]      = useState<string>('all');
  const [tipoFilter,       setTipoFilter]        = useState<string>('all');
  const [selectedFaturaId, setSelectedFaturaId]  = useState<string | null>(null);
  const [isDownloading,    setIsDownloading]     = useState<string | null>(null);
  const [sendDialogFatura, setSendDialogFatura]  = useState<Fatura | null>(null);
  const [showFilters,      setShowFilters]       = useState(false);
  const [paymentLinkFatura, setPaymentLinkFatura] = useState<Fatura | null>(null);
  const [printFatura,      setPrintFatura]       = useState<Fatura | null>(null);
  const [hoveredRow,       setHoveredRow]        = useState<string | null>(null);

  const { data: selectedFatura } = useFatura(selectedFaturaId || '');

  const filteredFaturas = faturas.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      (f.numero.toLowerCase().includes(q) || f.cliente?.nome?.toLowerCase().includes(q) || f.cliente?.nif?.includes(q)) &&
      (estadoFilter === 'all' || f.estado === estadoFilter) &&
      (tipoFilter   === 'all' || f.tipo   === tipoFilter)
    );
  });

  const totalFaturado = filteredFaturas.reduce((a, f) => a + Number(f.total), 0);
  const totalIva      = filteredFaturas.reduce((a, f) => a + Number(f.total_iva), 0);
  const totalPagas    = filteredFaturas.filter(f => f.estado === 'paga').length;
  const totalVencidas = filteredFaturas.filter(f => f.estado === 'vencida').length;
  const activeFilters = (estadoFilter !== 'all' ? 1 : 0) + (tipoFilter !== 'all' ? 1 : 0);
  const hasFilters    = activeFilters > 0 || !!searchTerm;

  const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-AO');

  /* ── PDF ── */
  const handleDownloadPDF = async (e: React.MouseEvent | null, fatura: Fatura) => {
    e?.preventDefault(); e?.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(fatura.id);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const [faturaRes, itensRes] = await Promise.all([
        supabase.from('faturas').select('*, cliente:clientes(*)').eq('id', fatura.id).single(),
        supabase.from('itens_fatura').select('*, produto:produtos(*)').eq('fatura_id', fatura.id),
      ]);
      if (faturaRes.error) throw faturaRes.error;
      if (itensRes.error)  throw itensRes.error;
      const fullFatura = { ...faturaRes.data, itens: itensRes.data };
      const companyInfo: CompanyInfo | undefined = agtConfig ? { nome_empresa: agtConfig.nome_empresa || undefined, nif_produtor: agtConfig.nif_produtor || undefined, endereco_empresa: agtConfig.endereco_empresa || undefined, telefone: agtConfig.telefone || undefined, email: agtConfig.email || undefined, website: agtConfig.website || undefined, morada: agtConfig.morada || undefined, cidade: agtConfig.cidade || undefined, provincia: agtConfig.provincia || undefined, actividade_comercial: agtConfig.actividade_comercial || undefined, alvara_comercial: agtConfig.alvara_comercial || undefined } : undefined;
      const blob = await generateInvoicePDF(fullFatura as Fatura, companyInfo);
      const url  = URL.createObjectURL(blob);
      const filename = `${fatura.numero.replace(/\//g, '-')}.pdf`;
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        downloadInvoicePDF(blob, filename);
      }
      toast.success('PDF gerado com sucesso!');
    } catch { toast.error('Erro ao gerar PDF'); }
    finally { setIsDownloading(null); }
  };

  const handleMarkAsPaid = async (id: string) => {
    try { await updateEstado.mutateAsync({ id, estado: 'paga', data_pagamento: new Date().toISOString().split('T')[0] }); toast.success('Fatura marcada como paga!'); }
    catch { toast.error('Erro ao marcar fatura como paga'); }
  };

  const handleCancelInvoice = async (id: string) => {
    try { await updateEstado.mutateAsync({ id, estado: 'anulada' }); toast.success('Fatura anulada com sucesso!'); }
    catch { toast.error('Erro ao anular fatura'); }
  };

  const clearFilters = () => { setEstadoFilter('all'); setTipoFilter('all'); setSearchTerm(''); };

  /* ── Loading ── */
  if (isLoading) return (
    <MainLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .ldr{animation:spin 1.1s linear infinite;transform-origin:center}`}</style>
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary ldr" />
          <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">A carregar faturas</p>
          <p className="text-xs text-muted-foreground mt-1">Por favor aguarde…</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <style>{`
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-d  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
        @keyframes row-in   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes chip-in  { from{opacity:0;transform:translateY(-6px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes expand   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .shimmer-text {
          background:linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 45%,hsl(var(--primary)) 90%);
          background-size:200% auto; -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite;
        }
        .stat-card { transition:all .3s cubic-bezier(.4,0,.2,1); }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 10px 28px hsl(var(--primary)/.1); }

        .fatura-row { transition:background .18s ease; animation:row-in .35s ease both; }
        .fatura-row:hover .doc-avatar { transform:scale(1.08); box-shadow:0 4px 16px hsl(var(--primary)/.2); }
        .doc-avatar { transition:all .25s cubic-bezier(.34,1.56,.64,1); }

        .filter-expand { animation:expand .25s cubic-bezier(.4,0,.2,1) both; }
        .chip-in       { animation:chip-in .2s ease both; }
        .anim-float    { animation:float 6s ease-in-out infinite; }
        .live-dot      { animation:pulse-d 1.8s ease-in-out infinite; }

        .search-wrap:focus-within { box-shadow:0 0 0 3px hsl(var(--primary)/.15); border-color:hsl(var(--primary)/.5); }
        .search-wrap { transition:box-shadow .2s ease, border-color .2s ease; }

        .btn-cta { transition:all .25s ease; }
        .btn-cta:hover { transform:translateY(-1px); box-shadow:0 8px 24px hsl(var(--primary)/.3); }
      `}</style>

      {/* ── Hero Header ── */}
      <FadeUp delay={0}>
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-7">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-primary/8 rounded-full blur-3xl anim-float" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 w-48 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <FileText className="w-7 h-7 text-white" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background live-dot" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  <span className="shimmer-text">Faturas</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-sm text-muted-foreground">Gestão e emissão de documentos fiscais</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/12 text-primary font-bold border border-primary/20">
                    {filteredFaturas.length} {filteredFaturas.length === 1 ? 'documento' : 'documentos'}
                  </span>
                  {totalVencidas > 0 && (
                    <span className="chip-in text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {totalVencidas} vencida{totalVencidas > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="btn-cta font-bold shadow-xl shadow-primary/20 group">
              <Link to="/faturas/nova">
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Nova Fatura
                <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </FadeUp>

      {/* ── Stat Pills ── */}
      <FadeUp delay={80}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Faturado', value: formatCurrency(totalFaturado), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
            { label: 'Total IVA',      value: formatCurrency(totalIva),      icon: Receipt,    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800' },
            { label: 'Faturas Pagas',  value: `${totalPagas}`,               icon: CheckCircle,color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-950',   border: 'border-green-200 dark:border-green-800'  },
            { label: 'Documentos',     value: `${filteredFaturas.length}`,   icon: FileText,   color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-950',     border: 'border-blue-200 dark:border-blue-800'    },
          ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <div key={i} className={cn('stat-card bg-card rounded-2xl border p-5 flex items-center justify-between cursor-default', border)}>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                <p className="text-xl font-black leading-tight">{value}</p>
              </div>
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* ── Search + Filters ── */}
      <FadeUp delay={150}>
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="search-wrap relative flex-1 rounded-xl border border-border/60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Pesquisar por número, cliente ou NIF…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn('h-11 gap-2 border-border/60 hover:bg-muted/40 transition-all', showFilters && 'bg-primary/6 border-primary/40', activeFilters > 0 && 'border-primary text-primary')}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">{activeFilters}</span>
              )}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-300', showFilters && 'rotate-180')} />
            </Button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="filter-expand flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/40">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full sm:w-[210px] h-11 border-border/60 bg-muted/30">
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {(Object.entries(tipoIcons) as [TipoDocumento, any][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-black px-1.5 py-0.5 rounded', v.bg, v.color)}>{v.short}</span>
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full sm:w-[210px] h-11 border-border/60 bg-muted/30">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {(Object.entries(estadoStyles) as [EstadoFatura, any][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', v.dot)} />
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilters > 0 && (
                <Button variant="ghost" onClick={clearFilters} className="h-11 text-muted-foreground hover:text-foreground gap-1.5">
                  <X className="w-4 h-4" /> Limpar filtros
                </Button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground font-medium">Activos:</span>
              {searchTerm && (
                <span className="chip-in inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold">
                  "{searchTerm}" <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {estadoFilter !== 'all' && (
                <span className="chip-in inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold">
                  <span className={cn('w-2 h-2 rounded-full', estadoStyles[estadoFilter as EstadoFatura]?.dot)} />
                  {estadoStyles[estadoFilter as EstadoFatura]?.label}
                  <button onClick={() => setEstadoFilter('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {tipoFilter !== 'all' && (
                <span className="chip-in inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold">
                  {tipoIcons[tipoFilter as TipoDocumento]?.label}
                  <button onClick={() => setTipoFilter('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </FadeUp>

      {/* ── Table ── */}
      <FadeUp delay={220}>
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Documentos
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-1">
                  {filteredFaturas.length}
                </span>
              </CardTitle>
              {filteredFaturas.length > 0 && (
                <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
                  Total: <span className="text-foreground font-bold">{formatCurrency(totalFaturado)}</span>
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredFaturas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
                <div className="relative w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="w-9 h-9 text-muted-foreground/40" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center">
                    {hasFilters ? <Search className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-primary" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg">{hasFilters ? 'Nenhum resultado' : 'Sem faturas ainda'}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {hasFilters ? 'Tente ajustar os filtros ou a pesquisa.' : 'Crie a sua primeira fatura e comece a faturar.'}
                  </p>
                </div>
                {hasFilters
                  ? <Button variant="outline" onClick={clearFilters}><X className="w-4 h-4 mr-2" />Limpar filtros</Button>
                  : <Button asChild className="btn-cta"><Link to="/faturas/nova"><Plus className="w-4 h-4 mr-2" />Nova Fatura</Link></Button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documento</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
                      <TableHead className="hidden md:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Emissão</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Vencimento</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                      <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaturas.map((fatura, i) => {
                      const estado = estadoStyles[fatura.estado as EstadoFatura];
                      const EstadoIcon = estado?.icon ?? FileText;
                      const tipoInfo = tipoIcons[fatura.tipo as TipoDocumento] ?? tipoIcons['fatura'];
                      const isVencida = fatura.estado === 'vencida';

                      return (
                        <TableRow
                          key={fatura.id}
                          className="fatura-row border-border/30 hover:bg-muted/40 group cursor-pointer"
                          style={{ animationDelay: `${i * 35}ms` }}
                          onMouseEnter={() => setHoveredRow(fatura.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {/* Documento */}
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn('doc-avatar w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ring-2 ring-transparent group-hover:ring-primary/20', tipoInfo.bg, tipoInfo.color)}>
                                {tipoInfo.short}
                              </div>
                              <div>
                                <p className="font-bold text-sm font-mono">{fatura.numero}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{tipoInfo.label}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Cliente */}
                          <TableCell>
                            <p className="font-semibold text-sm truncate max-w-[190px]">{fatura.cliente?.nome || '—'}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">NIF {fatura.cliente?.nif || 'N/A'}</p>
                          </TableCell>

                          {/* Emissão */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              {formatDate(fatura.data_emissao)}
                            </div>
                          </TableCell>

                          {/* Vencimento */}
                          <TableCell className="hidden lg:table-cell">
                            <div className={cn('flex items-center gap-1.5 text-sm', isVencida ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground')}>
                              {isVencida && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                              {!isVencida && <Calendar className="w-3.5 h-3.5 flex-shrink-0" />}
                              {formatDate(fatura.data_vencimento)}
                            </div>
                          </TableCell>

                          {/* Total */}
                          <TableCell className="text-right">
                            <p className="font-bold text-sm tabular-nums">{formatCurrency(Number(fatura.total))}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">IVA {formatCurrency(Number(fatura.total_iva))}</p>
                          </TableCell>

                          {/* Estado */}
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={cn('text-xs font-semibold border gap-1 transition-all group-hover:scale-105', estado?.className)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', estado?.dot)} />
                              {estado?.label ?? fatura.estado}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn('h-8 w-8 rounded-lg transition-all duration-200', hoveredRow === fatura.id ? 'opacity-100 bg-muted' : 'opacity-0')}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border/60">
                                <DropdownMenuItem onClick={() => setSelectedFaturaId(fatura.id)} className="rounded-lg gap-2 cursor-pointer">
                                  <Eye className="w-4 h-4 text-primary" /> Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDownloadPDF(null, fatura); }} disabled={isDownloading === fatura.id} className="rounded-lg gap-2 cursor-pointer">
                                  {isDownloading === fatura.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-muted-foreground" />}
                                  Descarregar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                  <Printer className="w-4 h-4 text-muted-foreground" /> Imprimir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSendDialogFatura(fatura)} className="rounded-lg gap-2 cursor-pointer">
                                  <Send className="w-4 h-4 text-muted-foreground" /> Enviar ao Cliente
                                </DropdownMenuItem>
                                {(fatura.estado === 'emitida' || fatura.estado === 'vencida') && (
                                  <DropdownMenuItem onClick={() => setPaymentLinkFatura(fatura)} className="rounded-lg gap-2 cursor-pointer">
                                    <Link2 className="w-4 h-4 text-primary" /> Gerar Link de Pagamento
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  // Store fatura data in sessionStorage for duplication
                                  sessionStorage.setItem('duplicar_fatura', JSON.stringify({
                                    tipo: fatura.tipo,
                                    cliente_id: fatura.cliente_id,
                                    observacoes: fatura.observacoes,
                                    metodo_pagamento: fatura.metodo_pagamento,
                                  }));
                                  navigate('/faturas/nova');
                                  toast.info('Fatura duplicada — preencha os itens');
                                }} className="rounded-lg gap-2 cursor-pointer">
                                  <Copy className="w-4 h-4 text-muted-foreground" /> Duplicar Fatura
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {fatura.tipo === 'proforma' && fatura.estado === 'emitida' && (
                                  <DropdownMenuItem className="rounded-lg gap-2 text-primary focus:text-primary font-semibold cursor-pointer" onClick={() => convertProforma.mutate(fatura.id)} disabled={convertProforma.isPending}>
                                    <RefreshCw className="w-4 h-4" /> Converter em Fatura
                                  </DropdownMenuItem>
                                )}
                                {fatura.estado === 'emitida' && (
                                  <DropdownMenuItem className="rounded-lg gap-2 text-green-600 dark:text-green-400 focus:text-green-600 cursor-pointer" onClick={() => handleMarkAsPaid(fatura.id)}>
                                    <CheckCircle className="w-4 h-4" /> Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                {(fatura.estado === 'emitida' || fatura.estado === 'vencida') && (
                                  <DropdownMenuItem className="rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => handleCancelInvoice(fatura.id)}>
                                    <XCircle className="w-4 h-4" /> Anular Fatura
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUp>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!selectedFaturaId} onOpenChange={() => setSelectedFaturaId(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-border/60 p-0">
          {selectedFatura && (() => {
            const est = estadoStyles[selectedFatura.estado as EstadoFatura];
            return (
              <>
                {/* Dialog Header with gradient */}
                <div className="relative overflow-hidden px-8 pt-8 pb-6 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-b border-border/50">
                  <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-primary/8 rounded-full blur-3xl" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0', tipoIcons[selectedFatura.tipo as TipoDocumento]?.bg, tipoIcons[selectedFatura.tipo as TipoDocumento]?.color)}>
                        {tipoIcons[selectedFatura.tipo as TipoDocumento]?.short}
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-black font-mono">{selectedFatura.numero}</DialogTitle>
                        <DialogDescription className="mt-1 flex items-center gap-2">
                          <span>{tipoIcons[selectedFatura.tipo as TipoDocumento]?.label}</span>
                          <Badge variant="secondary" className={cn('text-xs border gap-1', est?.className)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', est?.dot)} />
                            {est?.label}
                          </Badge>
                        </DialogDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={(e) => handleDownloadPDF(e, selectedFatura)} disabled={isDownloading === selectedFatura.id} className="gap-2">
                        {isDownloading === selectedFatura.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        PDF
                      </Button>
                      <Button size="sm" onClick={() => setSendDialogFatura(selectedFatura)} className="gap-2">
                        <Send className="w-4 h-4" /> Enviar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dialog Body */}
                <div className="px-8 py-6 space-y-6">
                  {/* Client + Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-muted/30 rounded-2xl p-5 space-y-3 border border-border/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Cliente
                      </p>
                      <div>
                        <p className="font-bold text-lg leading-snug">{selectedFatura.cliente?.nome}</p>
                        <p className="text-sm text-muted-foreground font-mono mt-1">NIF {selectedFatura.cliente?.nif}</p>
                        {selectedFatura.cliente?.email && <p className="text-sm text-muted-foreground mt-0.5">{selectedFatura.cliente.email}</p>}
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-5 space-y-3 border border-border/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Datas
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: 'Emissão',    value: formatDate(selectedFatura.data_emissao),   color: '' },
                          { label: 'Vencimento', value: formatDate(selectedFatura.data_vencimento), color: selectedFatura.estado === 'vencida' ? 'text-red-600 dark:text-red-400' : '' },
                          ...(selectedFatura.data_pagamento ? [{ label: 'Pagamento', value: formatDate(selectedFatura.data_pagamento), color: 'text-green-600 dark:text-green-400 font-semibold' }] : []),
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className={cn('text-sm font-semibold', color)}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <div className="w-1 h-4 bg-primary rounded-full" /> Itens da Fatura
                    </p>
                    <div className="border border-border/50 rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/40">
                            <TableHead className="font-bold text-xs">Produto/Serviço</TableHead>
                            <TableHead className="text-right font-bold text-xs">Qtd</TableHead>
                            <TableHead className="text-right font-bold text-xs">Preço Unit.</TableHead>
                            <TableHead className="text-right font-bold text-xs">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedFatura.itens?.map((item, idx) => (
                            <TableRow key={item.id} className={cn('border-border/30', idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/15')}>
                              <TableCell className="font-medium text-sm">{item.produto?.nome}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{item.quantidade}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{formatCurrency(Number(item.preco_unitario))}</TableCell>
                              <TableCell className="text-right font-bold text-sm tabular-nums">{formatCurrency(Number(item.total))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-full sm:w-80 space-y-2.5 bg-muted/30 rounded-2xl p-5 border border-border/40">
                      {[
                        { label: 'Subtotal', value: formatCurrency(Number(selectedFatura.subtotal)), cls: 'text-sm' },
                        { label: 'IVA (14%)', value: formatCurrency(Number(selectedFatura.total_iva)), cls: 'text-sm text-orange-600 dark:text-orange-400' },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className={cn('font-semibold', cls)}>{value}</span>
                        </div>
                      ))}
                      <div className="h-px bg-border/60 my-1" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <span className="font-black text-xl text-primary tabular-nums">{formatCurrency(Number(selectedFatura.total))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialog Footer */}
                <div className="px-8 pb-6 flex justify-end gap-3 border-t border-border/40 pt-5">
                  <Button variant="outline" onClick={() => setSelectedFaturaId(null)} className="rounded-xl">Fechar</Button>
                  {selectedFatura.estado === 'emitida' && (
                    <Button variant="outline" className="rounded-xl text-green-600 border-green-200 hover:bg-green-50 gap-2" onClick={() => { handleMarkAsPaid(selectedFatura.id); setSelectedFaturaId(null); }}>
                      <CheckCircle className="w-4 h-4" /> Marcar Paga
                    </Button>
                  )}
                  <Button className="rounded-xl btn-cta gap-2" onClick={(e) => handleDownloadPDF(e, selectedFatura)} disabled={isDownloading === selectedFatura.id}>
                    {isDownloading === selectedFatura.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Descarregar PDF
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <SendInvoiceDialog
        fatura={sendDialogFatura}
        open={!!sendDialogFatura}
        onOpenChange={(open) => !open && setSendDialogFatura(null)}
      />

      {/* Payment Link Dialog */}
      <CreatePaymentLinkDialog
        open={!!paymentLinkFatura}
        onOpenChange={(open) => !open && setPaymentLinkFatura(null)}
        defaultAmount={paymentLinkFatura ? Number(paymentLinkFatura.total) : 0}
        defaultDescription={paymentLinkFatura ? `Pagamento da ${paymentLinkFatura.numero}` : ''}
        faturaId={paymentLinkFatura?.id}
      />
    </MainLayout>
  );
}