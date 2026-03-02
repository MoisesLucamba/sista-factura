import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Receipt, FileCheck, Download, Eye } from 'lucide-react';

const mockDocuments = [
  { id: '1', tipo: 'Factura', numero: 'FT/2026/000001', data: '2026-02-10', cliente: 'Tech Solutions', valor: 150000, estado: 'Emitida' },
  { id: '2', tipo: 'Recibo', numero: 'RC/2026/000001', data: '2026-02-09', cliente: 'Comercial Benguela', valor: 85000, estado: 'Pago' },
  { id: '3', tipo: 'Nota de Crédito', numero: 'NC/2026/000001', data: '2026-02-08', cliente: 'Logística Express', valor: 25000, estado: 'Emitida' },
  { id: '4', tipo: 'Proforma', numero: 'PF/2026/000001', data: '2026-02-07', cliente: 'Tech Solutions', valor: 200000, estado: 'Pendente' },
];

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'Pago': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{estado}</Badge>;
    case 'Emitida': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{estado}</Badge>;
    case 'Pendente': return <Badge variant="secondary">{estado}</Badge>;
    default: return <Badge variant="outline">{estado}</Badge>;
  }
};

export default function Documentos() {
  const [search, setSearch] = useState('');

  const filtered = mockDocuments.filter(d =>
    d.numero.toLowerCase().includes(search.toLowerCase()) ||
    d.cliente.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Documentos" description="Todos os documentos fiscais emitidos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center"><FileText className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Facturas</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Receipt className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Recibos</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><FileCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Notas de Crédito</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Proformas</p></CardContent></Card>
        </div>

        <Tabs defaultValue="todos">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
            <TabsTrigger value="recibos">Recibos</TabsTrigger>
            <TabsTrigger value="outros">Outros</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{doc.numero}</p>
                            <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{doc.cliente}</TableCell>
                        <TableCell className="hidden md:table-cell">{doc.data}</TableCell>
                        <TableCell className="font-medium">{doc.valor.toLocaleString('pt-AO')} Kz</TableCell>
                        <TableCell>{estadoBadge(doc.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="facturas"><Card><CardContent className="py-12 text-center text-muted-foreground">Filtro de facturas em breve</CardContent></Card></TabsContent>
          <TabsContent value="recibos"><Card><CardContent className="py-12 text-center text-muted-foreground">Filtro de recibos em breve</CardContent></Card></TabsContent>
          <TabsContent value="outros"><Card><CardContent className="py-12 text-center text-muted-foreground">Outros documentos em breve</CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
