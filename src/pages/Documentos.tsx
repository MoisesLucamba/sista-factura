import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Search, FileText, Receipt, FileCheck, Download, Eye, FolderOpen, Loader2, Activity,
} from 'lucide-react';
import { useFaturas, type Fatura } from '@/hooks/useFaturas';
import { formatCurrency, formatDate } from '@/lib/format';
import { Pagination, usePagination } from '@/components/shared/Pagination';
import { exportToCSV } from '@/lib/csv-export';
import { toast } from 'sonner';

/* ─── Estado badge ─── */
const EstadoBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    paga: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    emitida: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    rascunho: 'bg-muted text-muted-foreground border border-muted-foreground/20',
    vencida: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    anulada: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800',
  };
  const labels: Record<string, string> = {
    paga: 'Pago', emitida: 'Emitida', rascunho: 'Rascunho', vencida: 'Vencida', anulada: 'Anulada',
  };
  return <Badge className={`${map[estado] || ''} font-semibold`}>{labels[estado] || estado}</Badge>;
};

/* ─── Tipo icon ─── */
const tipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'fatura':
    case 'fatura-recibo': return <FileText className="w-4 h-4 text-primary" />;
    case 'recibo':        return <Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'nota-credito':  return <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:              return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

const tipoLabels: Record<string, string> = {
  'fatura': 'Factura',
  'fatura-recibo': 'Factura-Recibo',
  'recibo': 'Recibo',
  'nota-credito': 'Nota de Crédito',
  'proforma': 'Proforma',
};

/* ─── KPI card ─── */
const KpiCard = ({
  icon, count, label, colorClass, bgClass, borderClass,
}: {
  icon: React.ReactNode; count: number; label: string;
  colorClass: string; bgClass: string; borderClass: string;
}) => (
  <Card className={`border-l-4 ${borderClass} hover:shadow-md transition-shadow duration-200`}>
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-foreground leading-none">{count}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ─── Document table ─── */
const DocTable = ({ docs }: { docs: Fatura[] }) => {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <FolderOpen className="w-10 h-10 opacity-30" />
        <p className="text-sm">Nenhum documento encontrado</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Documento</TableHead>
          <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
          <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data</TableHead>
          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Valor</TableHead>
          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Estado</TableHead>
          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Acções</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc) => (
          <TableRow key={doc.id} className="hover:bg-muted/40 transition-colors group">
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {tipoIcon(doc.tipo)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{doc.numero}</p>
                  <p className="text-xs text-muted-foreground">{tipoLabels[doc.tipo] || doc.tipo}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="text-sm font-medium text-foreground">{doc.cliente?.nome || '—'}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-sm text-muted-foreground">{formatDate(doc.data_emissao)}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(Number(doc.total))}
              </span>
            </TableCell>
            <TableCell>
              <EstadoBadge estado={doc.estado} />
            </TableCell>
            <TableCell>
              <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

/* ══════════════════ MAIN PAGE ══════════════════ */
export default function Documentos() {
  const { data: faturas = [], isLoading } = useFaturas();
  const [search, setSearch] = useState('');

  const filtered = faturas.filter(d =>
    d.numero.toLowerCase().includes(search.toLowerCase()) ||
    d.cliente?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const facturas = filtered.filter(d => d.tipo === 'fatura' || d.tipo === 'fatura-recibo');
  const recibos  = filtered.filter(d => d.tipo === 'recibo');
  const outros   = filtered.filter(d => d.tipo === 'nota-credito' || d.tipo === 'proforma');

  const totalFacturas  = faturas.filter(d => d.tipo === 'fatura' || d.tipo === 'fatura-recibo').length;
  const totalRecibos   = faturas.filter(d => d.tipo === 'recibo').length;
  const totalCredito   = faturas.filter(d => d.tipo === 'nota-credito').length;
  const totalProformas = faturas.filter(d => d.tipo === 'proforma').length;

  // Pagination for each tab
  const allPagination = usePagination(filtered);
  const facturasPagination = usePagination(facturas);
  const recibosPagination = usePagination(recibos);
  const outrosPagination = usePagination(outros);

  if (isLoading) {
    return (
      <MainLayout title="Documentos" description="Todos os documentos fiscais emitidos">
        <div className="flex flex-col items-center justify-center h-72 gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-sm font-semibold">A carregar documentos…</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documentos" description="Todos os documentos fiscais emitidos">
      <div className="space-y-6">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0">
              <FolderOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Documentos</h1>
              <p className="text-sm text-muted-foreground">Todos os documentos fiscais emitidos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToCSV(
                  filtered.map(f => ({
                    numero: f.numero,
                    tipo: tipoLabels[f.tipo] || f.tipo,
                    cliente: f.cliente?.nome || '',
                    data: f.data_emissao,
                    valor: Number(f.total),
                    iva: Number(f.total_iva),
                    estado: f.estado,
                  })),
                  [
                    { key: 'numero', label: 'Número' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'cliente', label: 'Cliente' },
                    { key: 'data', label: 'Data' },
                    { key: 'valor', label: 'Valor' },
                    { key: 'iva', label: 'IVA' },
                    { key: 'estado', label: 'Estado' },
                  ],
                  'documentos'
                );
                toast.success('CSV exportado!');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar por número ou cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>

        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={<FileText className="w-5 h-5" />}
            count={totalFacturas}
            label="Facturas"
            colorClass="text-primary"
            bgClass="bg-primary/10"
            borderClass="border-l-primary"
          />
          <KpiCard
            icon={<Receipt className="w-5 h-5" />}
            count={totalRecibos}
            label="Recibos"
            colorClass="text-green-600 dark:text-green-400"
            bgClass="bg-green-100 dark:bg-green-950"
            borderClass="border-l-green-500"
          />
          <KpiCard
            icon={<FileCheck className="w-5 h-5" />}
            count={totalCredito}
            label="Notas de Crédito"
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-100 dark:bg-amber-950"
            borderClass="border-l-amber-500"
          />
          <KpiCard
            icon={<FileText className="w-5 h-5" />}
            count={totalProformas}
            label="Proformas"
            colorClass="text-muted-foreground"
            bgClass="bg-muted"
            borderClass="border-l-muted-foreground/40"
          />
        </div>

        {/* ─── TABS + TABLE ─── */}
        <Tabs defaultValue="todos">
          <TabsList className="h-10">
            <TabsTrigger value="todos" className="text-sm">
              Todos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{filtered.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="facturas" className="text-sm">
              Facturas
              {facturas.length > 0 && <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{facturas.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="recibos" className="text-sm">
              Recibos
              {recibos.length > 0 && <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{recibos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="outros" className="text-sm">
              Outros
              {outros.length > 0 && <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">{outros.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={allPagination.paginatedItems} />
                <Pagination currentPage={allPagination.currentPage} totalItems={allPagination.totalItems} itemsPerPage={allPagination.itemsPerPage} onPageChange={allPagination.setCurrentPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facturas" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={facturasPagination.paginatedItems} />
                <Pagination currentPage={facturasPagination.currentPage} totalItems={facturasPagination.totalItems} itemsPerPage={facturasPagination.itemsPerPage} onPageChange={facturasPagination.setCurrentPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recibos" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={recibosPagination.paginatedItems} />
                <Pagination currentPage={recibosPagination.currentPage} totalItems={recibosPagination.totalItems} itemsPerPage={recibosPagination.itemsPerPage} onPageChange={recibosPagination.setCurrentPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outros" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={outrosPagination.paginatedItems} />
                <Pagination currentPage={outrosPagination.currentPage} totalItems={outrosPagination.totalItems} itemsPerPage={outrosPagination.itemsPerPage} onPageChange={outrosPagination.setCurrentPage} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
}
