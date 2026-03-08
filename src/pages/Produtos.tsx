import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto,
  type Produto, type ProdutoInput,
} from '@/hooks/useProdutos';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  Plus, Search, MoreVertical, Edit, Trash2, Package, Wrench,
  AlertTriangle, Loader2, Box, DollarSign, Hash, X, AlertCircle,
  TrendingDown, ShieldCheck, Leaf, Stethoscope, Zap, Download,
} from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL DE IVA — Angola
// Para alterar taxas: edite apenas este objeto.
// ═══════════════════════════════════════════════════════════════
type CategoriaIva = 'geral' | 'alimentar' | 'medicamento';

const IVA_CONFIG: Record<CategoriaIva, {
  label: string;
  taxa: number;         // 0–1
  isento: boolean;
  descricao: string;
  exemplos: string[];
  icon: React.ReactNode;
  gradient: string;
  pill: string;
  dot: string;
}> = {
  geral: {
    label: 'Geral',
    taxa: 0.14,
    isento: false,
    descricao: 'Taxa normal — produtos e serviços gerais',
    exemplos: ['Eletrónica', 'Vestuário', 'Consultoria', 'Software', 'Mobiliário'],
    icon: <ShieldCheck className="w-4 h-4" />,
    gradient: 'from-blue-500 to-indigo-600',
    pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  alimentar: {
    label: 'Alimentar',
    taxa: 0.05,
    isento: false,
    descricao: 'Taxa reduzida — bens alimentares de amplo consumo',
    exemplos: ['Carnes', 'Peixes', 'Leite', 'Ovos', 'Frutas', 'Hortícolas', 'Farinha', 'Açúcar', 'Óleo', 'Água', 'Sal'],
    icon: <Leaf className="w-4 h-4" />,
    gradient: 'from-emerald-500 to-green-600',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  medicamento: {
    label: 'Medicamentos',
    taxa: 0,
    isento: true,
    descricao: 'Isento — medicamentos, vacinas e equipamentos hospitalares',
    exemplos: ['Medicamentos', 'Vacinas', 'Equipamentos hospitalares', 'Dispositivos médicos'],
    icon: <Stethoscope className="w-4 h-4" />,
    gradient: 'from-rose-500 to-red-600',
    pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

function getTaxa(cat: CategoriaIva) { return IVA_CONFIG[cat]?.taxa ?? 0.14; }
function getTaxaLabel(cat: CategoriaIva) {
  const c = IVA_CONFIG[cat];
  return c.isento ? 'Isento' : `${(c.taxa * 100).toFixed(0)}%`;
}

function calcPreview(preco: number, taxa: number, ivaIncluso: boolean) {
  if (!preco) return null;
  const base  = ivaIncluso ? preco / (1 + taxa) : preco;
  const iva   = base * taxa;
  const total = base + iva;
  return { base, iva, total };
}

const FORM_INIT = {
  codigo: '', nome: '', descricao: '',
  tipo: 'produto' as 'produto' | 'servico',
  preco_unitario: '', unidade: 'unidade',
  iva_incluido: false, categoria_iva: 'geral' as CategoriaIva,
  stock: '', stock_minimo: '',
};

// ═══════════════════════════════════════════════════════════════
export default function Produtos() {
  const { data: produtos = [], isLoading } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const [search, setSearch]         = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Produto | null>(null);
  const [delDialog, setDelDialog]   = useState(false);
  const [toDelete, setToDelete]     = useState<Produto | null>(null);
  const [form, setForm]             = useState(FORM_INIT);

  const taxa      = getTaxa(form.categoria_iva);
  const taxaLabel = getTaxaLabel(form.categoria_iva);
  const catCfg    = IVA_CONFIG[form.categoria_iva];
  const preview   = calcPreview(parseFloat(form.preco_unitario) || 0, taxa, form.iva_incluido);

  const filtered = useMemo(() => produtos.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = p.nome.toLowerCase().includes(s) ||
      p.codigo.toLowerCase().includes(s) ||
      p.descricao?.toLowerCase().includes(s);
    return matchSearch && (tipoFilter === 'all' || p.tipo === tipoFilter);
  }), [produtos, search, tipoFilter]);

  const produtosCount = produtos.filter(p => p.tipo === 'produto').length;
  const servicosCount = produtos.filter(p => p.tipo === 'servico').length;
  const lowStock      = produtos.filter(p =>
    p.tipo === 'produto' && p.stock !== undefined &&
    p.stock_minimo !== undefined && p.stock <= p.stock_minimo
  );

  const resetForm = () => setForm(FORM_INIT);

  const handleEdit = (p: Produto) => {
    setEditing(p);
    setForm({
      codigo: p.codigo, nome: p.nome, descricao: p.descricao || '',
      tipo: p.tipo, preco_unitario: p.preco_unitario.toString(),
      unidade: p.unidade, iva_incluido: p.iva_incluido,
      categoria_iva: ((p as any).categoria_iva as CategoriaIva) ?? 'geral',
      stock: p.stock?.toString() || '', stock_minimo: p.stock_minimo?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProdutoInput = {
      codigo: form.codigo, nome: form.nome,
      descricao: form.descricao || undefined, tipo: form.tipo,
      preco_unitario: parseFloat(form.preco_unitario) || 0,
      unidade: form.unidade, iva_incluido: form.iva_incluido,
      taxa_iva: taxa * 100,
      stock: form.tipo === 'produto' ? parseInt(form.stock) || undefined : undefined,
      stock_minimo: form.tipo === 'produto' ? parseInt(form.stock_minimo) || undefined : undefined,
    };
    try {
      if (editing) {
        await updateProduto.mutateAsync({ id: editing.id, ...payload });
        toast.success('Item atualizado com sucesso!');
      } else {
        await createProduto.mutateAsync(payload);
        toast.success('Item criado com sucesso!');
      }
      setDialogOpen(false); setEditing(null); resetForm();
    } catch { toast.error('Erro ao salvar. Tente novamente.'); }
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try {
      await deleteProduto.mutateAsync(toDelete.id);
      toast.success('Item eliminado.');
      setDelDialog(false); setToDelete(null);
    } catch { toast.error('Erro ao eliminar.'); }
  };

  if (isLoading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">A carregar catálogo…</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/30 blur-3xl opacity-40" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl opacity-30" />
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/10">
              <Box className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Produtos & Serviços
              </h1>
              <p className="text-slate-400 mt-1 text-sm flex items-center gap-2">
                Catálogo com IVA automático por categoria
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                exportToCSV(
                  produtos.map(p => ({ codigo: p.codigo, nome: p.nome, tipo: p.tipo, preco: p.preco_unitario, unidade: p.unidade, taxa_iva: p.taxa_iva, stock: p.stock ?? '', stock_min: p.stock_minimo ?? '' })),
                  [{ key: 'codigo', label: 'Código' }, { key: 'nome', label: 'Nome' }, { key: 'tipo', label: 'Tipo' }, { key: 'preco', label: 'Preço' }, { key: 'unidade', label: 'Unidade' }, { key: 'taxa_iva', label: 'IVA %' }, { key: 'stock', label: 'Stock' }, { key: 'stock_min', label: 'Stock Mín.' }],
                  'produtos'
                );
                toast.success('CSV exportado!');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={open => {
              setDialogOpen(open);
              if (!open) { setEditing(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="gradient-primary border-0 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 text-white font-semibold rounded-xl group">
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Novo Item
                </Button>
              </DialogTrigger>

            <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto rounded-2xl border border-border/50 shadow-2xl p-0">
              <form onSubmit={handleSubmit}>
                {/* Dialog header */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 pb-5">
                  <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
                  <DialogHeader className="relative">
                    <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <Box className="w-5 h-5 text-white" />
                      </div>
                      {editing ? 'Editar Item' : 'Novo Produto ou Serviço'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm mt-1">
                      A taxa de IVA é definida <span className="text-primary font-medium">automaticamente</span> pela categoria selecionada.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="grid gap-5 p-6">
                  {/* Tipo */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['produto', 'servico'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, tipo: t }))}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left',
                          form.tipo === t
                            ? 'border-primary bg-primary/5 shadow-sm shadow-primary/20'
                            : 'border-border/60 hover:border-border'
                        )}>
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          form.tipo === t ? 'bg-primary/15' : 'bg-muted')}>
                          {t === 'produto'
                            ? <Package className={cn('w-4 h-4', form.tipo === t ? 'text-primary' : 'text-muted-foreground')} />
                            : <Wrench className={cn('w-4 h-4', form.tipo === t ? 'text-primary' : 'text-muted-foreground')} />
                          }
                        </div>
                        <div>
                          <p className={cn('text-sm font-semibold', form.tipo === t ? 'text-primary' : 'text-foreground')}>
                            {t === 'produto' ? 'Produto' : 'Serviço'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t === 'produto' ? 'Com controlo de stock' : 'Intangível'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Código + Nome */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="codigo" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" /> Código *
                      </Label>
                      <Input id="codigo" value={form.codigo}
                        onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                        placeholder="P001" className="h-10 font-mono text-sm" required />
                    </div>
                    <div className="col-span-2 grid gap-1.5">
                      <Label htmlFor="nome" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome *</Label>
                      <Input id="nome" value={form.nome}
                        onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        placeholder="Nome do item" className="h-10 text-sm" required />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</Label>
                    <Textarea value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Descrição opcional…" rows={2} className="text-sm resize-none" />
                  </div>

                  {/* ── CATEGORIA DE IVA ─────────────────────────── */}
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Categoria de IVA
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(IVA_CONFIG) as CategoriaIva[]).map(cat => {
                        const c = IVA_CONFIG[cat];
                        const active = form.categoria_iva === cat;
                        return (
                          <button key={cat} type="button"
                            onClick={() => setForm(f => ({ ...f, categoria_iva: cat }))}
                            className={cn(
                              'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 overflow-hidden',
                              active ? 'border-transparent shadow-lg scale-[1.02]' : 'border-border/60 hover:border-border hover:scale-[1.01]'
                            )}>
                            {active && (
                              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', c.gradient)} />
                            )}
                            <div className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                              active ? `bg-gradient-to-br ${c.gradient} text-white shadow-md` : 'bg-muted text-muted-foreground'
                            )}>
                              {c.icon}
                            </div>
                            <div className="text-center relative">
                              <p className={cn('text-xs font-bold', active ? 'text-foreground' : 'text-muted-foreground')}>
                                {c.label}
                              </p>
                              <p className={cn('text-[11px] font-mono font-bold mt-0.5',
                                active ? 'text-primary' : 'text-muted-foreground/70')}>
                                {c.isento ? '0% isento' : `${(c.taxa * 100).toFixed(0)}% IVA`}
                              </p>
                            </div>
                            {active && (
                              <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r', c.gradient)} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Exemplos */}
                    <div className="flex flex-wrap gap-1.5 px-1 pt-1">
                      {catCfg.exemplos.slice(0, 6).map(ex => (
                        <span key={ex} className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', catCfg.pill)}>
                          {ex}
                        </span>
                      ))}
                      {catCfg.exemplos.length > 6 && (
                        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium opacity-60', catCfg.pill)}>
                          +{catCfg.exemplos.length - 6} mais
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preço + Unidade */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Preço (Kz) *
                      </Label>
                      <Input type="number" min="0" step="0.01"
                        value={form.preco_unitario}
                        onChange={e => setForm(f => ({ ...f, preco_unitario: e.target.value }))}
                        placeholder="0.00" className="h-10 font-mono text-sm" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unidade</Label>
                      <Select value={form.unidade} onValueChange={v => setForm(f => ({ ...f, unidade: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['unidade', 'hora', 'dia', 'kg', 'litro', 'metro', 'visita'].map(u => (
                            <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ── Prévia em tempo real ──────────────────────── */}
                  {preview && (
                    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                      <div className="relative">
                        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Zap className="w-3 h-3" /> Prévia em tempo real — 1 unidade
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Preço base</span>
                            <span className="font-mono font-medium">{formatCurrency(preview.base)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              IVA
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', catCfg.pill)}>
                                {taxaLabel}
                              </Badge>
                            </span>
                            <span className="font-mono font-medium text-primary">+ {formatCurrency(preview.iva)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-primary/15 font-bold">
                            <span>Total c/ IVA</span>
                            <span className="font-mono text-base">{formatCurrency(preview.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IVA Incluído */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div>
                      <p className="text-sm font-semibold">IVA incluído no preço</p>
                      <p className="text-xs text-muted-foreground mt-0.5">O preço inserido já inclui o IVA</p>
                    </div>
                    <Switch checked={form.iva_incluido}
                      onCheckedChange={v => setForm(f => ({ ...f, iva_incluido: v }))} />
                  </div>

                  {/* Stock */}
                  {form.tipo === 'produto' && (
                    <div className="rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Gestão de Stock</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-muted-foreground font-semibold">Stock Atual</Label>
                          <Input type="number" min="0" value={form.stock}
                            onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                            placeholder="0" className="h-10 font-mono text-sm" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-muted-foreground font-semibold">Stock Mínimo</Label>
                          <Input type="number" min="0" value={form.stock_minimo}
                            onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                            placeholder="0" className="h-10 font-mono text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="px-6 pb-6 gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary border-0 rounded-xl shadow-md shadow-primary/20 font-semibold"
                    disabled={createProduto.isPending || updateProduto.isPending}>
                    {(createProduto.isPending || updateProduto.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editing ? 'Guardar Alterações' : 'Criar Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
           </Dialog>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Produtos', value: produtosCount, icon: Package, colorBar: 'from-blue-400 to-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400', delay: 0 },
          { label: 'Serviços', value: servicosCount, icon: Wrench, colorBar: 'from-violet-400 to-violet-600', iconBg: 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400', delay: 80 },
          { label: 'Stock Baixo', value: lowStock.length, icon: TrendingDown, colorBar: 'from-orange-400 to-orange-600', iconBg: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400', delay: 160 },
        ].map(({ label, value, icon: Icon, colorBar, iconBg, delay }) => (
          <div key={label} className="animate-fade-in group" style={{ animationDelay: `${delay}ms` }}>
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-md">
              <CardContent className="p-0">
                <div className={cn('h-1 w-full bg-gradient-to-r', colorBar)} />
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300', iconBg)}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* ── LOW STOCK ALERT ────────────────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="mb-6 flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/25 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-orange-700 dark:text-orange-300">
              {lowStock.length} produto{lowStock.length > 1 ? 's' : ''} com stock abaixo do mínimo
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {lowStock.map(p => p.nome).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder="Pesquisar por nome, código ou descrição…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/60 bg-background shadow-sm" />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-border/60 bg-background shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="produto"><div className="flex items-center gap-2"><Package className="w-4 h-4" />Produtos</div></SelectItem>
            <SelectItem value="servico"><div className="flex items-center gap-2"><Wrench className="w-4 h-4" />Serviços</div></SelectItem>
          </SelectContent>
        </Select>
        {(search || tipoFilter !== 'all') && (
          <Button variant="ghost" onClick={() => { setSearch(''); setTipoFilter('all'); }}
            className="h-11 px-4 text-muted-foreground hover:text-foreground rounded-xl">
            <X className="w-4 h-4 mr-1.5" /> Limpar
          </Button>
        )}
      </div>

      {/* ── TABLE ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-2xl border-0 shadow-md animate-fade-in" style={{ animationDelay: '280ms' }}>
        <CardHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            Catálogo
            <Badge variant="secondary" className="ml-1 font-mono text-xs">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Item</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Código</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Preço</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Categoria IVA</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Taxa</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center hidden md:table-cell">Stock</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                          <Box className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground">
                            {search || tipoFilter !== 'all' ? 'Nenhum resultado.' : 'Catálogo vazio'}
                          </p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            {search || tipoFilter !== 'all' ? 'Ajuste os filtros.' : 'Crie o seu primeiro produto ou serviço.'}
                          </p>
                        </div>
                        {!search && tipoFilter === 'all' && (
                          <Button onClick={() => setDialogOpen(true)} className="gradient-primary border-0 rounded-xl mt-1">
                            <Plus className="w-4 h-4 mr-2" /> Criar Item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((produto, i) => {
                  const isLow = produto.tipo === 'produto' && produto.stock !== undefined &&
                    produto.stock_minimo !== undefined && produto.stock <= produto.stock_minimo;
                  const cat = ((produto as any).categoria_iva as CategoriaIva) ?? 'geral';
                  const cc  = IVA_CONFIG[cat];

                  return (
                    <TableRow key={produto.id}
                      className="group hover:bg-muted/40 transition-colors duration-150 border-border/30 animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}>

                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200',
                            produto.tipo === 'produto'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                              : 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
                          )}>
                            {produto.tipo === 'produto' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate max-w-[200px]">{produto.nome}</p>
                            {produto.descricao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{produto.descricao}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="text-xs font-mono px-2 py-1 rounded-lg bg-muted border border-border/50 text-muted-foreground">
                          {produto.codigo}
                        </code>
                      </TableCell>

                      <TableCell className="text-right">
                        <p className="font-bold text-sm font-mono">{formatCurrency(produto.preco_unitario)}</p>
                        <p className="text-[11px] text-muted-foreground">/{produto.unidade}</p>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          cc.pill
                        )}>
                          {cc.icon}
                          {cc.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="font-mono font-bold text-sm">
                          {getTaxaLabel(cat)}
                        </span>
                      </TableCell>

                      <TableCell className="text-center hidden md:table-cell">
                        {produto.tipo === 'produto' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn('font-bold text-sm font-mono',
                              isLow ? 'text-orange-600 dark:text-orange-400' : '')}>
                              {formatNumber(produto.stock || 0)}
                            </span>
                            {isLow && (
                              <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Baixo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem onClick={() => handleEdit(produto)} className="rounded-lg">
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive rounded-lg"
                              onClick={() => { setToDelete(produto); setDelDialog(true); }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
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

      {/* ── DELETE DIALOG ──────────────────────────────────────── */}
      <AlertDialog open={delDialog} onOpenChange={setDelDialog}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              Eliminar item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong className="text-foreground">{toDelete?.nome}</strong>?
              Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-md shadow-destructive/20">
              {deleteProduto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}