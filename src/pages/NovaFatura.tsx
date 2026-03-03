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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreateFatura, type FaturaInput } from '@/hooks/useFaturas';
import { useAutoSendInvoice } from '@/hooks/useAutoSendInvoice';
import { formatCurrency, calculateIVA } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  FileText,
  Send,
  Calculator,
  Building2,
  User,
  Loader2,
  AlertTriangle,
  Search,
  CheckCircle,
  CreditCard,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type TipoDocumento = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito' | 'proforma';
type TipoCliente = 'consumidor_final' | 'empresa';

interface ItemLocal {
  id: string;
  produto_id: string;
  produto_nome?: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  taxa_iva: number;
  subtotal: number;
  valor_iva: number;
  total: number;
}

export default function NovaFatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { data: produtos = [], isLoading: loadingProdutos } = useProdutos();
  const createFatura = useCreateFatura();
  const createCliente = useCreateCliente();
  const { autoSend, isAutoSendEnabled } = useAutoSendInvoice();

  const [tipo, setTipo] = useState<TipoDocumento>('fatura');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('consumidor_final');
  const [clienteId, setClienteId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [dataVencimento, setDataVencimento] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // B2C inline fields
  const [cfNome, setCfNome] = useState('');
  const [cfNif, setCfNif] = useState('');
  const [cfEndereco, setCfEndereco] = useState('');

  // Faktura ID lookup
  const [useFakturaId, setUseFakturaId] = useState(false);
  const [fakturaIdInput, setFakturaIdInput] = useState('');
  const [buyerData, setBuyerData] = useState<{ user_id: string; nome: string; nif: string; telefone: string; email: string } | null>(null);
  const [lookingUpBuyer, setLookingUpBuyer] = useState(false);

  // B2B inline fields
  const [b2bNome, setB2bNome] = useState('');
  const [b2bNif, setB2bNif] = useState('');
  const [b2bEndereco, setB2bEndereco] = useState('');
  const [useExistingClient, setUseExistingClient] = useState(true);

  const clienteSelecionado = clientes.find(c => c.id === clienteId);
  const isProforma = tipo === 'proforma';

  const lookupBuyer = async () => {
    if (!fakturaIdInput.trim()) {
      toast.error('Digite o ID Faktura do comprador');
      return;
    }
    setLookingUpBuyer(true);
    try {
      const { data, error } = await supabase.rpc('lookup_buyer_by_faktura_id', {
        _faktura_id: fakturaIdInput.trim().toUpperCase(),
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const buyer = data[0] as { user_id: string; nome: string; nif: string; telefone: string; email: string };
        setBuyerData(buyer);
        setCfNome(buyer.nome || '');
        setCfNif(buyer.nif || '');
        toast.success('Comprador encontrado!');
      } else {
        setBuyerData(null);
        toast.error('Nenhum comprador encontrado com este ID');
      }
    } catch {
      toast.error('Erro ao procurar comprador');
    } finally {
      setLookingUpBuyer(false);
    }
  };

  const addItem = () => {
    setItens([...itens, {
      id: Date.now().toString(),
      produto_id: '',
      quantidade: 1,
      preco_unitario: 0,
      desconto: 0,
      taxa_iva: 14,
      subtotal: 0,
      valor_iva: 0,
      total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItens = [...itens];
    const item = { ...newItens[index], [field]: value };

    if (field === 'produto_id') {
      const produto = produtos.find(p => p.id === value);
      if (produto) {
        item.produto_nome = produto.nome;
        item.preco_unitario = Number(produto.preco_unitario);
        item.taxa_iva = Number(produto.taxa_iva);
      }
    }

    const quantidade = item.quantidade || 0;
    const precoUnitario = item.preco_unitario || 0;
    const desconto = item.desconto || 0;
    const taxaIva = item.taxa_iva || 14;

    const subtotalBruto = quantidade * precoUnitario;
    const valorDesconto = subtotalBruto * (desconto / 100);
    item.subtotal = subtotalBruto - valorDesconto;
    item.valor_iva = calculateIVA(item.subtotal, taxaIva);
    item.total = item.subtotal + item.valor_iva;

    newItens[index] = item;
    setItens(newItens);
  };

  const totais = useMemo(() => {
    const subtotal = itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const totalIva = itens.reduce((acc, item) => acc + (item.valor_iva || 0), 0);
    const total = itens.reduce((acc, item) => acc + (item.total || 0), 0);
    return { subtotal, totalIva, total };
  }, [itens]);

  const handleSave = async () => {
    // Validate items
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    if (itens.some(item => !item.produto_id)) {
      toast.error('Preencha todos os itens');
      return;
    }

    let finalClienteId = clienteId;

    if (tipoCliente === 'empresa') {
      if (useExistingClient) {
        if (!clienteId) {
          toast.error('Selecione um cliente empresa');
          return;
        }
      } else {
        // Validate B2B required fields
        if (!b2bNome.trim()) {
          toast.error('Nome da empresa é obrigatório');
          return;
        }
        if (!b2bNif.trim()) {
          toast.error('NIF é obrigatório para empresas');
          return;
        }
        // Create new B2B client
        try {
          const newClient = await createCliente.mutateAsync({
            nome: b2bNome.trim(),
            nif: b2bNif.trim(),
            endereco: b2bEndereco.trim() || 'N/A',
            tipo: 'empresa',
            whatsapp_consent: false,
            whatsapp_enabled: false,
          });
          finalClienteId = newClient.id;
        } catch {
          toast.error('Erro ao criar cliente empresa');
          return;
        }
      }
    } else {
      // Consumidor Final - create or find
      const nome = cfNome.trim() || 'Consumidor Final';
      const nif = cfNif.trim() || '999999999';
      const endereco = cfEndereco.trim() || 'N/A';

      // Check if there's already a "Consumidor Final" client
      const existingCf = clientes.find(
        c => c.nome === 'Consumidor Final' && c.nif === '999999999' && !cfNome.trim() && !cfNif.trim()
      );

      if (existingCf) {
        finalClienteId = existingCf.id;
      } else {
        try {
          const newClient = await createCliente.mutateAsync({
            nome,
            nif,
            endereco,
            tipo: 'particular',
            whatsapp_consent: false,
            whatsapp_enabled: false,
          });
          finalClienteId = newClient.id;
        } catch {
          toast.error('Erro ao criar cliente');
          return;
        }
      }
    }

    const faturaInput: FaturaInput = {
      tipo: isProforma ? 'proforma' as any : tipo,
      cliente_id: finalClienteId,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: dataVencimento,
      observacoes: isProforma
        ? `DOCUMENTO PROFORMA – NÃO VÁLIDO COMO DOCUMENTO FISCAL${observacoes ? '\n' + observacoes : ''}`
        : observacoes || undefined,
      metodo_pagamento: metodoPagamento || undefined,
      buyer_user_id: useFakturaId && buyerData ? buyerData.user_id : undefined,
      buyer_faktura_id: useFakturaId && buyerData ? fakturaIdInput.trim().toUpperCase() : undefined,
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        taxa_iva: item.taxa_iva,
        subtotal: item.subtotal,
        valor_iva: item.valor_iva,
        total: item.total,
      })),
    };

    try {
      const result = await createFatura.mutateAsync(faturaInput);
      
      const docLabel = isProforma ? 'Proforma' : 'Fatura';
      toast.success(`${docLabel} criada com sucesso!`, {
        description: `${docLabel} ${result.numero} foi emitida.`,
      });
      
      if (!isProforma && isAutoSendEnabled && result?.id) {
        autoSend(result.id);
      }
      
      navigate('/faturas');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erro ao criar documento');
    }
  };

  const tipoLabels: Record<TipoDocumento, string> = {
    'fatura': 'Fatura',
    'fatura-recibo': 'Fatura-Recibo',
    'recibo': 'Recibo',
    'nota-credito': 'Nota de Crédito',
    'proforma': 'Fatura Proforma',
  };

  const isLoading = loadingClientes || loadingProdutos;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const buttonLabel = isProforma ? 'Emitir Proforma' : 'Emitir Fatura';
  const canSubmit = !createFatura.isPending && itens.length > 0;

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
              {isProforma ? 'Nova Proforma' : 'Nova Fatura'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isProforma ? 'Criar documento proforma (não fiscal)' : 'Criar novo documento fiscal'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="gradient-primary border-0" 
            onClick={handleSave}
            disabled={!canSubmit}
          >
            {createFatura.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {buttonLabel}
          </Button>
        </div>
      </div>

      {/* Proforma Warning */}
      {isProforma && (
        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Documento Proforma</p>
            <p className="text-sm text-muted-foreground">
              Este documento NÃO é válido como documento fiscal. Utiliza numeração independente (PRO) e pode ser convertido em fatura oficial posteriormente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Type */}
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
                  <Label>Tipo de Documento *</Label>
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
                    value={isProforma ? 'PRO/... (gerado automaticamente)' : 'Gerado automaticamente'}
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

          {/* Client Type Selection */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Cliente Radio */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tipo de Cliente *</Label>
                <RadioGroup
                  value={tipoCliente}
                  onValueChange={(v: TipoCliente) => {
                    setTipoCliente(v);
                    setClienteId('');
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="consumidor_final" id="consumidor_final" />
                    <Label htmlFor="consumidor_final" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Consumidor Final
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="empresa" id="empresa" />
                    <Label htmlFor="empresa" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Empresa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Consumidor Final (B2C) */}
              {tipoCliente === 'consumidor_final' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Toggle: Manual vs Faktura ID */}
                  <div className="flex gap-3">
                    <Button
                      variant={!useFakturaId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setUseFakturaId(false); setBuyerData(null); }}
                    >
                      <User className="w-4 h-4 mr-1" />
                      Dados manuais
                    </Button>
                    <Button
                      variant={useFakturaId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseFakturaId(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      ID Faktura
                    </Button>
                  </div>

                  {useFakturaId ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Insira o ID Faktura do comprador para preencher automaticamente.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: FK-12345"
                          value={fakturaIdInput}
                          onChange={(e) => setFakturaIdInput(e.target.value.toUpperCase())}
                          className="font-mono"
                        />
                        <Button onClick={lookupBuyer} disabled={lookingUpBuyer} size="default">
                          {lookingUpBuyer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      </div>

                      {buyerData && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-fade-in">
                          <div className="flex items-center gap-2 text-primary">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-bold">Comprador encontrado</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Nome</Label>
                              <Input value={buyerData.nome || ''} disabled className="bg-muted font-medium" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">NIF</Label>
                              <Input value={buyerData.nif || 'N/A'} disabled className="bg-muted font-mono" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Telefone</Label>
                              <Input value={buyerData.telefone || 'N/A'} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <Input value={buyerData.email || 'N/A'} disabled className="bg-muted" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Todos os campos são opcionais. Se não preencher, será usado "Consumidor Final".
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome (opcional)</Label>
                          <Input
                            placeholder="Consumidor Final"
                            value={cfNome}
                            onChange={(e) => setCfNome(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>NIF (opcional)</Label>
                          <Input
                            placeholder="Deixar em branco"
                            value={cfNif}
                            onChange={(e) => setCfNif(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Endereço (opcional)</Label>
                        <Input
                          placeholder="Endereço do cliente"
                          value={cfEndereco}
                          onChange={(e) => setCfEndereco(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Empresa (B2B) */}
              {tipoCliente === 'empresa' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex gap-4">
                    <Button
                      variant={useExistingClient ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseExistingClient(true)}
                    >
                      Cliente existente
                    </Button>
                    <Button
                      variant={!useExistingClient ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseExistingClient(false)}
                    >
                      Novo cliente
                    </Button>
                  </div>

                  {useExistingClient ? (
                    <div className="space-y-2">
                      <Label>Selecionar Empresa *</Label>
                      <Select value={clienteId} onValueChange={setClienteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha uma empresa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.filter(c => c.tipo === 'empresa').length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground text-sm">
                              Nenhuma empresa cadastrada.
                              <Link to="/clientes" className="block text-primary mt-1">
                                Criar cliente
                              </Link>
                            </div>
                          ) : (
                            clientes.filter(c => c.tipo === 'empresa').map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span>{cliente.nome}</span>
                                  <span className="text-muted-foreground text-xs">
                                    NIF: {cliente.nif}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {clienteSelecionado && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Empresa</Badge>
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da Empresa *</Label>
                          <Input
                            placeholder="Nome da empresa"
                            value={b2bNome}
                            onChange={(e) => setB2bNome(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>NIF *</Label>
                          <Input
                            placeholder="NIF da empresa"
                            value={b2bNif}
                            onChange={(e) => setB2bNif(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Endereço</Label>
                        <Input
                          placeholder="Endereço da empresa"
                          value={b2bEndereco}
                          onChange={(e) => setB2bEndereco(e.target.value)}
                        />
                      </div>
                    </div>
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
                  Itens {isProforma ? 'da Proforma' : 'da Fatura'}
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
                              value={item.produto_id}
                              onValueChange={(v) => updateItem(index, 'produto_id', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {produtos.length === 0 ? (
                                  <div className="p-2 text-center text-muted-foreground text-sm">
                                    Nenhum produto cadastrado.
                                    <Link to="/produtos" className="block text-primary mt-1">
                                      Criar produto
                                    </Link>
                                  </div>
                                ) : (
                                  produtos.map((produto) => (
                                    <SelectItem key={produto.id} value={produto.id}>
                                      {produto.nome} - {formatCurrency(Number(produto.preco_unitario))}
                                    </SelectItem>
                                  ))
                                )}
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
                              value={item.preco_unitario}
                              onChange={(e) => updateItem(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
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
                            <Select
                              value={item.taxa_iva.toString()}
                              onValueChange={(v) => updateItem(index, 'taxa_iva', parseFloat(v))}
                            >
                              <SelectTrigger className="w-[90px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="14">14%</SelectItem>
                                <SelectItem value="7">7%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="2">2%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                              </SelectContent>
                            </Select>
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

          {/* Payment Method & Observations */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Detalhes Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                    <SelectItem value="Numerário">Numerário</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Multicaixa">Multicaixa</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Notas ou observações adicionais (opcional)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
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
                  <Badge variant={isProforma ? 'outline' : 'secondary'}>
                    {tipoLabels[tipo]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-right truncate max-w-[150px]">
                    {tipoCliente === 'consumidor_final'
                      ? (useFakturaId && buyerData ? buyerData.nome : (cfNome || 'Consumidor Final'))
                      : (useExistingClient ? clienteSelecionado?.nome || '—' : b2bNome || '—')}
                  </span>
                </div>
                {useFakturaId && buyerData && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Faktura</span>
                    <Badge variant="outline" className="font-mono text-xs">{fakturaIdInput}</Badge>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button 
                  className="w-full gradient-primary border-0" 
                  onClick={handleSave}
                  disabled={!canSubmit}
                >
                  {createFatura.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {buttonLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
