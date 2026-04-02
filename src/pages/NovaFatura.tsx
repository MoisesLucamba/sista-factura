import { useState, useMemo, useRef } from 'react';
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
  QrCode,
  Camera,
  X,
  Download,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import React from 'react';

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

interface ClienteDataFromQR {
  nome: string;
  nif: string;
  endereco?: string;
  email?: string;
  telefone?: string;
}

export default function NovaFatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { data: produtos = [], isLoading: loadingProdutos } = useProdutos();
  const createFatura = useCreateFatura();
  const createCliente = useCreateCliente();
  const { autoSend, isAutoSendEnabled } = useAutoSendInvoice();

  // QR Code Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // QR Code Generator state
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const [tipo, setTipo] = useState<TipoDocumento>('fatura');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('consumidor_final');
  const [clienteId, setClienteId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [dataVencimento, setDataVencimento] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notaCreditoRef, setNotaCreditoRef] = useState('');

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


  // ============ QR CODE SCANNER FUNCTIONS ============
  const initializeQRScanner = () => {
    if (qrScannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          // Tenta fazer parse do QR code como JSON com dados do cliente
          const clienteData: ClienteDataFromQR = JSON.parse(decodedText);
          
          // Preenche os campos com os dados do cliente
          if (clienteData.nome) setCfNome(clienteData.nome);
          if (clienteData.nif) setCfNif(clienteData.nif);
          if (clienteData.endereco) setCfEndereco(clienteData.endereco);

          toast.success('Dados do cliente capturados com sucesso!');
          setShowQRScanner(false);
          scanner.clear();
          qrScannerRef.current = null;
          setQrScannerActive(false);
        } catch {
          // Se não for JSON, trata como texto simples (NIF ou ID)
          toast.info(`QR Code lido: ${decodedText}`);
        }
      },
      (error) => {
        console.warn('QR Code scan error:', error);
      }
    );

    qrScannerRef.current = scanner;
    setQrScannerActive(true);
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setQrScannerActive(false);
    setShowQRScanner(false);
  };

  // ============ QR CODE GENERATOR FUNCTIONS ============
  const generateQRCodeData = () => {
    // Cria um objeto com os dados da fatura para o QR code
    const qrData = {
      tipo: tipo,
      cliente: {
        nome: cfNome || 'Consumidor Final',
        nif: cfNif || '999999999',
        endereco: cfEndereco || 'N/A',
      },
      itens: itens.map(item => ({
        nome: item.produto_nome,
        quantidade: item.quantidade,
        preco: item.preco_unitario,
      })),
      totais: totais,
      metodo_pagamento: metodoPagamento,
      data_vencimento: dataVencimento,
    };
    return JSON.stringify(qrData);
  };

  const downloadQRCode = async () => {
    try {
      const qrData = generateQRCodeData();
      if (qrCodeRef.current) {
        // Create a temporary canvas element for QR generation
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, qrData, {
          width: 256,
          margin: 1,
          errorCorrectionLevel: 'H',
        });
        const link = document.createElement('a');
        link.href = tempCanvas.toDataURL('image/png');
        link.download = `fatura-qrcode-${new Date().getTime()}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Erro ao descarregar QR Code:', err);
      toast.error('Erro ao descarregar QR Code');
    }
  };

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

  // Render QR Code when showQRGenerator changes
  React.useEffect(() => {
    if (showQRGenerator && qrCodeRef.current && itens.length > 0) {
      const qrData = generateQRCodeData();
      QRCode.toCanvas(qrCodeRef.current, qrData, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'H',
      }).catch((err) => {
        console.error('Erro ao gerar QR Code:', err);
      });
    }
  }, [showQRGenerator, itens, cfNome, cfNif, cfEndereco, totais, metodoPagamento, dataVencimento]);

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
    if (tipo === 'nota-credito' && !notaCreditoRef.trim()) {
      toast.error('A referência à fatura original é obrigatória para notas de crédito');
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
        : tipo === 'nota-credito'
          ? `Ref. documento original: ${notaCreditoRef.trim()}${observacoes ? '\n' + observacoes : ''}`
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
    } catch {
      toast.error('Erro ao criar fatura');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/faturas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold">Nova Fatura</h1>
              <p className="text-muted-foreground">Crie uma nova fatura ou documento fiscal</p>
            </div>
          </div>
        </div>

        {/* Tipo de Documento */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Tipo de Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={tipo} onValueChange={(value) => setTipo(value as TipoDocumento)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {(['fatura', 'fatura-recibo', 'recibo', 'nota-credito', 'proforma'] as TipoDocumento[]).map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <RadioGroupItem value={t} id={`tipo-${t}`} />
                    <Label htmlFor={`tipo-${t}`} className="cursor-pointer capitalize">
                      {t.replace('-', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Cliente Section */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Cliente
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRScanner(!showQRScanner)}
                  className="gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showQRScanner ? 'Fechar Scanner' : 'Ler QR Code'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Scanner Section */}
            {showQRScanner && (
              <div className="border border-dashed border-primary rounded-lg p-4 space-y-3 bg-primary/5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-semibold">Leitor de QR Code</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={stopQRScanner}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div id="qr-reader" className="w-full"></div>
                {!qrScannerActive && (
                  <Button
                    onClick={initializeQRScanner}
                    className="w-full"
                    size="sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Scanner
                  </Button>
                )}
              </div>
            )}

            {/* Tipo Cliente Selection */}
            <div className="flex gap-4">
              <Button
                variant={tipoCliente === 'consumidor_final' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoCliente('consumidor_final')}
              >
                <User className="w-4 h-4 mr-1" />
                Consumidor Final
              </Button>
              <Button
                variant={tipoCliente === 'empresa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoCliente('empresa')}
              >
                <Building2 className="w-4 h-4 mr-1" />
                Empresa
              </Button>
            </div>

            {/* Consumidor Final (B2C) */}
            {tipoCliente === 'consumidor_final' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-4">
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
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Desconto %</TableHead>
                      <TableHead className="text-right">IVA %</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select value={item.produto_id} onValueChange={(value) => updateItem(index, 'produto_id', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantidade}
                            onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.preco_unitario}
                            onChange={(e) => updateItem(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.desconto}
                            onChange={(e) => updateItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.taxa_iva}
                            onChange={(e) => updateItem(index, 'taxa_iva', parseFloat(e.target.value) || 14)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.valor_iva)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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

        {/* Totals */}
        {itens.length > 0 && (
          <Card className="card-shadow bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-2xl font-bold font-mono">{formatCurrency(totais.subtotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">IVA Total</p>
                  <p className="text-2xl font-bold font-mono text-orange-600">{formatCurrency(totais.totalIva)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(totais.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-display">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipo === 'nota-credito' && (
              <div className="space-y-2">
                <Label>Referência à Fatura Original *</Label>
                <Input
                  placeholder="Número da fatura original"
                  value={notaCreditoRef}
                  onChange={(e) => setNotaCreditoRef(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Adicione observações ou notas adicionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* QR Code Generator Section */}
        {itens.length > 0 && (
          <Card className="card-shadow border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Gerar QR Code da Fatura
                </CardTitle>
                <Button
                  variant={showQRGenerator ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowQRGenerator(!showQRGenerator)}
                  className="gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showQRGenerator ? 'Ocultar' : 'Mostrar'} QR Code
                </Button>
              </div>
            </CardHeader>
            {showQRGenerator && (
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O QR Code contém os dados da fatura (cliente, itens, totais) e pode ser compartilhado com o cliente para leitura.
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border border-dashed">
                  <div ref={qrCodeRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* QR Code será renderizado aqui via canvas */}
                  </div>
                </div>
                <Button
                  onClick={downloadQRCode}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Descarregar QR Code
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link to="/faturas">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={createFatura.isPending}
            className="gap-2"
          >
            {createFatura.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isProforma ? 'Criar Proforma' : 'Criar Fatura'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
