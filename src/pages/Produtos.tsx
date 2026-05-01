import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Package, Plus, Search, Edit3, Trash2, Loader2,
  ArrowUpDown, Filter, Box, Tag,
  Grid3X3, List, AlertCircle, Camera,
  ScanLine, CheckCircle2, X,
  Layers, Zap, BarChart3, Hash,
} from 'lucide-react';
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto } from '@/hooks/useProdutos';
import { BarcodeScanner } from '@/components/produtos/BarcodeScanner';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

interface ProdutoForm {
  nome: string;
  codigo: string;
  barcode: string;
  preco_unitario: number;
  taxa_iva: number;
  unidade: string;
  categoria: string;
  descricao: string;
  stock_minimo: number;
}

const EMPTY_FORM: ProdutoForm = {
  nome: '',
  codigo: '',
  barcode: '',
  preco_unitario: 0,
  taxa_iva: 14,
  unidade: 'un',
  categoria: '',
  descricao: '',
  stock_minimo: 0,
};

const IVA_OPTIONS = [0, 5, 7, 14, 19];
const UNIDADE_OPTIONS = ['un', 'kg', 'l', 'cx', 'm', 'par', 'pct'];
const CATEGORIA_OPTIONS = [
  'Alimentação', 'Bebidas', 'Higiene', 'Electrónica', 'Vestuário',
  'Ferramentas', 'Escritório', 'Serviços', 'Outros',
];

type ViewMode = 'grid' | 'list';
type SortKey = 'nome' | 'preco_unitario' | 'taxa_iva';

export default function Produtos() {
  const { data: produtos = [], isLoading } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProdutoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const setField = (key: keyof ProdutoForm, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const filtered = produtos
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.nome.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.barcode || '').includes(q);
      const matchCat = filterCategoria === 'all' || !filterCategoria || p.categoria === filterCategoria;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const stats = {
    total: produtos.length,
    avgPrice: produtos.length
      ? produtos.reduce((s, p) => s + (p.preco_unitario ?? 0), 0) / produtos.length
      : 0,
    categories: new Set(produtos.map(p => p.categoria).filter(Boolean)).size,
    withBarcode: produtos.filter(p => p.barcode).length,
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      nome: p.nome,
      codigo: p.codigo,
      barcode: p.barcode || '',
      preco_unitario: p.preco_unitario,
      taxa_iva: p.taxa_iva,
      unidade: p.unidade || 'un',
      categoria: p.categoria || '',
      descricao: p.descricao || '',
      stock_minimo: p.stock_minimo || 0,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.codigo.trim()) { toast.error('Código é obrigatório'); return; }
    if (form.preco_unitario <= 0) { toast.error('Preço deve ser positivo'); return; }

    setSaving(true);
    try {
      if (editingId) {
        await updateProduto.mutateAsync({ id: editingId, ...form });
        toast.success('Produto actualizado');
      } else {
        await createProduto.mutateAsync({ tipo: 'produto', iva_incluido: false, ...form } as any);
        toast.success('Produto criado com sucesso');
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduto.mutateAsync(id);
      toast.success('Produto eliminado');
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const precoComIva = form.preco_unitario * (1 + form.taxa_iva / 100);

  return (
    <MainLayout>
      {/* ─── SCANNER OVERLAY — renderizado fora de qualquer Dialog, no topo do DOM ─── */}
      {scanningBarcode && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center">
          <div className="w-full max-w-md px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5C200] flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-black" />
                </div>
                <span className="text-white font-bold text-sm tracking-wider uppercase">Leitor de Código</span>
              </div>
              <button
                onClick={() => setScanningBarcode(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <BarcodeScanner
              onScan={(code) => {
                setField('barcode', code);
                setScanningBarcode(false);
                toast.success(`Barcode capturado: ${code}`);
              }}
              onClose={() => setScanningBarcode(false)}
            />
          </div>
        </div>
      )}

      {/* ─── PAGE HEADER ─── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F5C200] flex items-center justify-center shadow-lg shadow-[#F5C200]/30">
              <Box className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">CATÁLOGO</h1>
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mt-0.5">Gestão de Produtos</p>
            </div>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#F5C200]/40 via-[#F5C200]/10 to-transparent" />
          <Button
            onClick={openCreate}
            className="gap-2 bg-[#F5C200] hover:bg-[#e6b800] text-black font-bold border-0 shadow-lg shadow-[#F5C200]/25 rounded-xl h-10 px-5"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {/* ─── STATS ROW ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total de produtos', value: stats.total, icon: <Layers className="w-4 h-4" />, accent: true },
            { label: 'Preço médio', value: formatCurrency(stats.avgPrice), icon: <BarChart3 className="w-4 h-4" />, accent: false },
            { label: 'Categorias', value: stats.categories, icon: <Hash className="w-4 h-4" />, accent: false },
            { label: 'Com código barras', value: stats.withBarcode, icon: <ScanLine className="w-4 h-4" />, accent: false },
          ].map(stat => (
            <div
              key={stat.label}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                stat.accent
                  ? 'bg-[#F5C200] border-[#F5C200] text-black shadow-lg shadow-[#F5C200]/20'
                  : 'bg-card border-border/50 hover:border-[#F5C200]/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                stat.accent ? 'bg-black/10' : 'bg-[#F5C200]/10 text-[#F5C200]'
              }`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black leading-none">{stat.value}</p>
                <p className={`text-[10px] mt-0.5 truncate font-medium ${stat.accent ? 'text-black/60' : 'text-muted-foreground'}`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── TOOLBAR ─── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar nome, código ou barcode..."
              className="pl-9 h-10 rounded-xl border-border/60 focus:border-[#F5C200] focus:ring-[#F5C200]/20 bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-10 w-40 text-xs rounded-xl border-border/60">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIA_OPTIONS.map(c => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-xl border border-border/60 overflow-hidden h-10">
            <button
              onClick={() => toggleSort('nome')}
              className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors ${sortKey === 'nome' ? 'bg-[#F5C200] text-black font-bold' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              Nome <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('preco_unitario')}
              className={`px-3 h-full text-xs flex items-center gap-1.5 border-l border-border/60 transition-colors ${sortKey === 'preco_unitario' ? 'bg-[#F5C200] text-black font-bold' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              Preço <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center rounded-xl border border-border/60 overflow-hidden h-10 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 h-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#F5C200] text-black' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 h-full flex items-center justify-center border-l border-border/60 transition-colors ${viewMode === 'list' ? 'bg-[#F5C200] text-black' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F5C200]" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Carregando...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-[#F5C200]/10 border border-[#F5C200]/20 flex items-center justify-center mb-5">
            <Package className="w-9 h-9 text-[#F5C200]/60" />
          </div>
          <p className="text-base font-bold">Nenhum produto encontrado</p>
          <p className="text-sm mt-1 text-muted-foreground">
            {search || (filterCategoria && filterCategoria !== 'all') ? 'Ajuste os filtros de pesquisa' : 'Crie o primeiro produto do catálogo'}
          </p>
          {!search && (!filterCategoria || filterCategoria === 'all') && (
            <Button onClick={openCreate} className="mt-5 gap-2 bg-[#F5C200] text-black hover:bg-[#e6b800] font-bold rounded-xl border-0">
              <Plus className="w-4 h-4" />
              Criar produto
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => (
            <div
              key={p.id}
              className="group relative p-4 rounded-2xl border border-border/50 bg-card hover:border-[#F5C200]/50 hover:shadow-lg hover:shadow-[#F5C200]/5 transition-all duration-200"
            >
              {/* top accent line */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#F5C200]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5C200]/10 border border-[#F5C200]/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#F5C200]" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-7 h-7 rounded-lg hover:bg-[#F5C200]/10 flex items-center justify-center text-muted-foreground hover:text-[#F5C200] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm leading-tight mb-0.5 pr-2">{p.nome}</h3>
              <p className="text-[10px] text-muted-foreground font-mono mb-3 tracking-wider">{p.codigo}</p>

              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-lg font-black text-[#F5C200]">{formatCurrency(p.preco_unitario)}</span>
                <span className="text-[10px] text-muted-foreground">+ IVA {p.taxa_iva}%</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.categoria && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C200]/10 text-[#F5C200] font-semibold border border-[#F5C200]/20">
                    {p.categoria}
                  </span>
                )}
                {p.barcode && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono flex items-center gap-1">
                    <ScanLine className="w-2.5 h-2.5" />
                    {p.barcode}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                  {p.unidade || 'un'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50">
                <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">Produto</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest hidden sm:table-cell">Código</th>
                <th className="text-right text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest">Preço</th>
                <th className="text-center text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest hidden md:table-cell">IVA</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-3 uppercase tracking-widest hidden lg:table-cell">Categoria</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(p => (
                <tr key={p.id} className="group hover:bg-[#F5C200]/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F5C200]/10 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-[#F5C200]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{p.nome}</p>
                        {p.barcode && (
                          <p className="text-[10px] font-mono text-muted-foreground/60">{p.barcode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs font-mono text-muted-foreground">{p.codigo}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-[#F5C200]">{formatCurrency(p.preco_unitario)}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5C200]/10 text-[#F5C200] font-bold border border-[#F5C200]/20">
                      {p.taxa_iva}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {p.categoria && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {p.categoria}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 rounded-lg hover:bg-[#F5C200]/10 flex items-center justify-center text-muted-foreground hover:text-[#F5C200]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p.id)}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CREATE/EDIT DIALOG ─── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5C200] flex items-center justify-center shadow-lg shadow-[#F5C200]/30">
                {editingId ? <Edit3 className="w-5 h-5 text-black" /> : <Plus className="w-5 h-5 text-black" />}
              </div>
              <div>
                <DialogTitle className="text-base font-black">
                  {editingId ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
                </DialogTitle>
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5">
                  {editingId ? 'Actualizar dados do produto' : 'Preencha os campos obrigatórios'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Informação Básica */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Info Básica</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Nome do Produto <span className="text-[#F5C200]">*</span></Label>
                <Input
                  value={form.nome}
                  onChange={e => setField('nome', e.target.value)}
                  placeholder="Ex: Água Mineral 1.5L"
                  className="h-10 rounded-xl border-border/60 focus:border-[#F5C200] focus:ring-[#F5C200]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Código Interno <span className="text-[#F5C200]">*</span></Label>
                  <Input
                    value={form.codigo}
                    onChange={e => setField('codigo', e.target.value.toUpperCase())}
                    placeholder="PRD001"
                    className="h-10 font-mono rounded-xl border-border/60 focus:border-[#F5C200]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Unidade</Label>
                  <Select value={form.unidade} onValueChange={v => setField('unidade', v)}>
                    <SelectTrigger className="h-10 rounded-xl border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADE_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Categoria</Label>
                <Select value={form.categoria || 'none'} onValueChange={v => setField('categoria', v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60">
                    <SelectValue placeholder="Seleccionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {CATEGORIA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Código de Barras */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1.5">
                  <ScanLine className="w-3 h-3" /> Código de Barras
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={e => setField('barcode', e.target.value)}
                  placeholder="EAN-13, UPC, QR Code..."
                  className="h-10 font-mono flex-1 rounded-xl border-border/60 focus:border-[#F5C200]"
                />
                {/* BOTÃO SCANNER — abre overlay acima de tudo */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl border-[#F5C200]/40 hover:bg-[#F5C200]/10 hover:border-[#F5C200] text-[#F5C200]"
                  onClick={() => setScanningBarcode(true)}
                  title="Digitalizar com câmera"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              {form.barcode && (
                <div className="flex items-center gap-2 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-mono">{form.barcode}</span>
                </div>
              )}
            </div>

            {/* Preços */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Preços & IVA
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Preço s/IVA <span className="text-[#F5C200]">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">Kz</span>
                    <Input
                      type="number"
                      value={form.preco_unitario || ''}
                      onChange={e => setField('preco_unitario', Number(e.target.value))}
                      placeholder="0.00"
                      className="h-10 pl-8 rounded-xl border-border/60 focus:border-[#F5C200]"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Taxa IVA</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {IVA_OPTIONS.map(iva => (
                      <button
                        key={iva}
                        type="button"
                        onClick={() => setField('taxa_iva', iva)}
                        className={`h-10 rounded-lg text-xs font-black transition-all ${
                          form.taxa_iva === iva
                            ? 'bg-[#F5C200] text-black shadow-md shadow-[#F5C200]/30'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        {iva}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {form.preco_unitario > 0 && (
                <div className="p-4 rounded-xl bg-[#F5C200]/5 border border-[#F5C200]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Preço final c/ IVA {form.taxa_iva}%</p>
                      <p className="text-2xl font-black text-[#F5C200] font-mono mt-1">
                        {formatCurrency(precoComIva)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Valor IVA</p>
                      <p className="text-sm font-bold text-muted-foreground mt-1">
                        {formatCurrency(precoComIva - form.preco_unitario)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-[#F5C200] hover:bg-[#e6b800] text-black font-black border-0 shadow-md shadow-[#F5C200]/25 rounded-xl"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {editingId ? 'Guardar Alterações' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE DIALOG ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-base font-black">Eliminar produto?</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acção é irreversível. O produto será removido permanentemente do sistema.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="rounded-xl font-bold"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}