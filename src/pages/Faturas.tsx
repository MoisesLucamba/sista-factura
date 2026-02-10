import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFaturas, useFatura, useUpdateFaturaEstado, type Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from '@/lib/format';
import { generateInvoicePDF, downloadInvoicePDF } from '@/lib/pdf-generator';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye,
  Download,
  Printer,
  FileText,
  XCircle,
  CheckCircle,
  Loader2,
  Send,
  TrendingUp,
  ArrowUpRight,
  Filter,
  X,
  AlertCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SendInvoiceDialog } from '@/components/faturas/SendInvoiceDialog';

type EstadoFatura = 'rascunho' | 'emitida' | 'paga' | 'anulada' | 'vencida';
type TipoDocumento = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito';

const estadoStyles: Record<EstadoFatura, { label: string; className: string; icon: any }> = {
  rascunho: { 
    label: 'Rascunho', 
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    icon: FileText,
  },
  emitida: { 
    label: 'Emitida', 
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    icon: Send,
  },
  paga: { 
    label: 'Paga', 
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
    icon: CheckCircle,
  },
  anulada: { 
    label: 'Anulada', 
    className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400',
    icon: XCircle,
  },
  vencida: { 
    label: 'Vencida', 
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
    icon: AlertCircle,
  },
};

const tipoDocLabels: Record<TipoDocumento, string> = {
  'fatura': 'Fatura',
  'fatura-recibo': 'Fatura-Recibo',
  'recibo': 'Recibo',
  'nota-credito': 'Nota de Crédito',
};

export default function Faturas() {
  const { data: faturas = [], isLoading } = useFaturas();
  const updateEstado = useUpdateFaturaEstado();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedFaturaId, setSelectedFaturaId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [sendDialogFatura, setSendDialogFatura] = useState<Fatura | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: selectedFatura } = useFatura(selectedFaturaId || '');

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesSearch = 
      fatura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cliente?.nif?.includes(searchTerm);
    
    const matchesEstado = estadoFilter === 'all' || fatura.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'all' || fatura.tipo === tipoFilter;

    return matchesSearch && matchesEstado && matchesTipo;
  });

  const totalFaturado = filteredFaturas.reduce((acc, f) => acc + Number(f.total), 0);
  const totalIva = filteredFaturas.reduce((acc, f) => acc + Number(f.total_iva), 0);
  const activeFilters = (estadoFilter !== 'all' ? 1 : 0) + (tipoFilter !== 'all' ? 1 : 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  const handleDownloadPDF = async (fatura: Fatura) => {
    setIsDownloading(fatura.id);
    try {
      const { data: fullFatura, error } = await import('@/integrations/supabase/client').then(
        async ({ supabase }) => {
          const { data: faturaData, error: faturaError } = await supabase
            .from('faturas')
            .select(`*, cliente:clientes(*)`)
            .eq('id', fatura.id)
            .single();

          if (faturaError) throw faturaError;

          const { data: itens, error: itensError } = await supabase
            .from('itens_fatura')
            .select(`*, produto:produtos(*)`)
            .eq('fatura_id', fatura.id);

          if (itensError) throw itensError;

          return { data: { ...faturaData, itens }, error: null };
        }
      );

      if (error) throw error;

      const blob = await generateInvoicePDF(fullFatura as Fatura);
      downloadInvoicePDF(blob, `${fatura.numero.replace(/\//g, '-')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleMarkAsPaid = async (faturaId: string) => {
    try {
      await updateEstado.mutateAsync({
        id: faturaId,
        estado: 'paga',
        data_pagamento: new Date().toISOString().split('T')[0],
      });
      toast.success('Fatura marcada como paga!');
    } catch (error) {
      toast.error('Erro ao marcar fatura como paga');
    }
  };

  const handleCancelInvoice = async (faturaId: string) => {
    try {
      await updateEstado.mutateAsync({
        id: faturaId,
        estado: 'anulada',
      });
      toast.success('Fatura anulada com sucesso!');
    } catch (error) {
      toast.error('Erro ao anular fatura');
    }
  };

  const clearFilters = () => {
    setEstadoFilter('all');
    setTipoFilter('all');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative w-8 h-8 animate-spin text-primary" />
          </div>
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
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Faturas
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Gestão e emissão de documentos fiscais
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {filteredFaturas.length} {filteredFaturas.length === 1 ? 'documento' : 'documentos'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Button 
            asChild 
            size="lg"
            className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <Link to="/faturas/nova">
              <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
              Nova Fatura
              <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-primary animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total Faturado</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatCurrency(totalFaturado)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-orange-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total IVA</p>
                <p className="text-2xl font-bold font-display text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalIva)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-blue-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Documentos</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {filteredFaturas.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Search and Filters */}
      <Card className="card-shadow mb-6 border-primary/10 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar por número, cliente ou NIF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 border-primary/20 focus:border-primary/40"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-11 transition-all border-primary/20",
                  showFilters && "bg-primary/5 border-primary/40",
                  activeFilters > 0 && "border-primary text-primary"
                )}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary text-white">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-primary/10 animate-fade-in">
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] border-primary/20">
                    <SelectValue placeholder="Tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="fatura">Fatura</SelectItem>
                    <SelectItem value="fatura-recibo">Fatura-Recibo</SelectItem>
                    <SelectItem value="recibo">Recibo</SelectItem>
                    <SelectItem value="nota-credito">Nota de Crédito</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] border-primary/20">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>

                {activeFilters > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Invoices Table */}
      <Card className="card-shadow animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documentos ({filteredFaturas.length})
            </CardTitle>
            {filteredFaturas.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {formatCurrency(totalFaturado)} total
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Documento</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">Data</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Vencimento</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                  <TableHead className="text-center font-semibold">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {searchTerm || activeFilters > 0 
                              ? 'Nenhuma fatura encontrada.' 
                              : 'Ainda não tem faturas.'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm || activeFilters > 0
                              ? 'Tente ajustar os filtros de pesquisa.'
                              : 'Comece criando a sua primeira fatura!'}
                          </p>
                        </div>
                        {!searchTerm && activeFilters === 0 && (
                          <Button asChild className="mt-2">
                            <Link to="/faturas/nova">
                              <Plus className="w-4 h-4 mr-2" />
                              Criar Fatura
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaturas.map((fatura, index) => {
                    const estado = estadoStyles[fatura.estado as EstadoFatura];
                    const EstadoIcon = estado.icon;
                    return (
                      <TableRow 
                        key={fatura.id} 
                        className="cursor-pointer hover:bg-muted/50 group transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold font-mono text-sm">{fatura.numero}</p>
                              <p className="text-xs text-muted-foreground">
                                {tipoDocLabels[fatura.tipo as TipoDocumento]}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {fatura.cliente?.nome || 'Cliente não encontrado'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="font-mono">NIF: {fatura.cliente?.nif || 'N/A'}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-sm">{formatDate(fatura.data_emissao)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={cn(
                            "text-sm flex items-center gap-2",
                            fatura.estado === 'vencida' && 'text-destructive font-semibold'
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(fatura.data_vencimento)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(Number(fatura.total))}</p>
                          <p className="text-xs text-muted-foreground">
                            IVA: {formatCurrency(Number(fatura.total_iva))}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              'text-xs font-medium border transition-all group-hover:scale-105',
                              estado?.className
                            )}
                          >
                            <EstadoIcon className="w-3 h-3 mr-1" />
                            {estado?.label || fatura.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => setSelectedFaturaId(fatura.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPDF(fatura)}
                                disabled={isDownloading === fatura.id}
                              >
                                {isDownloading === fatura.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                Descarregar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSendDialogFatura(fatura)}>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar ao Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {fatura.estado === 'emitida' && (
                                <DropdownMenuItem 
                                  className="text-green-600 focus:text-green-600 dark:text-green-400"
                                  onClick={() => handleMarkAsPaid(fatura.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Paga
                                </DropdownMenuItem>
                              )}
                              {(fatura.estado === 'emitida' || fatura.estado === 'vencida') && (
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleCancelInvoice(fatura.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Anular Fatura
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Invoice Detail Dialog */}
      <Dialog open={!!selectedFaturaId} onOpenChange={() => setSelectedFaturaId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              {selectedFatura?.numero}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Detalhes completos da fatura
              {selectedFatura && (
                <Badge className={estadoStyles[selectedFatura.estado as EstadoFatura]?.className}>
                  {estadoStyles[selectedFatura.estado as EstadoFatura]?.label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedFatura && (
            <div className="space-y-6">
              {/* Client and Date Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Cliente</span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedFatura.cliente?.nome}</p>
                    <p className="text-sm text-muted-foreground">NIF: {selectedFatura.cliente?.nif}</p>
                    {selectedFatura.cliente?.email && (
                      <p className="text-sm text-muted-foreground">{selectedFatura.cliente.email}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Datas</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Emissão:</span> 
                      <span className="ml-2 font-medium">{formatDate(selectedFatura.data_emissao)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Vencimento:</span> 
                      <span className="ml-2 font-medium">{formatDate(selectedFatura.data_vencimento)}</span>
                    </p>
                    {selectedFatura.data_pagamento && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Pagamento:</span> 
                        <span className="ml-2 font-medium text-green-600">{formatDate(selectedFatura.data_pagamento)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Items Table */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Itens da Fatura
                </h4>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Produto/Serviço</TableHead>
                        <TableHead className="text-right font-semibold">Qtd</TableHead>
                        <TableHead className="text-right font-semibold">Preço Unit.</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFatura.itens?.map((item, index) => (
                        <TableRow key={item.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <TableCell className="font-medium">{item.produto?.nome}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(item.preco_unitario))}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(item.total))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-full md:w-80 space-y-3 p-4 bg-muted/30 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(Number(selectedFatura.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (14%):</span>
                    <span className="font-medium text-orange-600">{formatCurrency(Number(selectedFatura.total_iva))}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg">Total:</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(Number(selectedFatura.total))}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedFaturaId(null)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(selectedFatura)}
                  className="gradient-primary"
                  disabled={isDownloading === selectedFatura.id}
                >
                  {isDownloading === selectedFatura.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Descarregar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        fatura={sendDialogFatura}
        open={!!sendDialogFatura}
        onOpenChange={(open) => !open && setSendDialogFatura(null)}
      />
    </MainLayout>
  );
}