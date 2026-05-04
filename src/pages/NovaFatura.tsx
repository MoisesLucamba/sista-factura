import { useState, useMemo, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreateFatura, type FaturaInput } from '@/hooks/useFaturas';
import { useAutoSendInvoice } from '@/hooks/useAutoSendInvoice';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { formatCurrency, calculateIVA } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { CURRENCIES, TAX_EXEMPTION_CODES } from '@/lib/agt-constants';
import {
  ArrowLeft, Plus, Trash2, FileText, Loader2, Search, CheckCircle,
  CreditCard, QrCode, Camera, X, Edit, User, Building2,
  Wallet, Smartphone, Banknote, Building, Clock, Send,
  Sparkles, Receipt, FileCheck, FileMinus, FilePlus, Save, Eye,
  ShoppingBag, ScanBarcode, Percent, Globe,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

type TipoDocumento = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito' | 'nota-debito';
type BuyerTab = 'faktura-id' | 'qr' | 'anonimo';
type AnonMode = 'consumidor_final' | 'nif_manual';

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
  tax_exemption_code?: string;
  tax_exemption_reason?: string;
}

export default function NovaFatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const { data: agtConfig } = useAgtConfig();
  const createFatura = useCreateFatura();
  const createCliente = useCreateCliente();
  const { autoSend, isAutoSendEnabled } = useAutoSendInvoice();

  // State
  const [buyerTab, setBuyerTab] = useState<BuyerTab>('faktura-id');
  const [tipo, setTipo] = useState<TipoDocumento>('fatura');
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataVencimento, setDataVencimento] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notaCreditoRef, setNotaCreditoRef] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState('');
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');

  // AGT: desconto global, moeda, taxa câmbio
  const [descontoGlobal, setDescontoGlobal] = useState<number>(0);
  const [moeda, setMoeda] = useState<string>('AOA');
  const [taxaCambio, setTaxaCambio] = useState<number>(1);

  // Buyer ID states
  const [digits, setDigits] = useState('');
  const [buyerData, setBuyerData] = useState<{ user_id: string; nome: string; nif: string; telefone: string; email: string } | null>(null);
  const [lookingUpBuyer, setLookingUpBuyer] = useState(false);
  const digitsRef = useRef<HTMLInputElement>(null);

  // Anonymous states
  const [anonMode, setAnonMode] = useState<AnonMode>('consumidor_final');
  const [manualNif, setManualNif] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualEndereco, setManualEndereco] = useState('');

  // QR scanner
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const merchantName = agtConfig?.nome_empresa || 'Minha Empresa';
  const merchantFakturaId = ''; // Will come from profile

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }
    };
  }, []);

  // Auto-lookup buyer when 6 digits entered
  useEffect(() => {
    if (digits.length === 6 && buyerTab === 'faktura-id') {
      lookupBuyer();
    }
  }, [digits]);

  const handleDigitsChange = (value: string) => {
    const fullMatch = value.match(/FK-244-(\d{1,6})/i);
    if (fullMatch) {
      setDigits(fullMatch[1].slice(0, 6));
      return;
    }
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setDigits(cleaned);
  };

  const lookupBuyer = async () => {
    if (digits.length !== 6) return;
    setLookingUpBuyer(true);
    setBuyerData(null);
    try {
      const fakturaId = `FK-244-${digits}`;
      const { data, error } = await supabase.rpc('lookup_buyer_by_faktura_id', {
        _faktura_id: fakturaId,
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const buyer = data[0] as { user_id: string; nome: string; nif: string; telefone: string; email: string };
        setBuyerData(buyer);
        toast.success('Comprador identificado!');
      } else {
        toast.error('ID não encontrado. Verifica os dígitos.');
      }
    } catch {
      toast.error('Erro ao procurar comprador');
    } finally {
      setLookingUpBuyer(false);
    }
  };

  const initQRScanner = () => {
    if (qrScannerRef.current) return;
    setQrScannerActive(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'buyer-qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.faktura_id) {
              const match = parsed.faktura_id.match(/FK-244-(\d{6})/);
              if (match) {
                setDigits(match[1]);
                setBuyerTab('faktura-id');
              }
            }
          } catch {
            const match = decodedText.match(/FK-244-(\d{6})/);
            if (match) {
              setDigits(match[1]);
              setBuyerTab('faktura-id');
            }
          }
          scanner.clear();
          qrScannerRef.current = null;
          setQrScannerActive(false);
          toast.success('QR lido com sucesso!');
        },
        () => {}
      );
      qrScannerRef.current = scanner;
    }, 100);
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setQrScannerActive(false);
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

  const addProductById = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    // Check if product already in cart
    const existingIndex = itens.findIndex(i => i.produto_id === produtoId);
    if (existingIndex >= 0) {
      updateItem(existingIndex, 'quantidade', itens[existingIndex].quantidade + 1);
      toast.success(`${produto.nome} — quantidade atualizada`);
      return;
    }

    const preco = Number(produto.preco_unitario);
    const taxa = Number(produto.taxa_iva);
    const subtotal = preco;
    const valorIva = calculateIVA(subtotal, taxa);

    setItens(prev => [...prev, {
      id: Date.now().toString(),
      produto_id: produtoId,
      produto_nome: produto.nome,
      quantidade: 1,
      preco_unitario: preco,
      desconto: 0,
      taxa_iva: taxa,
      subtotal,
      valor_iva: valorIva,
      total: subtotal + valorIva,
    }]);
    setProductSearch('');
    toast.success(`${produto.nome} adicionado`);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
    if (editingItemIndex === index) setEditingItemIndex(null);
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
    const subtotalItens = itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    const desconto = itens.reduce((acc, item) => {
      const bruto = (item.quantidade || 0) * (item.preco_unitario || 0);
      return acc + bruto * ((item.desconto || 0) / 100);
    }, 0);
    const totalIvaItens = itens.reduce((acc, item) => acc + (item.valor_iva || 0), 0);
    const totalItens = itens.reduce((acc, item) => acc + (item.total || 0), 0);
    // AGT REGRA 5: desconto global aplicado sobre o total
    const descontoGlobalValor = totalItens * ((descontoGlobal || 0) / 100);
    const total = totalItens - descontoGlobalValor;
    return { subtotal: subtotalItens, desconto, totalIva: totalIvaItens, total, descontoGlobalValor };
  }, [itens, descontoGlobal]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return produtos.slice(0, 10);
    const q = productSearch.toLowerCase();
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 10);
  }, [productSearch, produtos]);

  const handleEmit = async () => {
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um produto');
      return;
    }
    if (itens.some(item => !item.produto_id)) {
      toast.error('Todos os itens devem ter um produto selecionado');
      return;
    }
    if ((tipo === 'nota-credito' || tipo === 'nota-debito') && !notaCreditoRef.trim()) {
      toast.error('Referência ao documento original é obrigatória');
      return;
    }

    // Resolve client
    let finalClienteId = '';

    if (buyerTab === 'faktura-id' && buyerData) {
      // Use buyer data to create/find client
      const existing = clientes.find(c => c.nif === buyerData.nif && c.nif !== '999999999');
      if (existing) {
        finalClienteId = existing.id;
      } else {
        try {
          const newClient = await createCliente.mutateAsync({
            nome: buyerData.nome || 'Consumidor Final',
            nif: buyerData.nif || '999999999',
            endereco: 'N/A',
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
    } else if (buyerTab === 'anonimo' && anonMode === 'nif_manual' && manualNif.trim()) {
      try {
        const newClient = await createCliente.mutateAsync({
          nome: manualNome.trim() || 'Consumidor Final',
          nif: manualNif.trim(),
          endereco: manualEndereco.trim() || 'N/A',
          tipo: 'particular',
          whatsapp_consent: false,
          whatsapp_enabled: false,
        });
        finalClienteId = newClient.id;
      } catch {
        toast.error('Erro ao criar cliente');
        return;
      }
    } else {
      // Anonymous - find or create "Consumidor Final"
      const existingCf = clientes.find(c => c.nome === 'Consumidor Final' && c.nif === '999999999');
      if (existingCf) {
        finalClienteId = existingCf.id;
      } else {
        try {
          const newClient = await createCliente.mutateAsync({
            nome: 'Consumidor Final',
            nif: '999999999',
            endereco: 'N/A',
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
      tipo: tipo as any,
      cliente_id: finalClienteId,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: dataVencimento,
      observacoes: (tipo === 'nota-credito' || tipo === 'nota-debito')
        ? `Ref. documento original: ${notaCreditoRef.trim()}${observacoes ? '\n' + observacoes : ''}`
        : observacoes || undefined,
      metodo_pagamento: metodoPagamento || undefined,
      buyer_user_id: buyerTab === 'faktura-id' && buyerData ? buyerData.user_id : undefined,
      buyer_faktura_id: buyerTab === 'faktura-id' && buyerData ? `FK-244-${digits}` : undefined,
      desconto_global: descontoGlobal || 0,
      moeda,
      taxa_cambio: taxaCambio || 1,
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        taxa_iva: item.taxa_iva,
        subtotal: item.subtotal,
        valor_iva: item.valor_iva,
        total: item.total,
        tax_exemption_code: item.taxa_iva === 0 ? (item.tax_exemption_code || undefined) : undefined,
        tax_exemption_reason: item.taxa_iva === 0 ? (item.tax_exemption_reason || undefined) : undefined,
      })),
    };

    try {
      const result = await createFatura.mutateAsync(faturaInput);
      setCreatedInvoiceNumber(result.numero);
      setCreatedInvoiceId(result.id);
      setShowSuccess(true);

      if (isAutoSendEnabled && result?.id) {
        autoSend(result.id);
      }
    } catch {
      toast.error('Erro ao emitir fatura');
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setItens([]);
    setDigits('');
    setBuyerData(null);
    setMetodoPagamento('');
    setObservacoes('');
    setManualNif('');
    setManualNome('');
    setManualEndereco('');
    setCreatedInvoiceNumber('');
    setCreatedInvoiceId('');
  };

  // Document type config
  const docTypes: { value: TipoDocumento; label: string; icon: React.ElementType }[] = [
    { value: 'fatura', label: 'Fatura', icon: FileText },
    { value: 'fatura-recibo', label: 'Fatura-Recibo', icon: FileCheck },
    { value: 'recibo', label: 'Recibo', icon: Receipt },
    { value: 'nota-credito', label: 'Nota de Crédito', icon: FileMinus },
    { value: 'nota-debito', label: 'Nota de Débito', icon: FilePlus },
  ];

  const paymentMethods = [
    { value: 'faktura_wallet', label: 'Faktura Wallet', icon: Wallet },
    { value: 'multicaixa', label: 'Multicaixa Express', icon: Smartphone },
    { value: 'dinheiro', label: 'Numerário', icon: Banknote },
    { value: 'transferencia', label: 'Transferência', icon: Building },
    { value: 'credito', label: 'Crédito / A prazo', icon: Clock },
  ];

  // ============ SUCCESS SCREEN ============
  if (showSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md w-full space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-1">Fatura Emitida!</h2>
              <p className="text-muted-foreground text-sm">
                Documento <span className="font-mono font-bold text-foreground">{createdInvoiceNumber}</span> criado com sucesso.
              </p>
            </div>
            {buyerData && (
              <p className="text-sm text-primary font-semibold">
                ✓ Fatura enviada automaticamente para FK-244-{digits}
              </p>
            )}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{formatCurrency(totais.total)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">-1kz deduzido do teu saldo de faturas</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => navigate('/faturas')} className="gap-2">
                <FileText className="w-4 h-4" />
                Ver Faturas
              </Button>
              <Button variant="outline" onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(`Fatura ${createdInvoiceNumber} — ${formatCurrency(totais.total)}`)}`;
                window.open(url, '_blank');
              }} className="gap-2">
                <Send className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
            <Button onClick={resetForm} className="w-full gap-2 font-bold">
              <Plus className="w-4 h-4" />
              Nova Fatura
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-4 md:py-6 space-y-5 max-w-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Link to="/faturas">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Nova Fatura</h1>
            {agtConfig?.nome_empresa && (
              <p className="text-xs text-muted-foreground truncate">{merchantName}</p>
            )}
          </div>
        </div>

        {/* ── SECTION 1: Buyer Identification ── */}
        <Card className="overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-bold mb-3">Identificar comprador</p>
            <div className="flex gap-2">
              {([
                { key: 'faktura-id' as BuyerTab, icon: CreditCard, label: 'Faktura ID' },
                { key: 'qr' as BuyerTab, icon: Camera, label: 'QR' },
                { key: 'anonimo' as BuyerTab, icon: User, label: 'Anón.' },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setBuyerTab(key);
                    if (key !== 'qr') stopQRScanner();
                    if (key === 'qr') initQRScanner();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    buyerTab === key
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="pt-3">
            {/* Tab: Faktura ID */}
            {buyerTab === 'faktura-id' && (
              <div className="space-y-3 animate-fade-in">
                <div
                  className="flex items-center h-12 rounded-xl border-2 border-border/70 overflow-hidden focus-within:border-primary/55 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/.12)] transition-all"
                >
                  <div className="flex items-center justify-center px-3 h-full bg-muted/60 border-r border-border/50">
                    <span className="text-sm font-black text-muted-foreground select-none">FK</span>
                  </div>
                  <div className="flex items-center justify-center px-3 h-full bg-muted/40 border-r border-border/50">
                    <span className="text-sm font-bold text-muted-foreground select-none">244</span>
                  </div>
                  <div className="flex-1 relative flex items-center h-full">
                    <input
                      ref={digitsRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      value={digits}
                      onChange={e => handleDigitsChange(e.target.value)}
                      onPaste={e => {
                        const pasted = e.clipboardData.getData('text');
                        const match = pasted.match(/FK-244-(\d{1,6})/i);
                        if (match) { e.preventDefault(); handleDigitsChange(pasted); }
                      }}
                      placeholder="_ _ _ _ _ _"
                      className="w-full h-full px-3 bg-transparent text-sm font-mono font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/40 placeholder:tracking-[0.4em] focus:outline-none"
                      autoComplete="off"
                    />
                    {digits.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setDigits(''); setBuyerData(null); digitsRef.current?.focus(); }}
                        className="absolute right-2 p-1 rounded-full hover:bg-muted/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {lookingUpBuyer && (
                    <div className="px-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {digits.length > 0 && !buyerData && (
                  <p className="text-xs text-muted-foreground font-mono pl-1">
                    FK-244-{digits.padEnd(6, '_')}
                  </p>
                )}

                {buyerData && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{buyerData.nome}</p>
                      <p className="text-xs text-muted-foreground font-mono">FK-244-{digits}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: QR Scanner */}
            {buyerTab === 'qr' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-muted-foreground">Aponta a câmara para o QR do comprador</p>
                <div id="buyer-qr-reader" className="w-full rounded-xl overflow-hidden" />
                {!qrScannerActive && (
                  <Button onClick={initQRScanner} className="w-full gap-2" variant="outline">
                    <Camera className="w-4 h-4" />
                    Iniciar Scanner
                  </Button>
                )}
                {buyerData && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-bold">{buyerData.nome}</p>
                      <p className="text-xs text-muted-foreground font-mono">FK-244-{digits}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Anónimo */}
            {buyerTab === 'anonimo' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-muted-foreground">A fatura será emitida como consumidor final anónimo.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnonMode('consumidor_final')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                      anonMode === 'consumidor_final'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/50 text-muted-foreground'
                    }`}
                  >
                    Consumidor Final
                  </button>
                  <button
                    onClick={() => setAnonMode('nif_manual')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                      anonMode === 'nif_manual'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/50 text-muted-foreground'
                    }`}
                  >
                    Adicionar NIF
                  </button>
                </div>
                {anonMode === 'nif_manual' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input placeholder="Nome do cliente" value={manualNome} onChange={e => setManualNome(e.target.value)} className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">NIF *</Label>
                        <Input placeholder="NIF" value={manualNif} onChange={e => setManualNif(e.target.value)} className="h-10 text-sm font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Endereço</Label>
                      <Input placeholder="Endereço" value={manualEndereco} onChange={e => setManualEndereco(e.target.value)} className="h-10 text-sm" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 2: Invoice Type ── */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-bold mb-3">Tipo de documento</p>
            <div className="flex flex-wrap gap-2">
              {docTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTipo(value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    tipo === value
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {(tipo === 'nota-credito' || tipo === 'nota-debito') && (
              <div className="mt-3 space-y-1">
                <Label className="text-xs">Referência ao documento original *</Label>
                <Input placeholder="Nº do documento" value={notaCreditoRef} onChange={e => setNotaCreditoRef(e.target.value)} className="h-10 text-sm font-mono" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 3: Products ── */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-bold mb-3">Produtos e Serviços</p>

            {/* Search / Add controls */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar produto..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="h-10 pl-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1 h-10 text-xs font-bold shrink-0">
                <Plus className="w-3.5 h-3.5" />
                Manual
              </Button>
            </div>

            {/* Search results dropdown */}
            {productSearch.trim() && filteredProducts.length > 0 && (
              <div className="border rounded-xl mb-4 divide-y overflow-hidden bg-card shadow-sm">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addProductById(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.codigo}{p.barcode ? ` · ${p.barcode}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold font-mono text-primary shrink-0">
                      {formatCurrency(Number(p.preco_unitario))}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Cart items */}
            {itens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum produto adicionado</p>
                <p className="text-xs">Pesquise ou adicione manualmente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <div key={item.id} className="border rounded-xl p-3 space-y-2 bg-muted/20">
                    {/* Product select for manual items */}
                    {!item.produto_nome && (
                      <Select value={item.produto_id} onValueChange={v => updateItem(index, 'produto_id', v)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecionar produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Product card */}
                    {item.produto_nome && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{item.produto_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.preco_unitario)} × {item.quantidade}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-mono">{formatCurrency(item.subtotal)}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.taxa_iva > 0 ? `IVA ${item.taxa_iva}% · ${formatCurrency(item.valor_iva)}` : 'Isento IVA'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Inline edit controls */}
                    {editingItemIndex === index ? (
                      <div className="space-y-2 pt-1 animate-fade-in">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                            <Input type="number" min="1" step="1" value={item.quantidade}
                              onChange={e => updateItem(index, 'quantidade', parseFloat(e.target.value) || 1)}
                              className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Desc. %</Label>
                            <Input type="number" min="0" max="100" value={item.desconto}
                              onChange={e => updateItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">IVA %</Label>
                            <Select value={String(item.taxa_iva)} onValueChange={v => updateItem(index, 'taxa_iva', parseFloat(v))}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0% (Isento)</SelectItem>
                                <SelectItem value="5">5% (Reduzida)</SelectItem>
                                <SelectItem value="14">14% (Normal)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {Number(item.taxa_iva) === 0 && (
                          <div className="space-y-1 p-2 rounded-lg bg-amber-500/5 border border-amber-500/30">
                            <Label className="text-[10px] font-bold text-amber-600">Código de isenção AGT (obrigatório) *</Label>
                            <Select value={item.tax_exemption_code || ''} onValueChange={v => {
                              const ex = TAX_EXEMPTION_CODES.find(c => c.code === v);
                              const newItens = [...itens];
                              newItens[index] = { ...newItens[index], tax_exemption_code: v, tax_exemption_reason: ex?.description };
                              setItens(newItens);
                            }}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar código M00–M38" /></SelectTrigger>
                              <SelectContent className="max-h-[280px]">
                                {TAX_EXEMPTION_CODES.map(ex => (
                                  <SelectItem key={ex.code} value={ex.code} className="text-xs">
                                    <span className="font-bold font-mono">{ex.code}</span> — {ex.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                          onClick={() => updateItem(index, 'quantidade', Math.max(1, item.quantidade - 1))}>
                          −
                        </Button>
                        <span className="flex items-center px-2 text-xs font-bold tabular-nums">{item.quantidade}</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                          onClick={() => updateItem(index, 'quantidade', item.quantidade + 1)}>
                          +
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setEditingItemIndex(editingItemIndex === index ? null : index)}>
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => removeItem(index)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 3.5: AGT — Desconto Global, Moeda ── */}
        {itens.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold">Opções AGT (Decreto 312/18)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Desconto global %
                  </Label>
                  <Input type="number" min="0" max="100" step="0.01" value={descontoGlobal}
                    onChange={e => setDescontoGlobal(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Moeda
                  </Label>
                  <Select value={moeda} onValueChange={v => { setMoeda(v); if (v === 'AOA') setTaxaCambio(1); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {moeda !== 'AOA' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Taxa de câmbio para AOA *</Label>
                    <Input type="number" min="0" step="0.0001" value={taxaCambio}
                      onChange={e => setTaxaCambio(parseFloat(e.target.value) || 1)}
                      className="h-9 text-sm font-mono" placeholder="ex: 920.50" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Para itens isentos (IVA 0%), selecione o código de isenção em cada item.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── SECTION 4: Totals ── */}
        {itens.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(totais.subtotal)}</span>
              </div>
              {totais.desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto itens</span>
                  <span className="font-mono text-destructive">-{formatCurrency(totais.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-mono font-semibold">{formatCurrency(totais.totalIva)}</span>
              </div>
              {descontoGlobal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto global ({descontoGlobal}%)</span>
                  <span className="font-mono text-destructive">-{formatCurrency(totais.descontoGlobalValor)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold">TOTAL ({moeda})</span>
                <span className="text-lg font-black font-mono text-primary">{formatCurrency(totais.total)}</span>
              </div>
              {moeda !== 'AOA' && (
                <p className="text-[10px] text-muted-foreground text-right">
                  ≈ {formatCurrency(totais.total * taxaCambio)} AOA (câmbio {taxaCambio})
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── SECTION 5: Payment Method ── */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-bold mb-3">Método de pagamento</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentMethods.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMetodoPagamento(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                    metodoPagamento === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data de vencimento</Label>
                <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="h-10 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <Textarea placeholder="Notas adicionais..." value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} className="text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 6: Actions ── */}
        <div className="space-y-2 pb-6">
          <Button
            onClick={handleEmit}
            disabled={createFatura.isPending || itens.length === 0}
            className="w-full h-12 text-base font-black rounded-xl shadow-lg shadow-primary/25 gap-2"
          >
            {createFatura.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />A emitir...</>
            ) : (
              <><FileText className="w-4 h-4" />EMITIR FATURA</>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2 text-xs font-bold" onClick={() => toast.info('Rascunho guardado (em breve)')}>
              <Save className="w-3.5 h-3.5" />
              Guardar rascunho
            </Button>
            <Button variant="outline" className="flex-1 gap-2 text-xs font-bold" onClick={() => toast.info('Pré-visualização (em breve)')}>
              <Eye className="w-3.5 h-3.5" />
              Pré-visualizar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
