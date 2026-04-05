import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Sparkles, BarChart3, Tag, ScanBarcode,
} from 'lucide-react';
import { BarcodeInput, lookupBarcode, type OpenFoodFactsProduct } from '@/components/produtos/BarcodeScanner';
import { exportToCSV } from '@/lib/csv-export';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════
// PALETA — Âmbar/Laranja Suave (substitui o azul escuro)
// ═══════════════════════════════════════════════════════════════
// Hero:  from-amber-50 via-orange-50/60 to-yellow-50
// Accents: amber-500, orange-500
// Borders: amber-200/60
// ═══════════════════════════════════════════════════════════════

type CategoriaIva = 'geral' | 'alimentar' | 'medicamento';

const IVA_CONFIG: Record<CategoriaIva, {
  label: string;
  taxa: number;
  isento: boolean;
  descricao: string;
  exemplos: string[];
  icon: React.ReactNode;
  gradient: string;
  pill: string;
  dot: string;
  ringColor: string;
}> = {
  geral: {
    label: 'Geral',
    taxa: 0.14,
    isento: false,
    descricao: 'Taxa normal — produtos e serviços gerais',
    exemplos: ['Eletrónica', 'Vestuário', 'Consultoria', 'Software', 'Mobiliário'],
    icon: <ShieldCheck className="w-4 h-4" />,
    gradient: 'from-amber-400 to-orange-500',
    pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
    ringColor: 'ring-amber-200 dark:ring-amber-800',
  },
  alimentar: {
    label: 'Alimentar',
    taxa: 0.05,
    isento: false,
    descricao: 'Taxa reduzida — bens alimentares de amplo consumo',
    exemplos: ['Carnes', 'Peixes', 'Leite', 'Ovos', 'Frutas', 'Hortícolas', 'Farinha', 'Açúcar', 'Óleo', 'Água', 'Sal'],
    icon: <Leaf className="w-4 h-4" />,
    gradient: 'from-emerald-400 to-green-600',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    ringColor: 'ring-emerald-200 dark:ring-emerald-800',
  },
  medicamento: {
    label: 'Medicamentos',
    taxa: 0,
    isento: true,
    descricao: 'Isento — medicamentos, vacinas e equipamentos hospitalares',
    exemplos: ['Medicamentos', 'Vacinas', 'Equipamentos hospitalares', 'Dispositivos médicos'],
    icon: <Stethoscope className="w-4 h-4" />,
    gradient: 'from-rose-400 to-red-500',
    pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
    ringColor: 'ring-rose-200 dark:ring-rose-800',
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
  barcode: '', marca: '', categoria: '', imagem_url: '',
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
      p.descricao?.toLowerCase().includes(s) ||
      (p as any).barcode?.toLowerCase().includes(s) ||
      (p as any).marca?.toLowerCase().includes(s);
    return matchSearch && (tipoFilter === 'all' || p.tipo === tipoFilter);
  }), [produtos, search, tipoFilter]);

  const produtosCount = produtos.filter(p => p.tipo === 'produto').length;
  const servicosCount = produtos.filter(p => p.tipo === 'servico').length;
  const lowStock      = produtos.filter(p =>
    p.tipo === 'produto' && p.stock !== undefined &&
    p.stock_minimo !== undefined && p.stock <= p.stock_minimo
  );
  const totalItems = produtos.length;

  const resetForm = () => setForm(FORM_INIT);

  const handleEdit = (p: Produto) => {
    setEditing(p);
    setForm({
      codigo: p.codigo, nome: p.nome, descricao: p.descricao || '',
      tipo: p.tipo, preco_unitario: p.preco_unitario.toString(),
      unidade: p.unidade, iva_incluido: p.iva_incluido,
      categoria_iva: ((p as any).categoria_iva as CategoriaIva) ?? 'geral',
      stock: p.stock?.toString() || '', stock_minimo: p.stock_minimo?.toString() || '',
      barcode: (p as any).barcode || '', marca: (p as any).marca || '',
      categoria: (p as any).categoria || '', imagem_url: (p as any).imagem_url || '',
    });
    setDialogOpen(true);
  };

  const handleBarcodeProduct = useCallback((product: OpenFoodFactsProduct | null) => {
    if (product) {
      setForm(f => ({
        ...f,
        nome: f.nome || product.name,
        marca: product.brand,
        categoria: product.category,
        imagem_url: product.image_url || '',
      }));
      toast.success('Produto encontrado na base de dados global!');
    }
  }, []);

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
      barcode: form.barcode || undefined,
      marca: form.marca || undefined,
      imagem_url: form.imagem_url || undefined,
      categoria: form.categoria || undefined,
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
            <div className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse font-medium">A carregar catálogo…</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>

      {/* ══════════════════════════════════════════════════════
          HERO — Âmbar/laranja suave, sem azul escuro
      ══════════════════════════════════════════════════════ */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-amber-200/60 dark:border-amber-800/40
        bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50
        dark:from-amber-950/40 dark:via-orange-950/30 dark:to-stone-900
        p-7 shadow-lg shadow-amber-100/50 dark:shadow-amber-950/20">

        {/* Orbs decorativos */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/25 dark:bg-amber-700/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-orange-300/20 dark:bg-orange-800/15 blur-3xl" />

        {/* Dot grid subtil */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #92400e 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Linha de acento topo */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
              flex items-center justify-center shadow-lg shadow-amber-300/40 dark:shadow-amber-700/30
              ring-2 ring-white/40 dark:ring-amber-800/30 flex-shrink-0">
              <Box className="w-7 h-7 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-50 tracking-tight">
                  Produtos & Serviços
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                  bg-amber-500/12 dark:bg-amber-400/15 border border-amber-300/60 dark:border-amber-700/50
                  text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3 h-3" />
                  {totalItems} itens
                </span>
              </div>
              <p className="text-amber-700/70 dark:text-amber-400/70 text-sm font-medium">
                Catálogo com IVA automático por categoria · Angola
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300/70 dark:border-amber-700/60 text-amber-800 dark:text-amber-200
                bg-white/60 dark:bg-amber-950/40 hover:bg-white/90 dark:hover:bg-amber-900/50
                shadow-sm rounded-xl font-semibold text-sm backdrop-blur-sm"
              onClick={() => {
                exportToCSV(
                  produtos.map(p => ({
                    codigo: p.codigo, nome: p.nome, tipo: p.tipo,
                    preco: p.preco_unitario, unidade: p.unidade,
                    taxa_iva: p.taxa_iva, stock: p.stock ?? '', stock_min: p.stock_minimo ?? ''
                  })),
                  [
                    { key: 'codigo', label: 'Código' }, { key: 'nome', label: 'Nome' },
                    { key: 'tipo', label: 'Tipo' }, { key: 'preco', label: 'Preço' },
                    { key: 'unidade', label: 'Unidade' }, { key: 'taxa_iva', label: 'IVA %' },
                    { key: 'stock', label: 'Stock' }, { key: 'stock_min', label: 'Stock Mín.' },
                  ],
                  'produtos'
                );
                toast.success('CSV exportado!');
              }}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Exportar CSV
            </Button>

            <Dialog open={dialogOpen} onOpenChange={open => {
              setDialogOpen(open);
              if (!open) { setEditing(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500
                    hover:from-amber-400 hover:to-orange-400
                    text-white font-bold rounded-xl shadow-md shadow-amber-400/30
                    hover:shadow-amber-400/50 hover:scale-[1.02] transition-all duration-200
                    border-0 px-5 h-10 group">
                  <Plus className="w-4 h-4 mr-1.5 group-hover:rotate-90 transition-transform duration-300" />
                  Novo Item
                </Button>
              </DialogTrigger>

              {/* ══ DIALOG FORM ════════════════════════════════ */}
              <DialogContent className="sm:max-w-[590px] max-h-[93vh] overflow-y-auto rounded-2xl border border-border/40 shadow-2xl p-0">
                <form onSubmit={handleSubmit}>

                  {/* Dialog header — âmbar quente */}
                  <div className="relative overflow-hidden rounded-t-2xl
                    bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50
                    dark:from-amber-950/60 dark:via-orange-950/40 dark:to-stone-900
                    border-b border-amber-200/60 dark:border-amber-800/40 p-6 pb-5">
                    <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-amber-300/30 dark:bg-amber-700/20 blur-2xl" />
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-400" />

                    <DialogHeader className="relative">
                      <DialogTitle className="text-amber-950 dark:text-amber-50 text-xl font-bold flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500
                          flex items-center justify-center shadow-md shadow-amber-300/30">
                          <Box className="w-5 h-5 text-white" />
                        </div>
                        {editing ? 'Editar Item' : 'Novo Produto ou Serviço'}
                      </DialogTitle>
                      <DialogDescription className="text-amber-700/65 dark:text-amber-400/65 text-sm mt-1">
                        A taxa de IVA é definida <span className="text-amber-600 dark:text-amber-400 font-semibold">automaticamente</span> pela categoria selecionada.
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <div className="grid gap-5 p-6">

                    {/* ── Tipo ── */}
                    <div>
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Tipo de item</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['produto', 'servico'] as const).map(t => (
                          <button key={t} type="button"
                            onClick={() => setForm(f => ({ ...f, tipo: t }))}
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left group',
                              form.tipo === t
                                ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/50 shadow-sm shadow-amber-200/50 dark:shadow-amber-900/30'
                                : 'border-border/50 hover:border-amber-200 dark:hover:border-amber-800 bg-transparent hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                            )}>
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                              form.tipo === t
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                                : 'bg-muted text-muted-foreground group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40')}>
                              {t === 'produto'
                                ? <Package className="w-5 h-5" />
                                : <Wrench className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className={cn('text-sm font-bold',
                                form.tipo === t ? 'text-amber-700 dark:text-amber-300' : 'text-foreground')}>
                                {t === 'produto' ? 'Produto' : 'Serviço'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t === 'produto' ? 'Com controlo de stock' : 'Intangível / digital'}
                              </p>
                            </div>
                            {form.tipo === t && (
                              <div className="ml-auto w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Código de Barras ── */}
                    {form.tipo === 'produto' && (
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <ScanBarcode className="w-3.5 h-3.5" /> Código de Barras
                        </Label>
                        <BarcodeInput
                          value={form.barcode}
                          onChange={(barcode) => setForm(f => ({ ...f, barcode }))}
                          onProductFound={handleBarcodeProduct}
                        />
                        {form.imagem_url && (
                          <div className="flex items-center gap-3 mt-1 p-2 rounded-lg bg-muted/50 border">
                            <img src={form.imagem_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              {form.marca && <p className="text-xs font-semibold text-muted-foreground">{form.marca}</p>}
                              {form.categoria && <p className="text-xs text-muted-foreground">{form.categoria}</p>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setForm(f => ({ ...f, imagem_url: '', marca: '', categoria: '' }))}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Código + Nome ── */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="codigo" className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> Código *
                        </Label>
                        <Input id="codigo" value={form.codigo}
                          onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                          placeholder="P001" className="h-10 font-mono text-sm
                            focus-visible:ring-amber-400 focus-visible:border-amber-400" required />
                      </div>
                      <div className="col-span-2 grid gap-1.5">
                        <Label htmlFor="nome" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome *</Label>
                        <Input id="nome" value={form.nome}
                          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                          placeholder="Nome do produto ou serviço"
                          className="h-10 text-sm focus-visible:ring-amber-400 focus-visible:border-amber-400" required />
                      </div>
                    </div>

                    {/* ── Descrição ── */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Descrição</Label>
                      <Textarea value={form.descricao}
                        onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                        placeholder="Descrição opcional…" rows={2}
                        className="text-sm resize-none focus-visible:ring-amber-400 focus-visible:border-amber-400" />
                    </div>

                    {/* ── Categoria IVA ── */}
                    <div className="grid gap-2.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
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
                                'relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 overflow-hidden',
                                active
                                  ? `border-transparent shadow-md ring-2 ${c.ringColor} scale-[1.02]`
                                  : 'border-border/50 hover:border-border hover:scale-[1.01] bg-transparent'
                              )}>
                              {active && (
                                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-8', c.gradient)} />
                              )}
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                                active
                                  ? `bg-gradient-to-br ${c.gradient} text-white shadow-lg`
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {c.icon}
                              </div>
                              <div className="text-center relative z-10">
                                <p className={cn('text-xs font-bold leading-tight',
                                  active ? 'text-foreground' : 'text-muted-foreground')}>
                                  {c.label}
                                </p>
                                <p className={cn('text-[10px] font-mono font-bold mt-0.5',
                                  active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/60')}>
                                  {c.isento ? 'Isento' : `${(c.taxa * 100).toFixed(0)}% IVA`}
                                </p>
                              </div>
                              {active && (
                                <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r', c.gradient)} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Exemplos da categoria */}
                      <div className="flex flex-wrap gap-1.5 px-0.5">
                        {catCfg.exemplos.slice(0, 6).map(ex => (
                          <span key={ex} className={cn('text-[11px] px-2.5 py-0.5 rounded-full border font-semibold', catCfg.pill)}>
                            {ex}
                          </span>
                        ))}
                        {catCfg.exemplos.length > 6 && (
                          <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full border font-semibold opacity-55', catCfg.pill)}>
                            +{catCfg.exemplos.length - 6} mais
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Preço + Unidade ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Preço (Kz) *
                        </Label>
                        <Input type="number" min="0" step="0.01"
                          value={form.preco_unitario}
                          onChange={e => setForm(f => ({ ...f, preco_unitario: e.target.value }))}
                          placeholder="0.00"
                          className="h-10 font-mono text-sm focus-visible:ring-amber-400 focus-visible:border-amber-400" required />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unidade</Label>
                        <Select value={form.unidade} onValueChange={v => setForm(f => ({ ...f, unidade: v }))}>
                          <SelectTrigger className="h-10 text-sm focus:ring-amber-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['unidade', 'hora', 'dia', 'kg', 'litro', 'metro', 'visita'].map(u => (
                              <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ── Prévia em tempo real ── */}
                    {preview && (
                      <div className="relative overflow-hidden rounded-xl
                        border border-amber-200/70 dark:border-amber-800/50
                        bg-gradient-to-br from-amber-50 via-orange-50/40 to-yellow-50/60
                        dark:from-amber-950/40 dark:via-orange-950/20 dark:to-stone-900/60
                        p-4">
                        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-amber-400 to-orange-400" />
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-300/20 rounded-full blur-xl" />
                        <div className="relative">
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Prévia em tempo real — 1 unidade
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-medium">Preço base</span>
                              <span className="font-mono font-bold">{formatCurrency(preview.base)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-medium flex items-center gap-2">
                                IVA
                                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-bold', catCfg.pill)}>
                                  {taxaLabel}
                                </Badge>
                              </span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                + {formatCurrency(preview.iva)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 font-bold">
                              <span className="text-foreground">Total c/ IVA</span>
                              <span className="font-mono text-base text-amber-700 dark:text-amber-300">
                                {formatCurrency(preview.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── IVA Incluído ── */}
                    <div className="flex items-center justify-between p-4 rounded-xl
                      bg-muted/40 border border-border/40 hover:border-amber-200 dark:hover:border-amber-800
                      transition-colors duration-200">
                      <div>
                        <p className="text-sm font-semibold">IVA incluído no preço</p>
                        <p className="text-xs text-muted-foreground mt-0.5">O preço já inclui o IVA</p>
                      </div>
                      <Switch
                        checked={form.iva_incluido}
                        onCheckedChange={v => setForm(f => ({ ...f, iva_incluido: v }))}
                        className="data-[state=checked]:bg-amber-500" />
                    </div>

                    {/* ── Stock (só produtos) ── */}
                    {form.tipo === 'produto' && (
                      <div className="rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800/50
                        bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50
                            flex items-center justify-center">
                            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Gestão de Stock</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground font-semibold">Stock Atual</Label>
                            <Input type="number" min="0" value={form.stock}
                              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                              placeholder="0" className="h-10 font-mono text-sm focus-visible:ring-amber-400" />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground font-semibold">Stock Mínimo</Label>
                            <Input type="number" min="0" value={form.stock_minimo}
                              onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                              placeholder="0" className="h-10 font-mono text-sm focus-visible:ring-amber-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <DialogFooter className="px-6 pb-6 gap-2 border-t border-border/30 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                      Cancelar
                    </Button>
                    <Button type="submit"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                        text-white border-0 rounded-xl shadow-md shadow-amber-400/25 font-bold"
                      disabled={createProduto.isPending || updateProduto.isPending}>
                      {(createProduto.isPending || updateProduto.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editing ? 'Guardar Alterações' : 'Criar Item'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STAT CARDS — 4 cards (agora com total)
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Catálogo', value: totalItems,
            icon: BarChart3,
            bar: 'from-amber-400 to-orange-400',
            iconBg: 'bg-amber-100 dark:bg-amber-900/50',
            iconColor: 'text-amber-600 dark:text-amber-400',
            delay: 0,
          },
          {
            label: 'Produtos', value: produtosCount,
            icon: Package,
            bar: 'from-orange-400 to-red-400',
            iconBg: 'bg-orange-100 dark:bg-orange-900/40',
            iconColor: 'text-orange-600 dark:text-orange-400',
            delay: 60,
          },
          {
            label: 'Serviços', value: servicosCount,
            icon: Wrench,
            bar: 'from-yellow-400 to-amber-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
            iconColor: 'text-yellow-600 dark:text-yellow-500',
            delay: 120,
          },
          {
            label: 'Stock Baixo', value: lowStock.length,
            icon: TrendingDown,
            bar: lowStock.length > 0 ? 'from-red-400 to-rose-500' : 'from-emerald-400 to-green-500',
            iconBg: lowStock.length > 0
              ? 'bg-red-100 dark:bg-red-900/40'
              : 'bg-emerald-100 dark:bg-emerald-900/40',
            iconColor: lowStock.length > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400',
            delay: 180,
          },
        ].map(({ label, value, icon: Icon, bar, iconBg, iconColor, delay }) => (
          <div key={label} style={{ animationDelay: `${delay}ms` }}
            className="animate-fade-in group">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
              border border-amber-100 dark:border-amber-900/30 shadow-sm shadow-amber-50 dark:shadow-none">
              <CardContent className="p-0">
                <div className={cn('h-[3px] w-full bg-gradient-to-r', bar)} />
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-2">
                      {label}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
                  </div>
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                    'group-hover:scale-110 transition-transform duration-300',
                    iconBg,
                  )}>
                    <Icon className={cn('w-6 h-6', iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          ALERTA STOCK BAIXO
      ══════════════════════════════════════════════════════ */}
      {lowStock.length > 0 && (
        <div className="mb-6 flex items-start gap-4 p-5 rounded-2xl
          bg-gradient-to-r from-red-50 via-rose-50/60 to-transparent
          dark:from-red-950/30 dark:via-rose-950/20 dark:to-transparent
          border border-red-200/70 dark:border-red-800/40 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500
            flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-400/30">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-700 dark:text-red-300 text-sm">
              {lowStock.length} produto{lowStock.length > 1 ? 's' : ''} com stock abaixo do mínimo
            </p>
            <p className="text-sm text-red-600/70 dark:text-red-400/60 mt-0.5 truncate">
              {lowStock.map(p => p.nome).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SEARCH & FILTER
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search"
            placeholder="Pesquisar por nome, código ou descrição…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/50 bg-background shadow-sm
              focus-visible:ring-amber-400 focus-visible:border-amber-400" />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-border/50 bg-background shadow-sm focus:ring-amber-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2"><Box className="w-4 h-4" />Todos os tipos</div>
            </SelectItem>
            <SelectItem value="produto">
              <div className="flex items-center gap-2"><Package className="w-4 h-4" />Produtos</div>
            </SelectItem>
            <SelectItem value="servico">
              <div className="flex items-center gap-2"><Wrench className="w-4 h-4" />Serviços</div>
            </SelectItem>
          </SelectContent>
        </Select>
        {(search || tipoFilter !== 'all') && (
          <Button variant="ghost" onClick={() => { setSearch(''); setTipoFilter('all'); }}
            className="h-11 px-4 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300
              hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors duration-200">
            <X className="w-4 h-4 mr-1.5" /> Limpar
          </Button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          TABELA
      ══════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden rounded-2xl border border-amber-100 dark:border-amber-900/25
        shadow-sm animate-fade-in" style={{ animationDelay: '280ms' }}>

        <CardHeader className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/30
          bg-amber-50/50 dark:bg-amber-950/20">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Tag className="w-4 h-4 text-amber-500" />
            Catálogo
            <Badge className="ml-1 font-mono text-xs bg-amber-100 dark:bg-amber-900/50
              text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {filtered.length}
            </Badge>
            {search && (
              <span className="text-xs text-muted-foreground font-normal ml-1">
                resultados para "<strong>{search}</strong>"
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-amber-100 dark:border-amber-900/20
                  bg-amber-50/30 dark:bg-amber-950/10">
                  {[
                    { label: 'Item', cls: 'pl-6' },
                    { label: 'Código', cls: '' },
                    { label: 'Preço', cls: 'text-right' },
                    { label: 'Categoria IVA', cls: 'text-center' },
                    { label: 'Taxa', cls: 'text-center' },
                    { label: 'Stock', cls: 'text-center hidden md:table-cell' },
                  ].map(({ label, cls }) => (
                    <TableHead key={label}
                      className={cn('text-[11px] font-bold uppercase tracking-widest text-muted-foreground', cls)}>
                      {label}
                    </TableHead>
                  ))}
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/30
                          border border-amber-200/60 dark:border-amber-800/30
                          flex items-center justify-center">
                          <Box className="w-10 h-10 text-amber-300 dark:text-amber-700" />
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground">
                            {search || tipoFilter !== 'all' ? 'Nenhum resultado.' : 'Catálogo vazio'}
                          </p>
                          <p className="text-sm text-muted-foreground/60 mt-1">
                            {search || tipoFilter !== 'all'
                              ? 'Ajuste os filtros de pesquisa.'
                              : 'Crie o seu primeiro produto ou serviço.'}
                          </p>
                        </div>
                        {!search && tipoFilter === 'all' && (
                          <Button onClick={() => setDialogOpen(true)}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0
                              rounded-xl shadow-md shadow-amber-400/25 font-bold hover:from-amber-400 hover:to-orange-400 mt-1">
                            <Plus className="w-4 h-4 mr-2" /> Criar Item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((produto, i) => {
                  const isLow = produto.tipo === 'produto' &&
                    produto.stock !== undefined && produto.stock_minimo !== undefined &&
                    produto.stock <= produto.stock_minimo;
                  const cat  = ((produto as any).categoria_iva as CategoriaIva) ?? 'geral';
                  const cc   = IVA_CONFIG[cat];

                  return (
                    <TableRow key={produto.id}
                      className="group hover:bg-amber-50/50 dark:hover:bg-amber-950/20
                        transition-colors duration-150 border-amber-100/70 dark:border-amber-900/15
                        animate-fade-in"
                      style={{ animationDelay: `${i * 35}ms` }}>

                      {/* Item */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                            'group-hover:scale-110 transition-transform duration-200',
                            produto.tipo === 'produto'
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                          )}>
                            {produto.tipo === 'produto'
                              ? <Package className="w-5 h-5" />
                              : <Wrench className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                              {produto.nome}
                            </p>
                            {produto.descricao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                                {produto.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Código */}
                      <TableCell>
                        <code className="text-xs font-mono px-2 py-1 rounded-lg
                          bg-amber-50 dark:bg-amber-950/40
                          border border-amber-200/70 dark:border-amber-800/40
                          text-amber-700 dark:text-amber-400">
                          {produto.codigo}
                        </code>
                      </TableCell>

                      {/* Preço */}
                      <TableCell className="text-right">
                        <p className="font-bold text-sm font-mono text-foreground">
                          {formatCurrency(produto.preco_unitario)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">/{produto.unidade}</p>
                      </TableCell>

                      {/* Categoria IVA */}
                      <TableCell className="text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          cc.pill
                        )}>
                          {cc.icon}
                          {cc.label}
                        </span>
                      </TableCell>

                      {/* Taxa */}
                      <TableCell className="text-center">
                        <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">
                          {getTaxaLabel(cat)}
                        </span>
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center hidden md:table-cell">
                        {produto.tipo === 'produto' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn('font-bold text-sm font-mono',
                              isLow ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
                              {formatNumber(produto.stock || 0)}
                            </span>
                            {isLow && (
                              <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Baixo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-base">—</span>
                        )}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100
                                hover:bg-amber-100 dark:hover:bg-amber-900/40
                                hover:text-amber-700 dark:hover:text-amber-300
                                transition-all duration-150">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl border-amber-100 dark:border-amber-900/30 shadow-lg">
                            <DropdownMenuItem
                              onClick={() => handleEdit(produto)}
                              className="rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40
                                hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-amber-100 dark:bg-amber-900/30" />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive rounded-lg cursor-pointer"
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

      {/* ══════════════════════════════════════════════════════
          DELETE DIALOG
      ══════════════════════════════════════════════════════ */}
      <AlertDialog open={delDialog} onOpenChange={setDelDialog}>
        <AlertDialogContent className="rounded-2xl border border-border/40 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2.5 text-base font-bold">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              Eliminar item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem a certeza que deseja eliminar <strong className="text-foreground font-semibold">{toDelete?.nome}</strong>?
              Esta ação <span className="font-semibold">não pode ser revertida</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-1">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90
                rounded-xl shadow-md shadow-destructive/20 font-bold">
              {deleteProduto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}