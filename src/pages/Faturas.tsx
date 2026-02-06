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
import { mockFaturas } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/format';
import { Fatura, EstadoFatura, TipoDocumento } from '@/types';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const estadoStyles: Record<EstadoFatura, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  emitida: { label: 'Emitida', className: 'bg-primary/10 text-primary' },
  paga: { label: 'Paga', className: 'bg-success/10 text-success' },
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
  const [faturas] = useState<Fatura[]>(mockFaturas);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesSearch = 
      fatura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cliente.nif.includes(searchTerm);
    
    const matchesEstado = estadoFilter === 'all' || fatura.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'all' || fatura.tipo === tipoFilter;

    return matchesSearch && matchesEstado && matchesTipo;
  });

  const totalFaturado = filteredFaturas.reduce((acc, f) => acc + f.total, 0);
  const totalIva = filteredFaturas.reduce((acc, f) => acc + f.totalIva, 0);

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
                {filteredFaturas.map((fatura) => {
                  const estado = estadoStyles[fatura.estado];
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
                              {tipoDocLabels[fatura.tipo]}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {fatura.cliente.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NIF: {fatura.cliente.nif}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(fatura.dataEmissao)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={cn(
                          fatura.estado === 'vencida' && 'text-destructive font-medium'
                        )}>
                          {formatDate(fatura.dataVencimento)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold">{formatCurrency(fatura.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          IVA: {formatCurrency(fatura.totalIva)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn('text-xs', estado.className)}>
                          {estado.label}
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
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
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
                              <DropdownMenuItem className="text-success">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Paga
                              </DropdownMenuItem>
                            )}
                            {(fatura.estado === 'emitida' || fatura.estado === 'vencida') && (
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="w-4 h-4 mr-2" />
                                Anular Fatura
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
        </CardContent>
      </Card>
    </MainLayout>
  );
}
