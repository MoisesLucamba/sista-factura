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
  Mail,
  Printer,
  FileText,
  XCircle,
  CheckCircle,
  Loader2,
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

type EstadoFatura = 'rascunho' | 'emitida' | 'paga' | 'anulada' | 'vencida';
type TipoDocumento = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito';

const estadoStyles: Record<EstadoFatura, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  emitida: { label: 'Emitida', className: 'bg-primary/10 text-primary' },
  paga: { label: 'Paga', className: 'bg-accent text-accent-foreground' },
  anulada: { label: 'Anulada', className: 'bg-muted text-muted-foreground' },
  vencida: { label: 'Vencida', className: 'bg-destructive/10 text-destructive' },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  const handleDownloadPDF = async (fatura: Fatura) => {
    setIsDownloading(fatura.id);
    try {
      // Fetch full fatura with items
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
    await updateEstado.mutateAsync({
      id: faturaId,
      estado: 'paga',
      data_pagamento: new Date().toISOString().split('T')[0],
    });
  };

  const handleCancelInvoice = async (faturaId: string) => {
    await updateEstado.mutateAsync({
      id: faturaId,
      estado: 'anulada',
    });
  };

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            Faturas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão e emissão de documentos fiscais
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow">
          <Link to="/faturas/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Faturado</p>
            <p className="text-2xl font-bold font-display text-foreground">
              {formatCurrency(totalFaturado)}
            </p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total IVA</p>
            <p className="text-2xl font-bold font-display text-primary">
              {formatCurrency(totalIva)}
            </p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Documentos</p>
            <p className="text-2xl font-bold font-display text-foreground">
              {filteredFaturas.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-shadow mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por número, cliente ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">
            Documentos ({filteredFaturas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhuma fatura encontrada.' : 'Ainda não tem faturas. Crie a primeira!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaturas.map((fatura) => {
                    const estado = estadoStyles[fatura.estado as EstadoFatura];
                    return (
                      <TableRow key={fatura.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium font-mono text-sm">{fatura.numero}</p>
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
                            <p className="text-xs text-muted-foreground">
                              NIF: {fatura.cliente?.nif || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(fatura.data_emissao)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={cn(
                            fatura.estado === 'vencida' && 'text-destructive font-medium'
                          )}>
                            {formatDate(fatura.data_vencimento)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(fatura.total))}</p>
                          <p className="text-xs text-muted-foreground">
                            IVA: {formatCurrency(Number(fatura.total_iva))}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn('text-xs', estado?.className)}>
                            {estado?.label || fatura.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Enviar por Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {fatura.estado === 'emitida' && (
                                <DropdownMenuItem 
                                  className="text-primary"
                                  onClick={() => handleMarkAsPaid(fatura.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Paga
                                </DropdownMenuItem>
                              )}
                              {(fatura.estado === 'emitida' || fatura.estado === 'vencida') && (
                                <DropdownMenuItem 
                                  className="text-destructive"
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

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedFaturaId} onOpenChange={() => setSelectedFaturaId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedFatura?.numero}
            </DialogTitle>
            <DialogDescription>
              Detalhes da fatura
            </DialogDescription>
          </DialogHeader>
          {selectedFatura && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedFatura.cliente?.nome}</p>
                  <p className="text-sm text-muted-foreground">NIF: {selectedFatura.cliente?.nif}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datas</p>
                  <p className="text-sm">Emissão: {formatDate(selectedFatura.data_emissao)}</p>
                  <p className="text-sm">Vencimento: {formatDate(selectedFatura.data_vencimento)}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFatura.itens?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.produto?.nome}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.preco_unitario))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Subtotal: {formatCurrency(Number(selectedFatura.subtotal))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    IVA: {formatCurrency(Number(selectedFatura.total_iva))}
                  </p>
                  <p className="text-lg font-bold">
                    Total: {formatCurrency(Number(selectedFatura.total))}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedFaturaId(null)}>
                  Fechar
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedFatura)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descarregar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
