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
import { mockProdutos } from '@/lib/mock-data';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Produto } from '@/types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Package,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'produto' as 'produto' | 'servico',
    precoUnitario: '',
    unidade: 'unidade',
    ivaIncluido: false,
    taxaIva: '14',
    stock: '',
    stockMinimo: '',
  });

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduto) {
      setProdutos(produtos.map(p => 
        p.id === editingProduto.id 
          ? { 
              ...p, 
              ...formData,
              precoUnitario: parseFloat(formData.precoUnitario) || 0,
              taxaIva: parseFloat(formData.taxaIva) || 14,
              stock: formData.tipo === 'produto' ? parseInt(formData.stock) || undefined : undefined,
              stockMinimo: formData.tipo === 'produto' ? parseInt(formData.stockMinimo) || undefined : undefined,
              updatedAt: new Date() 
            }
          : p
      ));
    } else {
      const newProduto: Produto = {
        id: Date.now().toString(),
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao,
        tipo: formData.tipo,
        precoUnitario: parseFloat(formData.precoUnitario) || 0,
        unidade: formData.unidade,
        ivaIncluido: formData.ivaIncluido,
        taxaIva: parseFloat(formData.taxaIva) || 14,
        stock: formData.tipo === 'produto' ? parseInt(formData.stock) || undefined : undefined,
        stockMinimo: formData.tipo === 'produto' ? parseInt(formData.stockMinimo) || undefined : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProdutos([newProduto, ...produtos]);
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
      precoUnitario: '',
      unidade: 'unidade',
      ivaIncluido: false,
      taxaIva: '14',
      stock: '',
      stockMinimo: '',
    });
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao || '',
      tipo: produto.tipo,
      precoUnitario: produto.precoUnitario.toString(),
      unidade: produto.unidade,
      ivaIncluido: produto.ivaIncluido,
      taxaIva: produto.taxaIva.toString(),
      stock: produto.stock?.toString() || '',
      stockMinimo: produto.stockMinimo?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProdutos(produtos.filter(p => p.id !== id));
  };

  const lowStockItems = produtos.filter(
    p => p.tipo === 'produto' && p.stock !== undefined && p.stockMinimo !== undefined && p.stock <= p.stockMinimo
  );

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
                    <Label htmlFor="precoUnitario">Preço (Kz) *</Label>
                    <Input
                      id="precoUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precoUnitario}
                      onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
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
                    <Label htmlFor="taxaIva">IVA (%)</Label>
                    <Select
                      value={formData.taxaIva}
                      onValueChange={(value) => setFormData({ ...formData, taxaIva: value })}
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
                    <Label htmlFor="ivaIncluido" className="cursor-pointer">IVA incluído no preço</Label>
                    <span className="text-xs text-muted-foreground">O preço já inclui o IVA</span>
                  </div>
                  <Switch
                    id="ivaIncluido"
                    checked={formData.ivaIncluido}
                    onCheckedChange={(checked) => setFormData({ ...formData, ivaIncluido: checked })}
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
                      <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                      <Input
                        id="stockMinimo"
                        type="number"
                        min="0"
                        value={formData.stockMinimo}
                        onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
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
                <Button type="submit" className="gradient-primary border-0">
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
                {filteredProdutos.map((produto) => {
                  const isLowStock = produto.tipo === 'produto' && 
                    produto.stock !== undefined && 
                    produto.stockMinimo !== undefined && 
                    produto.stock <= produto.stockMinimo;

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
                        <Badge variant="secondary" className="font-mono">
                          {produto.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(produto.precoUnitario)}
                        <span className="text-xs text-muted-foreground ml-1">/{produto.unidade}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={produto.taxaIva === 0 ? 'secondary' : 'outline'}>
                          {produto.taxaIva}%
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        {produto.tipo === 'produto' ? (
                          <div className="flex items-center justify-center gap-1">
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                            <span className={cn(
                              'font-medium',
                              isLowStock && 'text-warning'
                            )}>
                              {formatNumber(produto.stock || 0)}
                            </span>
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
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
