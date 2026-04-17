import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Truck, Building2, Phone, Mail, Pencil, Trash2,
  Loader2, PackageCheck, Filter, X, Download, Copy, CheckCheck,
  Hash, MapPin, BadgeCheck,
} from 'lucide-react';
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor, type Fornecedor, type FornecedorInput } from '@/hooks/useFornecedores';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/lib/csv-export';
import { toast } from 'sonner';

const TIPOS_FORNECEDOR = ['Tecnologia', 'Material de Escritório', 'Transporte', 'Alimentação', 'Serviços', 'Outros'];

const TIPO_COLORS: Record<string, string> = {
  'Tecnologia': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Material de Escritório': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Transporte': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Alimentação': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Serviços': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Outros': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const TIPO_DOT: Record<string, string> = {
  'Tecnologia': 'bg-sky-400',
  'Material de Escritório': 'bg-amber-400',
  'Transporte': 'bg-violet-400',
  'Alimentação': 'bg-emerald-400',
  'Serviços': 'bg-cyan-400',
  'Outros': 'bg-slate-400',
};

/** Gera ID único fk-244-XXXXXX */
function generateFkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `fk-244-${part}`;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'from-sky-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-[#F5C200] to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function getGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface FornecedorInputExtended extends FornecedorInput {
  fk_id?: string;
}

const emptyForm: FornecedorInputExtended = {
  nome: '',
  nif: '',
  endereco: '',
  telefone: '',
  email: '',
  tipo: 'Outros',
  fk_id: '',
};

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FornecedorInputExtended>(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: fornecedores, isLoading } = useFornecedores();
  const createMutation = useCreateFornecedor();
  const updateMutation = useUpdateFornecedor();
  const deleteMutation = useDeleteFornecedor();

  const filtered = (fornecedores ?? []).filter(f => {
    const q = search.toLowerCase();
    const matchSearch =
      f.nome.toLowerCase().includes(q) ||
      f.nif.includes(q) ||
      // suporte a pesquisa por fk_id
      ((f as any).fk_id || '').toLowerCase().includes(q);
    const matchTipo = filterTipo ? f.tipo === filterTipo : true;
    return matchSearch && matchTipo;
  });

  const tipos = [...new Set((fornecedores ?? []).map(f => f.tipo))];

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, fk_id: generateFkId() });
    setDialogOpen(true);
  };

  const openEdit = (f: Fornecedor) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      nif: f.nif,
      endereco: f.endereco,
      telefone: f.telefone || '',
      email: f.email || '',
      tipo: f.tipo,
      fk_id: (f as any).fk_id || generateFkId(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.nif || !form.endereco) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
      toast.success('Fornecedor actualizado');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('Fornecedor criado com sucesso');
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Fornecedor eliminado');
      setDeleteId(null);
    }
  };

  const copyFkId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ID copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const stats = {
    total: fornecedores?.length ?? 0,
    categorias: tipos.length,
    ativos: fornecedores?.length ?? 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#F5C200] flex items-center justify-center shadow-lg shadow-[#F5C200]/30">
            <Truck className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">FORNECEDORES</h1>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mt-0.5">Gestão de Fornecedores</p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#F5C200]/40 via-[#F5C200]/10 to-transparent" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToCSV(
                  (fornecedores ?? []).map(f => ({
                    fk_id: (f as any).fk_id || '',
                    nome: f.nome,
                    nif: f.nif,
                    tipo: f.tipo,
                    email: f.email || '',
                    telefone: f.telefone || '',
                    endereco: f.endereco,
                  })),
                  [
                    { key: 'fk_id', label: 'FK ID' },
                    { key: 'nome', label: 'Nome' },
                    { key: 'nif', label: 'NIF' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'email', label: 'Email' },
                    { key: 'telefone', label: 'Telefone' },
                    { key: 'endereco', label: 'Endereço' },
                  ],
                  'fornecedores'
                );
                toast.success('CSV exportado!');
              }}
              className="h-9 rounded-xl gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </Button>
            <Button
              onClick={openNew}
              className="gap-2 bg-[#F5C200] hover:bg-[#e6b800] text-black font-bold border-0 shadow-lg shadow-[#F5C200]/25 rounded-xl h-9 px-4"
            >
              <Plus className="w-4 h-4" />
              Novo Fornecedor
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Fornecedores', value: stats.total, icon: <Truck className="w-5 h-5" />, accent: true },
            { label: 'Categorias Activas', value: stats.categorias, icon: <Building2 className="w-5 h-5" />, accent: false },
            { label: 'Fornecedores Activos', value: stats.ativos, icon: <PackageCheck className="w-5 h-5" />, accent: false },
          ].map(stat => (
            <div
              key={stat.label}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                stat.accent
                  ? 'bg-[#F5C200] border-[#F5C200] text-black shadow-lg shadow-[#F5C200]/20'
                  : 'bg-card border-border/50 hover:border-[#F5C200]/30'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${stat.accent ? 'bg-black/10' : 'bg-[#F5C200]/10 text-[#F5C200]'}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-3xl font-black leading-none">{stat.value}</p>
                <p className={`text-xs mt-1 font-medium ${stat.accent ? 'text-black/60' : 'text-muted-foreground'}`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Nome, NIF ou ID fk-244-..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10 border-border/60 focus:border-[#F5C200] focus:ring-[#F5C200]/20 bg-card"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold shrink-0">
              <Filter className="w-3 h-3" /> Filtrar:
            </span>
            <button
              onClick={() => setFilterTipo('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterTipo === '' ? 'bg-[#F5C200] text-black border-[#F5C200]' : 'bg-card border-border/60 hover:border-[#F5C200]/50 text-muted-foreground'}`}
            >
              Todos
            </button>
            {TIPOS_FORNECEDOR.filter(t => tipos.includes(t)).map(t => (
              <button
                key={t}
                onClick={() => setFilterTipo(prev => prev === t ? '' : t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterTipo === t ? 'bg-[#F5C200] text-black border-[#F5C200]' : 'bg-card border-border/60 hover:border-[#F5C200]/50 text-muted-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table / Cards ── */}
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-[#F5C200]" />
              <h2 className="text-sm font-black uppercase tracking-widest">Lista de Fornecedores</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {filtered.length} {filtered.length === 1 ? 'registo' : 'registos'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-xl hidden sm:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F5C200]/10 border border-[#F5C200]/20 flex items-center justify-center mb-4">
                <Truck className="w-7 h-7 text-[#F5C200]/60" />
              </div>
              <p className="font-black text-sm uppercase tracking-wider">
                {search || filterTipo ? 'Nenhum fornecedor encontrado' : 'Sem fornecedores ainda'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {search || filterTipo ? 'Ajuste os filtros de pesquisa.' : 'Comece por adicionar o primeiro fornecedor.'}
              </p>
              {!search && !filterTipo && (
                <Button onClick={openNew} className="mt-4 gap-2 rounded-xl bg-[#F5C200] text-black font-bold hover:bg-[#e6b800] border-0">
                  <Plus className="w-4 h-4" /> Adicionar Fornecedor
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-5 py-3 uppercase tracking-widest">Fornecedor</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">FK ID</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">NIF</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">Contacto</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">Categoria</th>
                      <th className="w-24 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((f) => {
                      const fkId = (f as any).fk_id;
                      return (
                        <tr key={f.id} className="group hover:bg-[#F5C200]/3 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(f.nome)} flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md`}>
                                {getInitials(f.nome)}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none">{f.nome}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[160px] flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />{f.endereco}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {fkId ? (
                              <button
                                onClick={() => copyFkId(fkId)}
                                className="group/id flex items-center gap-1.5 font-mono text-[11px] text-[#F5C200] bg-[#F5C200]/10 border border-[#F5C200]/20 px-2.5 py-1 rounded-lg hover:bg-[#F5C200]/20 transition-colors"
                                title="Copiar ID"
                              >
                                {copiedId === fkId ? <CheckCheck className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                                {fkId}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-mono text-muted-foreground">{f.nif}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              {f.telefone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 shrink-0" />{f.telefone}
                                </span>
                              )}
                              {f.email && (
                                <span className="flex items-center gap-1.5 truncate max-w-[160px]">
                                  <Mail className="w-3 h-3 shrink-0" />{f.email}
                                </span>
                              )}
                              {!f.telefone && !f.email && <span className="italic opacity-40">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${TIPO_COLORS[f.tipo] || TIPO_COLORS['Outros']}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${TIPO_DOT[f.tipo] || TIPO_DOT['Outros']}`} />
                              {f.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(f)}
                                className="w-8 h-8 rounded-xl hover:bg-[#F5C200]/10 flex items-center justify-center text-muted-foreground hover:text-[#F5C200] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(f.id)}
                                className="w-8 h-8 rounded-xl hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border/30">
                {filtered.map((f) => {
                  const fkId = (f as any).fk_id;
                  return (
                    <div key={f.id} className="p-4 hover:bg-[#F5C200]/3 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getGradient(f.nome)} flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md`}>
                            {getInitials(f.nome)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate">{f.nome}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{f.nif}</p>
                            {fkId && (
                              <button
                                onClick={() => copyFkId(fkId)}
                                className="flex items-center gap-1 font-mono text-[10px] text-[#F5C200] mt-0.5"
                              >
                                <Hash className="w-2.5 h-2.5" />{fkId}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(f)}
                            className="w-8 h-8 rounded-xl hover:bg-[#F5C200]/10 flex items-center justify-center text-muted-foreground hover:text-[#F5C200]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(f.id)}
                            className="w-8 h-8 rounded-xl hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${TIPO_COLORS[f.tipo] || TIPO_COLORS['Outros']}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${TIPO_DOT[f.tipo] || TIPO_DOT['Outros']}`} />
                          {f.tipo}
                        </span>
                        {f.telefone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />{f.telefone}
                          </span>
                        )}
                        {f.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[180px]">
                            <Mail className="w-3 h-3 shrink-0" />{f.email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5C200] flex items-center justify-center shadow-lg shadow-[#F5C200]/30">
                {editingId ? <Pencil className="w-5 h-5 text-black" /> : <Plus className="w-5 h-5 text-black" />}
              </div>
              <div>
                <DialogTitle className="text-base font-black">
                  {editingId ? 'EDITAR FORNECEDOR' : 'NOVO FORNECEDOR'}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-mono tracking-widest mt-0.5">
                  {editingId ? 'Actualizar dados do fornecedor' : 'Preencha os campos obrigatórios'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* FK ID — só leitura, gerado automaticamente */}
            <div className="p-3 rounded-xl bg-[#F5C200]/5 border border-[#F5C200]/20 flex items-center gap-3">
              <BadgeCheck className="w-4 h-4 text-[#F5C200] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID do Fornecedor</p>
                <p className="text-sm font-mono font-bold text-[#F5C200] mt-0.5">{form.fk_id || '—'}</p>
              </div>
              {form.fk_id && (
                <button
                  onClick={() => { navigator.clipboard.writeText(form.fk_id!); toast.success('ID copiado!'); }}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5C200]/20 flex items-center justify-center text-[#F5C200] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dados Principais</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Nome <span className="text-[#F5C200]">*</span></Label>
              <Input
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do fornecedor"
                className="rounded-xl h-10 border-border/60 focus:border-[#F5C200]"
              />
            </div>

            {/* NIF + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">NIF <span className="text-[#F5C200]">*</span></Label>
                <Input
                  value={form.nif}
                  onChange={e => setForm(p => ({ ...p, nif: e.target.value }))}
                  placeholder="5000000000"
                  className="rounded-xl h-10 font-mono border-border/60 focus:border-[#F5C200]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Categoria</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="rounded-xl h-10 border-border/60">
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
              <Label className="text-xs font-semibold text-muted-foreground">Endereço <span className="text-[#F5C200]">*</span></Label>
              <Input
                value={form.endereco}
                onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                placeholder="Morada completa"
                className="rounded-xl h-10 border-border/60 focus:border-[#F5C200]"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contacto</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {/* Telefone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={form.telefone}
                    onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="+244 923 000 000"
                    className="rounded-xl h-10 pl-9 border-border/60 focus:border-[#F5C200]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplo.ao"
                    type="email"
                    className="rounded-xl h-10 pl-9 border-border/60 focus:border-[#F5C200]"
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
              className="gap-2 rounded-xl bg-[#F5C200] hover:bg-[#e6b800] text-black font-black border-0 shadow-md shadow-[#F5C200]/25 min-w-[100px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm border-border/60">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center font-black">Eliminar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Acção permanente e irreversível. Todos os dados serão removidos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 font-bold"
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