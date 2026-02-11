import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Truck, Building2, Phone, Mail } from 'lucide-react';

const mockFornecedores = [
  { id: '1', nome: 'Tech Supplies Angola', nif: '5000111222', telefone: '+244 923 111 222', email: 'info@techsupplies.ao', endereco: 'Luanda, Talatona', tipo: 'Tecnologia' },
  { id: '2', nome: 'Papelaria Central', nif: '5000333444', telefone: '+244 923 333 444', email: 'vendas@papelaria.ao', endereco: 'Luanda, Maianga', tipo: 'Material de Escritório' },
  { id: '3', nome: 'Logística Express', nif: '5000555666', telefone: '+244 923 555 666', email: 'ops@logistica.ao', endereco: 'Luanda, Viana', tipo: 'Transporte' },
];

export default function Fornecedores() {
  const [search, setSearch] = useState('');

  const filtered = mockFornecedores.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.nif.includes(search)
  );

  return (
    <MainLayout title="Fornecedores" description="Gerir fornecedores da empresa">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar fornecedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockFornecedores.length}</p>
                <p className="text-sm text-muted-foreground">Total Fornecedores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">NIF</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{f.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{f.nif}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{f.nif}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{f.telefone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{f.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary">{f.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
