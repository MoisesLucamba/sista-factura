import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { mockClientes, mockProdutos } from '@/lib/mock-data';
import { formatCurrency, generateInvoiceNumber, calculateIVA } from '@/lib/format';
import { Cliente, Produto, ItemFatura, TipoDocumento } from '@/types';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  FileText,
  Save,
  Send,
  Calculator,
  Building2,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NovaFatura() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoDocumento>('fatura');
  const [clienteId, setClienteId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<Partial<ItemFatura>[]>([]);
  const [dataVencimento, setDataVencimento] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const clienteSelecionado = mockClientes.find(c => c.id === clienteId);

  const addItem = () => {
    setItens([...itens, {
      id: Date.now().toString(),
      produtoId: '',
      quantidade: 1,
      precoUnitario: 0,
      desconto: 0,
      taxaIva: 14,
      subtotal: 0,
      valorIva: 0,
      total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    const item = { ...newItens[index], [field]: value };

    // If product changed, update price and IVA
    if (field === 'produtoId') {
      const produto = mockProdutos.find(p => p.id === value);
      if (produto) {
        item.produto = produto;
        item.precoUnitario = produto.precoUnitario;
        item.taxaIva = produto.taxaIva;
      }
    }

    // Recalculate totals
    const quantidade = item.quantidade || 0;
    const precoUnitario = item.precoUnitario || 0;
    const desconto = item.desconto || 0;
    const taxaIva = item.taxaIva || 14;

    const subtotalBruto = quantidade * precoUnitario;
    const valorDesconto = subtotalBruto * (desconto / 100);
    item.subtotal = subtotalBruto - valorDesconto;
    item.valorIva = calculateIVA(item.subtotal, taxaIva);
    item.total = item.subtotal + item.valorIva;

    newItens[index] = item;
    setItens(newItens);
  };

  const totais = useMemo(() => {
    const subtotal = itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const totalIva = itens.reduce((acc, item) => acc + (item.valorIva || 0), 0);
    const total = itens.reduce((acc, item) => acc + (item.total || 0), 0);
    return { subtotal, totalIva, total };
  }, [itens]);

  const handleSave = (emitir: boolean = false) => {
    if (!clienteId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    if (itens.some(item => !item.produtoId)) {
      toast.error('Preencha todos os itens');
      return;
    }

    // In real implementation, this would save to database
    toast.success(emitir ? 'Fatura emitida com sucesso!' : 'Rascunho guardado');
    navigate('/faturas');
  };

  const tipoLabels: Record<TipoDocumento, string> = {
    'fatura': 'Fatura',
    'fatura-recibo': 'Fatura-Recibo',
    'recibo': 'Recibo',
    'nota-credito': 'Nota de Crédito',
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/faturas">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              Nova Fatura
            </h1>
            <p className="text-muted-foreground mt-1">
              Criar novo documento fiscal
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Rascunho
          </Button>
          <Button className="gradient-primary border-0" onClick={() => handleSave(true)}>
            <Send className="w-4 h-4 mr-2" />
            Emitir Fatura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Type & Number */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={tipo} onValueChange={(v: TipoDocumento) => setTipo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input 
                    value={generateInvoiceNumber('FT', 4)}
                    disabled
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Input 
                    type="date" 
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input 
                    type="date" 
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Cliente *</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        <div className="flex items-center gap-2">
                          {cliente.tipo === 'empresa' ? (
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span>{cliente.nome}</span>
                          <span className="text-muted-foreground text-xs">
                            NIF: {cliente.nif}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clienteSelecionado && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {clienteSelecionado.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      NIF: {clienteSelecionado.nif}
                    </span>
                  </div>
                  <p className="font-medium">{clienteSelecionado.nome}</p>
                  <p className="text-sm text-muted-foreground">{clienteSelecionado.endereco}</p>
                  {clienteSelecionado.email && (
                    <p className="text-sm text-muted-foreground">{clienteSelecionado.email}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Itens da Fatura
                </CardTitle>
                <Button size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Produto/Serviço</TableHead>
                        <TableHead className="w-[100px]">Qtd.</TableHead>
                        <TableHead className="w-[120px]">Preço</TableHead>
                        <TableHead className="w-[80px]">Desc.</TableHead>
                        <TableHead className="w-[80px]">IVA</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.produtoId}
                              onValueChange={(v) => updateItem(index, 'produtoId', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mockProdutos.map((produto) => (
                                  <SelectItem key={produto.id} value={produto.id}>
                                    {produto.nome} - {formatCurrency(produto.precoUnitario)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precoUnitario}
                              onChange={(e) => updateItem(index, 'precoUnitario', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.desconto}
                                onChange={(e) => updateItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                                className="w-full pr-6"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                %
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.taxaIva}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total || 0)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observations */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas ou observações adicionais (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="card-shadow sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totais.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (14%)</span>
                  <span className="font-medium text-primary">{formatCurrency(totais.totalIva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold font-display">{formatCurrency(totais.total)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span>{itens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge variant="secondary">{tipoLabels[tipo]}</Badge>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full gradient-primary border-0" onClick={() => handleSave(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Emitir Fatura
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSave(false)}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Rascunho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
