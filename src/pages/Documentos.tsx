import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  FileText,
  Receipt,
  FileCheck,
  Download,
  Eye,
  FolderOpen,
} from 'lucide-react';

/* ─── Mock data ─── */
const mockDocuments = [
  { id: '1', tipo: 'Factura',        numero: 'FT/2026/000001', data: '2026-02-10', cliente: 'Tech Solutions',      valor: 150000, estado: 'Emitida' },
  { id: '2', tipo: 'Recibo',         numero: 'RC/2026/000001', data: '2026-02-09', cliente: 'Comercial Benguela',  valor: 85000,  estado: 'Pago' },
  { id: '3', tipo: 'Nota de Crédito',numero: 'NC/2026/000001', data: '2026-02-08', cliente: 'Logística Express',   valor: 25000,  estado: 'Emitida' },
  { id: '4', tipo: 'Proforma',       numero: 'PF/2026/000001', data: '2026-02-07', cliente: 'Tech Solutions',      valor: 200000, estado: 'Pendente' },
];

/* ─── Estado badge ─── */
const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case 'Pago':
      return <Badge className="bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 font-semibold">{estado}</Badge>;
    case 'Emitida':
      return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 font-semibold">{estado}</Badge>;
    case 'Pendente':
      return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 font-semibold">{estado}</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

/* ─── Tipo icon ─── */
const tipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'Factura':         return <FileText className="w-4 h-4 text-primary" />;
    case 'Recibo':          return <Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'Nota de Crédito': return <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:                return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
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
const DocTable = ({ docs }: { docs: typeof mockDocuments }) => {
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
                  <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="text-sm font-medium text-foreground">{doc.cliente}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-sm text-muted-foreground">{doc.data}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-bold text-foreground">
                {doc.valor.toLocaleString('pt-AO')} Kz
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
  const [search, setSearch] = useState('');

  const filtered = mockDocuments.filter(d =>
    d.numero.toLowerCase().includes(search.toLowerCase()) ||
    d.cliente.toLowerCase().includes(search.toLowerCase())
  );

  const facturas    = filtered.filter(d => d.tipo === 'Factura');
  const recibos     = filtered.filter(d => d.tipo === 'Recibo');
  const outros      = filtered.filter(d => d.tipo === 'Nota de Crédito' || d.tipo === 'Proforma');

  const totalFacturas    = mockDocuments.filter(d => d.tipo === 'Factura').length;
  const totalRecibos     = mockDocuments.filter(d => d.tipo === 'Recibo').length;
  const totalCredito     = mockDocuments.filter(d => d.tipo === 'Nota de Crédito').length;
  const totalProformas   = mockDocuments.filter(d => d.tipo === 'Proforma').length;

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
                <DocTable docs={filtered} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facturas" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={facturas} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recibos" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={recibos} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outros" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <DocTable docs={outros} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>
  );
}