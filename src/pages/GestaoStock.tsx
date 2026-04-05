import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProdutos, useUpdateProduto, type Produto } from '@/hooks/useProdutos';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';
import { BarcodeInput } from '@/components/produtos/BarcodeScanner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Package, Loader2, ScanBarcode, AlertTriangle, TrendingDown,
  ClipboardCheck, History, BarChart3, ArrowUpDown, Plus, Minus,
  Search, Download, RefreshCw,
} from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';

interface StockMovement {
  id: string;
  user_id: string;
  produto_id: string;
  type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

function useStockMovements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!user,
  });
}

function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({ ...movement, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}

// ════════════════════════════════════════════════════
export default function GestaoStock() {
  const { data: produtos = [], isLoading } = useProdutos();
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements();
  const updateProduto = useUpdateProduto();
  const createMovement = useCreateStockMovement();

  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [adjustType, setAdjustType] = useState<'adjustment' | 'return' | 'count'>('adjustment');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [scanBarcode, setScanBarcode] = useState('');
  const [countResults, setCountResults] = useState<Map<string, number>>(new Map());

  const physicalProducts = useMemo(() =>
    produtos.filter(p => p.tipo === 'produto'),
    [produtos]
  );

  const lowStockProducts = useMemo(() =>
    physicalProducts.filter(p =>
      p.stock !== undefined && p.stock_minimo !== undefined && p.stock <= p.stock_minimo
    ),
    [physicalProducts]
  );

  const filteredProducts = useMemo(() =>
    physicalProducts.filter(p => {
      const s = search.toLowerCase();
      return p.nome.toLowerCase().includes(s) ||
        p.codigo.toLowerCase().includes(s) ||
        (p.barcode?.toLowerCase().includes(s) ?? false);
    }),
    [physicalProducts, search]
  );

  const handleScanForCount = useCallback((barcode: string) => {
    setScanBarcode(barcode);
    const product = physicalProducts.find(p => p.barcode === barcode);
    if (product) {
      const currentCount = countResults.get(product.id) || 0;
      setCountResults(prev => new Map(prev).set(product.id, currentCount + 1));
      toast.success(`${product.nome} — contado: ${currentCount + 1}`);
    } else {
      toast.error('Produto não encontrado no catálogo');
    }
  }, [physicalProducts, countResults]);

  const handleAdjust = (product: Produto) => {
    setSelectedProduct(product);
    setAdjustType('adjustment');
    setAdjustQty('');
    setAdjustNotes('');
    setAdjustDialog(true);
  };

  const handleSubmitAdjust = async () => {
    if (!selectedProduct || !adjustQty) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty)) return;

    const before = selectedProduct.stock ?? 0;
    const after = adjustType === 'count' ? qty : before + qty;

    try {
      await updateProduto.mutateAsync({ id: selectedProduct.id, stock: Math.max(0, after) });
      await createMovement.mutateAsync({
        produto_id: selectedProduct.id,
        type: adjustType,
        quantity_change: adjustType === 'count' ? after - before : qty,
        quantity_before: before,
        quantity_after: Math.max(0, after),
        reference: null,
        notes: adjustNotes || null,
      });
      toast.success('Stock atualizado!');
      setAdjustDialog(false);
    } catch {
      toast.error('Erro ao atualizar stock');
    }
  };

  const handleSaveCount = async () => {
    if (countResults.size === 0) {
      toast.error('Nenhum produto contado');
      return;
    }

    let updated = 0;
    for (const [productId, counted] of countResults) {
      const product = physicalProducts.find(p => p.id === productId);
      if (!product) continue;
      const before = product.stock ?? 0;
      try {
        await updateProduto.mutateAsync({ id: productId, stock: counted });
        await createMovement.mutateAsync({
          produto_id: productId,
          type: 'count',
          quantity_change: counted - before,
          quantity_before: before,
          quantity_after: counted,
          reference: null,
          notes: 'Contagem física',
        });
        updated++;
      } catch { /* continue */ }
    }
    toast.success(`${updated} produto(s) atualizado(s)`);
    setCountResults(new Map());
  };

  const discrepancies = useMemo(() => {
    if (countResults.size === 0) return [];
    return Array.from(countResults.entries())
      .map(([id, counted]) => {
        const product = physicalProducts.find(p => p.id === id);
        if (!product) return null;
        const recorded = product.stock ?? 0;
        return { product, counted, recorded, diff: counted - recorded };
      })
      .filter(Boolean)
      .filter(d => d!.diff !== 0) as { product: Produto; counted: number; recorded: number; diff: number }[];
  }, [countResults, physicalProducts]);

  if (isLoading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-amber-200/60 dark:border-amber-800/40
        bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50
        dark:from-amber-950/40 dark:via-orange-950/30 dark:to-stone-900
        p-6 shadow-lg shadow-amber-100/50">
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
              flex items-center justify-center shadow-lg shadow-amber-300/40">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-amber-950 dark:text-amber-50">Gestão de Stock</h1>
              <p className="text-amber-700/70 dark:text-amber-400/70 text-sm">
                Contagem, ajustes e histórico de movimentos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{physicalProducts.length}</p>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                <p className="text-xs text-muted-foreground">Stock Baixo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{movements.length}</p>
                <p className="text-xs text-muted-foreground">Movimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countResults.size}</p>
                <p className="text-xs text-muted-foreground">Contados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><Package className="w-4 h-4 mr-1.5" />Stock</TabsTrigger>
          <TabsTrigger value="count"><ScanBarcode className="w-4 h-4 mr-1.5" />Contagem</TabsTrigger>
          <TabsTrigger value="lowstock"><AlertTriangle className="w-4 h-4 mr-1.5" />Stock Baixo</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1.5" />Histórico</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Todos os Produtos</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Pesquisar..."
                      className="pl-9 h-9 w-48"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    exportToCSV(
                      filteredProducts.map(p => ({
                        codigo: p.codigo, nome: p.nome,
                        stock: p.stock ?? 'N/A', stock_min: p.stock_minimo ?? 'N/A',
                        barcode: p.barcode ?? '',
                      })),
                      [
                        { key: 'codigo', label: 'Código' }, { key: 'nome', label: 'Nome' },
                        { key: 'stock', label: 'Stock' }, { key: 'stock_min', label: 'Mínimo' },
                        { key: 'barcode', label: 'Código Barras' },
                      ],
                      'stock-report'
                    );
                    toast.success('Relatório exportado!');
                  }}>
                    <Download className="w-4 h-4 mr-1" />CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Mínimo</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => {
                      const isLow = p.stock !== undefined && p.stock_minimo !== undefined && p.stock <= p.stock_minimo;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{p.nome}</p>
                              <p className="text-xs text-muted-foreground">{p.codigo}{p.barcode ? ` · ${p.barcode}` : ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">{p.stock ?? '—'}</TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">{p.stock_minimo ?? '—'}</TableCell>
                          <TableCell className="text-center">
                            {p.stock === undefined ? (
                              <Badge variant="outline" className="text-xs">Sem stock</Badge>
                            ) : isLow ? (
                              <Badge variant="destructive" className="text-xs">Baixo</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleAdjust(p)}>
                              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />Ajustar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COUNT TAB ─── */}
        <TabsContent value="count">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5" />Contagem Física
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Digitalize os códigos de barras dos produtos para contar o stock físico.
                  Cada scan adiciona +1 à contagem.
                </p>
                <BarcodeInput
                  value={scanBarcode}
                  onChange={setScanBarcode}
                  onProductFound={() => {
                    if (scanBarcode.length >= 8) handleScanForCount(scanBarcode);
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (scanBarcode) handleScanForCount(scanBarcode);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1.5" />Adicionar à contagem
                </Button>

                {countResults.size > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-semibold">{countResults.size} produto(s) contado(s)</p>
                    {Array.from(countResults.entries()).map(([id, count]) => {
                      const p = physicalProducts.find(x => x.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                          <span className="font-medium">{p?.nome || id}</span>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                              setCountResults(prev => {
                                const m = new Map(prev);
                                const v = (m.get(id) || 1) - 1;
                                if (v <= 0) m.delete(id);
                                else m.set(id, v);
                                return m;
                              });
                            }}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-mono font-bold w-8 text-center">{count}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                              setCountResults(prev => new Map(prev).set(id, (prev.get(id) || 0) + 1));
                            }}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Button onClick={handleSaveCount} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <ClipboardCheck className="w-4 h-4 mr-1.5" />Guardar Contagem
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setCountResults(new Map())}>
                      <RefreshCw className="w-4 h-4 mr-1.5" />Limpar Contagem
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discrepancies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />Discrepâncias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discrepancies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      {countResults.size === 0
                        ? 'Inicie uma contagem para detectar discrepâncias'
                        : 'Sem discrepâncias detectadas 🎉'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {discrepancies.map(d => (
                      <div key={d.product.id} className={cn(
                        'p-3 rounded-xl border text-sm',
                        d.diff < 0 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                      )}>
                        <p className="font-semibold">{d.product.nome}</p>
                        <div className="flex justify-between mt-1 text-xs">
                          <span>Registado: {d.recorded}</span>
                          <span>Contado: {d.counted}</span>
                          <span className={cn('font-bold', d.diff < 0 ? 'text-red-600' : 'text-green-600')}>
                            {d.diff > 0 ? '+' : ''}{d.diff}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── LOW STOCK TAB ─── */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Produtos com Stock Baixo ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Todos os produtos têm stock suficiente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20">
                      <div>
                        <p className="font-medium text-sm">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: <span className="text-red-600 font-bold">{p.stock}</span> / Mínimo: {p.stock_minimo}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleAdjust(p)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />Repor
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── HISTORY TAB ─── */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />Histórico de Movimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sem movimentos registados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Variação</TableHead>
                        <TableHead className="text-center">Antes → Depois</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map(m => {
                        const p = physicalProducts.find(x => x.id === m.produto_id);
                        const typeLabels: Record<string, string> = {
                          sale: 'Venda', adjustment: 'Ajuste', return: 'Devolução', count: 'Contagem',
                        };
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(m.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="font-medium text-sm">{p?.nome || 'Produto removido'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[m.type] || m.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn('font-mono font-bold text-sm',
                                m.quantity_change > 0 ? 'text-green-600' : m.quantity_change < 0 ? 'text-red-600' : ''
                              )}>
                                {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground font-mono">
                              {m.quantity_before} → {m.quantity_after}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                              {m.notes || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Adjust Dialog ─── */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock — {selectedProduct?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Stock atual: <span className="font-bold text-foreground">{selectedProduct?.stock ?? 0}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select value={adjustType} onValueChange={v => setAdjustType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Ajuste manual (+/-)</SelectItem>
                  <SelectItem value="return">Devolução (+)</SelectItem>
                  <SelectItem value="count">Contagem (valor absoluto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{adjustType === 'count' ? 'Quantidade real contada' : 'Quantidade (+/-)'}</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                placeholder={adjustType === 'count' ? 'Ex: 45' : 'Ex: +10 ou -5'}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={adjustNotes}
                onChange={e => setAdjustNotes(e.target.value)}
                placeholder="Razão do ajuste..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitAdjust}
              disabled={!adjustQty || updateProduto.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            >
              {updateProduto.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
