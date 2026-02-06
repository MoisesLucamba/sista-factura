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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function Produtos() {
  const { data: produtos = [], isLoading } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);

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

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (editingProduto) {
      await updateProduto.mutateAsync({ id: editingProduto.id, ...produtoData });
    } else {
      await createProduto.mutateAsync(produtoData);
    }

    setIsDialogOpen(false);
    setEditingProduto(null);
    resetForm();
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

  const handleDelete = async (id: string) => {
    await deleteProduto.mutateAsync(id);
  };

  const lowStockItems = produtos.filter(
    p => p.tipo === 'produto' && p.stock !== undefined && p.stock_minimo !== undefined && p.stock <= p.stock_minimo
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            Produtos & Serviços
          </h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de produtos e serviços para faturação
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduto(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingProduto ? 'Editar Item' : 'Novo Produto ou Serviço'}
                </DialogTitle>
                <DialogDescription>
                  Adicione produtos ou serviços ao seu catálogo para usar nas faturas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'produto' | 'servico') =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Produto
                        </div>
                      </SelectItem>
                      <SelectItem value="servico">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Serviço
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      placeholder="PROD001"
                      required
                    />
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do produto ou serviço"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição detalhada (opcional)"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preco_unitario">Preço (Kz) *</Label>
                    <Input
                      id="preco_unitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.preco_unitario}
                      onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select
                      value={formData.unidade}
                      onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="taxa_iva">IVA (%)</Label>
                    <Select
                      value={formData.taxa_iva}
                      onValueChange={(value) => setFormData({ ...formData, taxa_iva: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14">14% (Normal)</SelectItem>
                        <SelectItem value="0">0% (Isento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-col">
                    <Label htmlFor="iva_incluido" className="cursor-pointer">IVA incluído no preço</Label>
                    <span className="text-xs text-muted-foreground">O preço já inclui o IVA</span>
                  </div>
                  <Switch
                    id="iva_incluido"
                    checked={formData.iva_incluido}
                    onCheckedChange={(checked) => setFormData({ ...formData, iva_incluido: checked })}
                  />
                </div>

                {formData.tipo === 'produto' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock Atual</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0"
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
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                  {editingProduto ? 'Guardar' : 'Criar Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-warning-foreground">
              {lowStockItems.length} produto(s) com stock baixo
            </p>
            <p className="text-sm text-muted-foreground">
              {lowStockItems.map(p => p.nome).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="card-shadow mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="produto">Produtos</SelectItem>
                <SelectItem value="servico">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">
            Catálogo ({filteredProdutos.length} itens)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto / Serviço</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">IVA</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Stock</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum produto encontrado.' : 'Ainda não tem produtos. Crie o primeiro!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto) => {
                    const isLowStock = produto.tipo === 'produto' && 
                      produto.stock !== undefined && 
                      produto.stock_minimo !== undefined && 
                      produto.stock <= produto.stock_minimo;

                    return (
                      <TableRow key={produto.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                              produto.tipo === 'produto' ? 'bg-primary/10' : 'bg-secondary'
                            )}>
                              {produto.tipo === 'produto' ? (
                                <Package className="w-5 h-5 text-primary" />
                              ) : (
                                <Wrench className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{produto.nome}</p>
                              {produto.descricao && (
                                <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                                  {produto.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {produto.codigo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold">{formatCurrency(produto.preco_unitario)}</p>
                          <p className="text-xs text-muted-foreground">/{produto.unidade}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={Number(produto.taxa_iva) === 0 ? 'secondary' : 'default'} className="text-xs">
                            {produto.taxa_iva}%
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          {produto.tipo === 'produto' ? (
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                'font-medium',
                                isLowStock && 'text-destructive'
                              )}>
                                {formatNumber(produto.stock || 0)}
                              </span>
                              {isLowStock && (
                                <AlertTriangle className="w-3 h-3 text-destructive" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(produto)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(produto.id)}
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
    </MainLayout>
  );
}
