import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Truck, Building2, Phone, Mail, Pencil, Trash2, Loader2, PackageCheck, Filter, X } from 'lucide-react';
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor, type Fornecedor, type FornecedorInput } from '@/hooks/useFornecedores';
import { Skeleton } from '@/components/ui/skeleton';

const TIPOS_FORNECEDOR = ['Tecnologia', 'Material de Escritório', 'Transporte', 'Alimentação', 'Serviços', 'Outros'];

const TIPO_COLORS: Record<string, string> = {
  'Tecnologia': 'bg-blue-100 text-blue-700 border-blue-200',
  'Material de Escritório': 'bg-amber-100 text-amber-700 border-amber-200',
  'Transporte': 'bg-violet-100 text-violet-700 border-violet-200',
  'Alimentação': 'bg-green-100 text-green-700 border-green-200',
  'Serviços': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Outros': 'bg-slate-100 text-slate-600 border-slate-200',
};

const TIPO_DOT: Record<string, string> = {
  'Tecnologia': 'bg-blue-500',
  'Material de Escritório': 'bg-amber-500',
  'Transporte': 'bg-violet-500',
  'Alimentação': 'bg-green-500',
  'Serviços': 'bg-cyan-500',
  'Outros': 'bg-slate-400',
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

const emptyForm: FornecedorInput = { nome: '', nif: '', endereco: '', telefone: '', email: '', tipo: 'Outros' };

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FornecedorInput>(emptyForm);

  const { data: fornecedores, isLoading } = useFornecedores();
  const createMutation = useCreateFornecedor();
  const updateMutation = useUpdateFornecedor();
  const deleteMutation = useDeleteFornecedor();

  const filtered = (fornecedores ?? []).filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || f.nif.includes(search);
    const matchTipo = filterTipo ? f.tipo === filterTipo : true;
    return matchSearch && matchTipo;
  });

  const tipos = [...new Set((fornecedores ?? []).map(f => f.tipo))];

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (f: Fornecedor) => {
    setEditingId(f.id);
    setForm({ nome: f.nome, nif: f.nif, endereco: f.endereco, telefone: f.telefone || '', email: f.email || '', tipo: f.tipo });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.nif || !form.endereco) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout title="Fornecedores" description="Gerir fornecedores da empresa">
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fornecedores</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie todos os fornecedores da empresa</p>
          </div>
          <Button
            onClick={openNew}
            className="gap-2 self-start sm:self-auto rounded-xl h-10 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 shrink-0">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold leading-none">{fornecedores?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Fornecedores</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-violet-500/10 pointer-events-none" />
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-violet-500/10 shrink-0">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-3xl font-bold leading-none">{tipos.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Categorias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 pointer-events-none" />
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 shrink-0">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold leading-none">{fornecedores?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Activos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Pesquisar por nome ou NIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <button
              onClick={() => setFilterTipo('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterTipo === '' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'}`}
            >
              Todos
            </button>
            {TIPOS_FORNECEDOR.filter(t => tipos.includes(t)).map(t => (
              <button
                key={t}
                onClick={() => setFilterTipo(prev => prev === t ? '' : t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterTipo === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Lista de Fornecedores</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
                    <Skeleton className="h-8 w-20 hidden md:block" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="p-4 rounded-2xl bg-muted mb-4">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">
                  {search || filterTipo ? 'Nenhum fornecedor encontrado' : 'Sem fornecedores ainda'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {search || filterTipo ? 'Tente ajustar os filtros de pesquisa.' : 'Comece por adicionar o seu primeiro fornecedor.'}
                </p>
                {!search && !filterTipo && (
                  <Button onClick={openNew} className="mt-4 gap-2 rounded-xl" variant="outline">
                    <Plus className="w-4 h-4" /> Adicionar Fornecedor
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="pl-6 w-64">Fornecedor</TableHead>
                        <TableHead>NIF</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right pr-6">Acções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((f) => (
                        <TableRow key={f.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(f.nome)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                                {getInitials(f.nome)}
                              </div>
                              <div>
                                <p className="font-medium text-sm leading-none">{f.nome}</p>
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">{f.endereco}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono text-muted-foreground">{f.nif}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                              {f.telefone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {f.telefone}
                                </span>
                              )}
                              {f.email && (
                                <span className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {f.email}
                                </span>
                              )}
                              {!f.telefone && !f.email && <span className="text-xs italic">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${TIPO_COLORS[f.tipo] || TIPO_COLORS['Outros']}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${TIPO_DOT[f.tipo] || TIPO_DOT['Outros']}`} />
                              {f.tipo}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(f)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(f.id)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {filtered.map((f) => (
                    <div key={f.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(f.nome)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                            {getInitials(f.nome)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{f.nome}</p>
                            <p className="text-xs text-muted-foreground font-mono">{f.nif}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(f)}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(f.id)}
                            className="h-8 w-8 p-0 rounded-lg text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${TIPO_COLORS[f.tipo] || TIPO_COLORS['Outros']}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${TIPO_DOT[f.tipo] || TIPO_DOT['Outros']}`} />
                          {f.tipo}
                        </span>
                        {f.telefone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />{f.telefone}
                          </span>
                        )}
                        {f.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]">
                            <Mail className="w-3 h-3 shrink-0" />{f.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">
              {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados do fornecedor abaixo.' : 'Preencha os dados para criar um novo fornecedor.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome *</Label>
              <Input
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do fornecedor"
                className="rounded-xl h-10"
              />
            </div>

            {/* NIF + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NIF *</Label>
                <Input
                  value={form.nif}
                  onChange={e => setForm(p => ({ ...p, nif: e.target.value }))}
                  placeholder="5000000000"
                  className="rounded-xl h-10 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_FORNECEDOR.map(t => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${TIPO_DOT[t] || 'bg-slate-400'}`} />
                          {t}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço *</Label>
              <Input
                value={form.endereco}
                onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                placeholder="Morada completa"
                className="rounded-xl h-10"
              />
            </div>

            {/* Telefone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={form.telefone}
                    onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="+244 923 000 000"
                    className="rounded-xl h-10 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplo.ao"
                    type="email"
                    className="rounded-xl h-10 pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.nome || !form.nif || !form.endereco}
              className="gap-2 rounded-xl min-w-[100px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto p-3 rounded-2xl bg-destructive/10 w-fit mb-2">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Eliminar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Esta acção é permanente e não pode ser desfeita. Todos os dados deste fornecedor serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}