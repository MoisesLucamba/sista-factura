import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto, type Produto, type ProdutoInput } from '@/hooks/useProdutos';
import { formatCurrency, formatNumber } from '@/lib/format';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Package,
  Wrench,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Box,
  DollarSign,
  Hash,
  X,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Produtos() {
  const { data: produtos = [], isLoading } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'produto' as 'produto' | 'servico',
    preco_unitario: '',
    unidade: 'unidade',
    iva_incluido: false,
    taxa_iva: '14',
    stock: '',
    stock_minimo: '',
  });

  const filteredProdutos = produtos.filter((produto) => {
    const matchesSearch = 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'all' || produto.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const produtosCount = produtos.filter(p => p.tipo === 'produto').length;
  const servicosCount = produtos.filter(p => p.tipo === 'servico').length;
  const lowStockItems = produtos.filter(
    p => p.tipo === 'produto' && p.stock !== undefined && p.stock_minimo !== undefined && p.stock <= p.stock_minimo
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const produtoData: ProdutoInput = {
      codigo: formData.codigo,
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      tipo: formData.tipo,
      preco_unitario: parseFloat(formData.preco_unitario) || 0,
      unidade: formData.unidade,
      iva_incluido: formData.iva_incluido,
      taxa_iva: parseFloat(formData.taxa_iva) || 14,
      stock: formData.tipo === 'produto' ? parseInt(formData.stock) || undefined : undefined,
      stock_minimo: formData.tipo === 'produto' ? parseInt(formData.stock_minimo) || undefined : undefined,
    };

    try {
      if (editingProduto) {
        await updateProduto.mutateAsync({ id: editingProduto.id, ...produtoData });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduto.mutateAsync(produtoData);
        toast.success('Produto criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingProduto(null);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      tipo: 'produto',
      preco_unitario: '',
      unidade: 'unidade',
      iva_incluido: false,
      taxa_iva: '14',
      stock: '',
      stock_minimo: '',
    });
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao || '',
      tipo: produto.tipo,
      preco_unitario: produto.preco_unitario.toString(),
      unidade: produto.unidade,
      iva_incluido: produto.iva_incluido,
      taxa_iva: produto.taxa_iva.toString(),
      stock: produto.stock?.toString() || '',
      stock_minimo: produto.stock_minimo?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (produto: Produto) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!produtoToDelete) return;
    
    try {
      await deleteProduto.mutateAsync(produtoToDelete.id);
      toast.success('Produto eliminado com sucesso!');
      setDeleteDialogOpen(false);
      setProdutoToDelete(null);
    } catch (error) {
      toast.error('Erro ao eliminar produto');
    }
  };

  const clearFilters = () => {
    setTipoFilter('all');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Header with Gradient */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Produtos & Serviços
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Catálogo de produtos e serviços para faturação
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {filteredProdutos.length} {filteredProdutos.length === 1 ? 'item' : 'itens'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduto(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              >
                <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                Novo Item
                <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Box className="w-5 h-5 text-primary" />
                    </div>
                    {editingProduto ? 'Editar Item' : 'Novo Produto ou Serviço'}
                  </DialogTitle>
                  <DialogDescription>
                    Adicione produtos ou serviços ao seu catálogo para usar nas faturas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  {/* Tipo */}
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Tipo de Item
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: 'produto' | 'servico') =>
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produto">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Produto (físico, com stock)
                          </div>
                        </SelectItem>
                        <SelectItem value="servico">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Serviço (intangível)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Código e Nome */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="codigo" className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Código *
                      </Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                        placeholder="PROD001"
                        className="h-11 border-primary/20 font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label htmlFor="nome">Nome do Item *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome do produto ou serviço"
                        className="h-11 border-primary/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição detalhada (opcional)"
                      rows={3}
                      className="border-primary/20 resize-none"
                    />
                  </div>

                  {/* Preço, Unidade e IVA */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="preco_unitario" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Preço (Kz) *
                      </Label>
                      <Input
                        id="preco_unitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.preco_unitario}
                        onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                        placeholder="0.00"
                        className="h-11 border-primary/20"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Select
                        value={formData.unidade}
                        onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                      >
                        <SelectTrigger className="h-11 border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unidade">Unidade</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="metro">Metro</SelectItem>
                          <SelectItem value="visita">Visita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="taxa_iva">Taxa IVA</Label>
                      <Select
                        value={formData.taxa_iva}
                        onValueChange={(value) => setFormData({ ...formData, taxa_iva: value })}
                      >
                        <SelectTrigger className="h-11 border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">14% (Normal)</SelectItem>
                          <SelectItem value="7">7% (Reduzida)</SelectItem>
                          <SelectItem value="5">5% (Intermédia)</SelectItem>
                          <SelectItem value="2">2% (Mínima)</SelectItem>
                          <SelectItem value="0">0% (Isento)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* IVA Incluído */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/20">
                    <div className="flex flex-col">
                      <Label htmlFor="iva_incluido" className="cursor-pointer font-medium">
                        IVA incluído no preço
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        O preço informado já inclui o IVA
                      </span>
                    </div>
                    <Switch
                      id="iva_incluido"
                      checked={formData.iva_incluido}
                      onCheckedChange={(checked) => setFormData({ ...formData, iva_incluido: checked })}
                    />
                  </div>

                  {/* Stock (apenas para produtos) */}
                  {formData.tipo === 'produto' && (
                    <div className="p-5 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Label className="font-semibold text-base">Gestão de Stock</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pl-10">
                        <div className="grid gap-2">
                          <Label htmlFor="stock">Stock Atual</Label>
                          <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            placeholder="0"
                            className="h-11 border-primary/20"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                          <Input
                            id="stock_minimo"
                            type="number"
                            min="0"
                            value={formData.stock_minimo}
                            onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                            placeholder="0"
                            className="h-11 border-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="gradient-primary border-0"
                    disabled={createProduto.isPending || updateProduto.isPending}
                  >
                    {(createProduto.isPending || updateProduto.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingProduto ? 'Guardar Alterações' : 'Criar Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-blue-500 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Produtos</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {produtosCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-purple-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Serviços</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {servicosCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-orange-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Stock Baixo</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {lowStockItems.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="group relative mb-6 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-50 via-orange-50/50 to-transparent dark:from-orange-950/20 dark:via-orange-950/10 p-6 shadow-sm hover:shadow-md transition-all animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-transparent dark:from-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg text-orange-700 dark:text-orange-300 flex items-center gap-2">
                {lowStockItems.length} produto{lowStockItems.length > 1 ? 's' : ''} com stock baixo
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  Atenção necessária
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {lowStockItems.map(p => p.nome).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Search and Filters */}
      <Card className="card-shadow mb-6 border-primary/10 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 border-primary/20 focus:border-primary/40"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 border-primary/20">
                <SelectValue placeholder="Tipo de item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="produto">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Produtos
                  </div>
                </SelectItem>
                <SelectItem value="servico">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Serviços
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || tipoFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Products Table */}
      <Card className="card-shadow animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              Catálogo ({filteredProdutos.length} itens)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Produto / Serviço</TableHead>
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="text-right font-semibold">Preço</TableHead>
                  <TableHead className="text-center font-semibold">IVA</TableHead>
                  <TableHead className="hidden md:table-cell text-center font-semibold">Stock</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Box className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {searchTerm || tipoFilter !== 'all'
                              ? 'Nenhum produto encontrado.' 
                              : 'Ainda não tem produtos.'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm || tipoFilter !== 'all'
                              ? 'Tente ajustar os filtros de pesquisa.'
                              : 'Comece criando o seu primeiro item!'}
                          </p>
                        </div>
                        {!searchTerm && tipoFilter === 'all' && (
                          <Button onClick={() => setIsDialogOpen(true)} className="mt-2">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto, index) => {
                    const isLowStock = produto.tipo === 'produto' && 
                      produto.stock !== undefined && 
                      produto.stock_minimo !== undefined && 
                      produto.stock <= produto.stock_minimo;

                    return (
                      <TableRow 
                        key={produto.id} 
                        className="cursor-pointer hover:bg-muted/50 group transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform',
                              produto.tipo === 'produto' 
                                ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900' 
                                : 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900'
                            )}>
                              {produto.tipo === 'produto' ? (
                                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{produto.nome}</p>
                              {produto.descricao && (
                                <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                                  {produto.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {produto.codigo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(produto.preco_unitario)}</p>
                          <p className="text-xs text-muted-foreground">/{produto.unidade}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={Number(produto.taxa_iva) === 0 ? 'secondary' : 'default'} 
                            className="text-xs font-medium"
                          >
                            {produto.taxa_iva}% IVA
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          {produto.tipo === 'produto' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={cn(
                                'font-semibold text-sm',
                                isLowStock && 'text-orange-600 dark:text-orange-400'
                              )}>
                                {formatNumber(produto.stock || 0)}
                              </span>
                              {isLowStock && (
                                <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Baixo
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEdit(produto)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(produto)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirmar Eliminação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar <strong>{produtoToDelete?.nome}</strong>?
              Este item será removido do catálogo e não poderá ser usado em novas faturas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduto.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}