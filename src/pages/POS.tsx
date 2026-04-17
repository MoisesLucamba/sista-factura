import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ScanLine, Trash2, Plus, Minus, ShoppingCart, User, Package,
  Search, Camera, UserCheck, Loader2, Zap, CheckCircle2,
  CreditCard, Wifi, WifiOff, AlertCircle, ChevronRight, BarChart3,
  Clock, Hash, X, Calculator, Delete, ArrowLeftRight,
} from 'lucide-react';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreateFatura } from '@/hooks/useFaturas';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner } from '@/components/produtos/BarcodeScanner';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { generateInvoicePDF } from '@/lib/pdf-generator';

interface CartItem {
  produto_id: string;
  nome: string;
  barcode?: string;
  preco_unitario: number;
  quantidade: number;
  desconto: number;
  taxa_iva: number;
  subtotal: number;
  valor_iva: number;
  total: number;
}

type BuyerMode = 'anonymous' | 'faktura_id' | 'qr';
type PaymentMethod = 'cash' | 'wallet' | 'multicaixa' | 'transferencia' | 'pendente';

function recalcItem(item: CartItem): CartItem {
  const base = item.preco_unitario * item.quantidade;
  const discounted = base * (1 - item.desconto / 100);
  const iva = discounted * (item.taxa_iva / 100);
  return { ...item, subtotal: discounted, valor_iva: iva, total: discounted + iva };
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Numerário', icon: '💵' },
  { value: 'wallet', label: 'Carteira Faktura', icon: '👛' },
  { value: 'multicaixa', label: 'Multicaixa Express', icon: '📱' },
  { value: 'transferencia', label: 'Transferência', icon: '🏦' },
  { value: 'pendente', label: 'Pendente', icon: '⏳' },
];

// Quick cash amounts in Kz
const QUICK_CASH = [500, 1000, 2000, 5000, 10000, 20000];

// ─── CASH CALCULATOR MODAL ───────────────────────────────────────────────────
interface CashCalculatorProps {
  total: number;
  onClose: () => void;
  onConfirm: (entregue: number) => void;
}

function CashCalculator({ total, onClose, onConfirm }: CashCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [hasDecimal, setHasDecimal] = useState(false);

  const entregue = parseFloat(display) || 0;
  const troco = Math.max(0, entregue - total);
  const falta = Math.max(0, total - entregue);
  const sufficient = entregue >= total;

  const press = (val: string) => {
    if (val === 'C') { setDisplay('0'); setHasDecimal(false); return; }
    if (val === '⌫') {
      const next = display.length > 1 ? display.slice(0, -1) : '0';
      setHasDecimal(next.includes('.'));
      setDisplay(next);
      return;
    }
    if (val === '.') {
      if (hasDecimal) return;
      setHasDecimal(true);
      setDisplay(d => d + '.');
      return;
    }
    // Limit decimal places to 2
    if (hasDecimal) {
      const parts = display.split('.');
      if (parts[1]?.length >= 2) return;
    }
    setDisplay(d => d === '0' ? val : d + val);
  };

  const setQuick = (amount: number) => {
    setDisplay(String(amount));
    setHasDecimal(false);
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '⌫'],
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Calculadora de Troco</DialogTitle>
              <p className="text-xs text-muted-foreground">Total a pagar: <span className="font-bold text-foreground font-mono">{formatCurrency(total)}</span></p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 pb-3">
          {/* Display */}
          <div className={`rounded-2xl p-4 mb-3 transition-colors ${
            sufficient
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
              : 'bg-muted/50 border border-border'
          }`}>
            <p className="text-xs text-muted-foreground mb-1">Valor entregue pelo cliente</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground font-medium">Kz</span>
              <span className={`text-3xl font-bold font-mono tracking-tight ${sufficient ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
                {parseFloat(display).toLocaleString('pt-AO', { minimumFractionDigits: display.includes('.') ? Math.min(2, (display.split('.')[1] || '').length) : 0 })}
              </span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {QUICK_CASH.map(amount => (
              <button
                key={amount}
                onClick={() => setQuick(amount)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  entregue === amount
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {amount >= 1000 ? `${amount / 1000}K` : amount}
              </button>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {/* Keys in 3 columns + C column */}
            {keys.map((row, ri) =>
              row.map((key, ki) => (
                <button
                  key={`${ri}-${ki}`}
                  onClick={() => press(key)}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    key === '⌫'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {key === '⌫' ? <Delete className="w-4 h-4 mx-auto" /> : key}
                </button>
              ))
            )}
            {/* C button spanning last column rows */}
            <button
              onClick={() => press('C')}
              className="row-span-4 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95"
              style={{ gridRow: '1 / span 4', gridColumn: '4' }}
            >
              C
            </button>
          </div>

          {/* Troco / Falta */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className={`p-3 rounded-xl border text-center ${
              sufficient
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-muted/30 border-border/50'
            }`}>
              <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Troco</p>
              <p className={`text-lg font-bold font-mono ${sufficient ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                {formatCurrency(troco)}
              </p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${
              !sufficient && falta > 0
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                : 'bg-muted/30 border-border/50'
            }`}>
              <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Falta</p>
              <p className={`text-lg font-bold font-mono ${!sufficient && falta > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                {formatCurrency(falta)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 gap-2 text-sm font-semibold"
              disabled={!sufficient}
              onClick={() => onConfirm(entregue)}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN POS COMPONENT ──────────────────────────────────────────────────────
export default function POS() {
  const { user } = useAuth();
  const { data: produtos = [] } = useProdutos();
  const { data: clientes = [] } = useClientes();
  const createFatura = useCreateFatura();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [buyerMode, setBuyerMode] = useState<BuyerMode>('anonymous');
  const [fakturaId, setFakturaId] = useState('');
  const [buyerInfo, setBuyerInfo] = useState<{ user_id: string; nome: string; nif: string; faktura_id: string } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [processing, setProcessing] = useState(false);
  const [scanQR, setScanQR] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [successSale, setSuccessSale] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sessionTime, setSessionTime] = useState(0);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [trocoInfo, setTrocoInfo] = useState<{ entregue: number; troco: number } | null>(null);
  // Mobile: toggle between product panel and cart panel
  const [mobileView, setMobileView] = useState<'produtos' | 'carrinho'>('produtos');

  const barcodeRef = useRef<HTMLInputElement>(null);
  const sessionStart = useRef(Date.now());
  const scanSoundRef = useRef<AudioContext | null>(null);

  // Beep on scan
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSessionTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${sec.toString().padStart(2, '0')}s`;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); barcodeRef.current?.focus(); }
      if (e.key === 'Escape') { setScanning(false); setScanQR(false); setShowCalculator(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const triggerScanFlash = () => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 400);
  };

  const addToCart = useCallback((barcode: string) => {
    const product = produtos.find(p => p.barcode === barcode || p.codigo === barcode);
    if (!product) {
      toast.error(`Produto não encontrado: ${barcode}`, { icon: '⚠️' });
      return;
    }
    setLastScanned(product.nome);
    triggerScanFlash();
    playBeep();
    setCart(prev => {
      const existing = prev.find(i => i.produto_id === product.id);
      if (existing) {
        return prev.map(i => i.produto_id === product.id
          ? recalcItem({ ...i, quantidade: i.quantidade + 1 })
          : i
        );
      }
      const newItem: CartItem = {
        produto_id: product.id,
        nome: product.nome,
        barcode: product.barcode || undefined,
        preco_unitario: product.preco_unitario,
        quantidade: 1,
        desconto: 0,
        taxa_iva: product.taxa_iva,
        subtotal: 0, valor_iva: 0, total: 0,
      };
      return [...prev, recalcItem(newItem)];
    });
    // Switch to cart view on mobile after adding
    setMobileView('carrinho');
    toast.success(`${product.nome}`, {
      description: formatCurrency(product.preco_unitario),
      icon: '✓',
      duration: 1500,
    });
  }, [produtos, playBeep]);

  const handleBarcodeScan = useCallback((code: string) => {
    addToCart(code);
    setBarcodeInput('');
    barcodeRef.current?.focus();
  }, [addToCart]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) handleBarcodeScan(barcodeInput.trim());
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i =>
      i.produto_id === id ? recalcItem({ ...i, quantidade: Math.max(1, i.quantidade + delta) }) : i
    ));
  };

  const updateDiscount = (id: string, desconto: number) => {
    setCart(prev => prev.map(i => i.produto_id === id ? recalcItem({ ...i, desconto }) : i));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.produto_id !== id));

  const cartSubtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const cartIva = cart.reduce((s, i) => s + i.valor_iva, 0);
  const cartTotal = cart.reduce((s, i) => s + i.total, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantidade, 0);

  const filteredProdutos = produtos.filter(p =>
    productSearch
      ? p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode || '').includes(productSearch) ||
        p.codigo.toLowerCase().includes(productSearch.toLowerCase())
      : true
  ).slice(0, 40);

  const lookupBuyer = async () => {
    if (!fakturaId.trim()) return;
    setLookingUp(true);
    try {
      const { data, error } = await supabase.rpc('lookup_buyer_by_faktura_id', { _faktura_id: fakturaId.trim() });
      if (error) throw error;
      if (data && data.length > 0) {
        const b = data[0];
        setBuyerInfo({ user_id: b.user_id, nome: b.nome, nif: b.nif, faktura_id: fakturaId.trim() });
        toast.success(`Comprador identificado: ${b.nome}`);
      } else {
        toast.error('Comprador não encontrado');
        setBuyerInfo(null);
      }
    } catch {
      toast.error('Erro ao pesquisar comprador');
    } finally {
      setLookingUp(false);
    }
  };

  const handleBuyerQR = (code: string) => {
    setScanQR(false);
    if (code.startsWith('FK-')) {
      setFakturaId(code);
      setBuyerMode('faktura_id');
      setTimeout(() => lookupBuyer(), 100);
    } else {
      toast.error('QR code inválido');
    }
  };

  const handleConfirmCash = (entregue: number) => {
    const troco = Math.max(0, entregue - cartTotal);
    setTrocoInfo({ entregue, troco });
    setShowCalculator(false);
    // Auto-trigger sale after confirming cash
    confirmSale();
  };

  const confirmSale = async () => {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return; }

    const needsClient = buyerMode === 'anonymous' && !selectedClienteId;
    if (needsClient) { toast.error('Selecione um cliente'); return; }

    // If cash payment and no troco calculated yet, open calculator
    if (paymentMethod === 'cash' && !trocoInfo) {
      setShowCalculator(true);
      return;
    }

    setProcessing(true);
    try {
      let clienteId = selectedClienteId;

      if (buyerInfo && buyerMode === 'faktura_id') {
        const existing = clientes.find(c => c.nif === buyerInfo.nif);
        if (existing) {
          clienteId = existing.id;
        } else {
          const { data: newCliente, error } = await supabase
            .from('clientes')
            .insert({
              user_id: user!.id,
              nome: buyerInfo.nome,
              nif: buyerInfo.nif,
              endereco: 'N/A',
              tipo: 'particular',
            })
            .select()
            .single();
          if (error) throw error;
          clienteId = newCliente.id;
        }
      }

      if (!clienteId) { toast.error('Selecione um cliente'); setProcessing(false); return; }

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      const result = await createFatura.mutateAsync({
        tipo: 'fatura-recibo',
        cliente_id: clienteId,
        data_emissao: today,
        data_vencimento: dueDate,
        metodo_pagamento: paymentMethod,
        observacoes: trocoInfo
          ? `Venda POS | Entregue: ${formatCurrency(trocoInfo.entregue)} | Troco: ${formatCurrency(trocoInfo.troco)}`
          : 'Venda POS',
        buyer_user_id: buyerInfo?.user_id,
        buyer_faktura_id: buyerInfo?.faktura_id,
        itens: cart.map(i => ({
          produto_id: i.produto_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto: i.desconto,
          taxa_iva: i.taxa_iva,
          subtotal: i.subtotal,
          valor_iva: i.valor_iva,
          total: i.total,
        })),
      });

      setSuccessSale(true);
      if (result?.numero) setLastInvoiceNumber(result.numero);
      setTimeout(() => setSuccessSale(false), 3500);

      setCart([]);
      setBuyerInfo(null);
      setFakturaId('');
      setBuyerMode('anonymous');
      setSelectedClienteId('');
      setTrocoInfo(null);
      setMobileView('produtos');
    } catch (err: any) {
      toast.error('Erro ao processar venda: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ─── LEFT PANEL: Products + Barcode ──────────────────────────────────────
  const ProductsPanel = (
    <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
      {/* Enhanced Barcode Scanner Bar */}
      <div className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        scanFlash
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
          : 'border-border bg-card hover:border-border/80'
      }`}>
        {/* Animated scan line */}
        {scanFlash && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
          </div>
        )}
        <div className="p-3 flex gap-2 items-center">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            scanFlash ? 'bg-emerald-500 shadow-md shadow-emerald-500/40' : 'bg-muted'
          }`}>
            <ScanLine className={`w-4 h-4 transition-colors ${scanFlash ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 flex-1">
            <Input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Código de barras — F2 para focar"
              className="font-mono text-sm h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              autoFocus
            />
            {barcodeInput && (
              <Button type="submit" size="sm" className="h-9 px-3 text-xs gap-1.5 shrink-0">
                <ChevronRight className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            )}
          </form>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={`h-9 w-9 shrink-0 transition-colors ${scanFlash ? 'text-emerald-600' : ''}`}
            onClick={() => setScanning(true)}
            title="Câmera"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        {lastScanned && (
          <div className={`px-3 pb-2.5 flex items-center gap-2 text-xs transition-colors ${
            scanFlash ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${scanFlash ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
            <span>Último: <span className="font-semibold text-foreground">{lastScanned}</span></span>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <Card className="flex-1 overflow-hidden flex flex-col border-border/50">
        <CardHeader className="pb-2 px-4 pt-3 flex-row items-center gap-3 space-y-0 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Package className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Catálogo</CardTitle>
            <Badge variant="outline" className="text-xs">{produtos.length}</Badge>
          </div>
          <div className="relative w-44 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Filtrar produtos..."
              className="pl-8 h-7 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-y-auto flex-1">
          {filteredProdutos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProdutos.map(p => {
                const inCart = cart.find(i => i.produto_id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p.barcode || p.codigo)}
                    className={`group relative p-3 rounded-xl border transition-all duration-150 text-left active:scale-95 ${
                      inCart
                        ? 'border-primary/40 bg-primary/5 shadow-sm'
                        : 'border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'
                    }`}
                  >
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="text-[10px] font-bold">{inCart.quantidade}</span>
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                      inCart ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10'
                    }`}>
                      <Package className={`w-4 h-4 transition-colors ${inCart ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </div>
                    <p className="text-xs font-medium truncate leading-tight">{p.nome}</p>
                    <p className="text-xs text-primary font-bold mt-1">{formatCurrency(p.preco_unitario)}</p>
                    {p.barcode && (
                      <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 truncate">{p.barcode}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── RIGHT PANEL: Cart + Checkout ─────────────────────────────────────────
  const CartPanel = (
    <div className="w-full lg:w-[380px] flex flex-col gap-3 shrink-0">
      {/* Cart */}
      <Card className="flex-1 overflow-hidden flex flex-col border-border/50 min-h-0">
        <CardHeader className="pb-2 px-4 pt-3 flex-row items-center space-y-0 shrink-0">
          <ShoppingCart className="w-4 h-4 text-muted-foreground mr-2" />
          <CardTitle className="text-sm font-medium">Carrinho</CardTitle>
          {cart.length > 0 && (
            <>
              <Badge className="ml-2 text-xs h-5">{cartItemCount}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => { setCart([]); setLastScanned(null); setTrocoInfo(null); }}
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </>
          )}
        </CardHeader>

        <CardContent className="p-2 overflow-y-auto flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <ScanLine className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">Pronto para leitura</p>
              <p className="text-xs mt-1 opacity-60">Digitalize ou clique num produto</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {cart.map((item, idx) => (
                <div
                  key={item.produto_id}
                  className="p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.nome}</p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                      <p className="text-sm font-bold">{formatCurrency(item.total)}</p>
                      <button
                        onClick={() => removeItem(item.produto_id)}
                        className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-7">
                    <div className="flex items-center rounded-lg border border-border/60 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.produto_id, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-bold w-7 text-center tabular-nums">{item.quantidade}</span>
                      <button
                        onClick={() => updateQuantity(item.produto_id, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-1">
                      {formatCurrency(item.preco_unitario)} × {item.quantidade}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">%desc</span>
                      <Input
                        type="number"
                        value={item.desconto}
                        onChange={e => updateDiscount(item.produto_id, Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="h-5 w-12 text-[10px] text-center px-1"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-border/50 p-3 space-y-1.5 bg-muted/10 shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal s/IVA</span>
              <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>IVA</span>
              <span className="font-mono">{formatCurrency(cartIva)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-border/30">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold font-mono tracking-tight">{formatCurrency(cartTotal)}</span>
            </div>
            {/* Troco info if calculated */}
            {trocoInfo && (
              <div className="mt-1 pt-2 border-t border-emerald-200 dark:border-emerald-800 grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Entregue</p>
                  <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(trocoInfo.entregue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Troco</p>
                  <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(trocoInfo.troco)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Checkout Panel */}
      <Card className="border-border/50 shrink-0">
        <CardContent className="p-3 space-y-3">
          {/* Buyer Mode */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" /> Comprador
            </p>
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-xl">
              {([
                { mode: 'anonymous', label: 'Cliente' },
                { mode: 'faktura_id', label: 'Faktura ID' },
                { mode: 'qr', label: 'QR Code' },
              ] as { mode: BuyerMode; label: string }[]).map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => { setBuyerMode(mode); setBuyerInfo(null); }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    buyerMode === mode
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {buyerMode === 'anonymous' && (
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.nome} — {c.nif}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {buyerMode === 'faktura_id' && (
              <div className="flex gap-1.5">
                <Input
                  value={fakturaId}
                  onChange={e => setFakturaId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupBuyer()}
                  placeholder="FK-XXXXX"
                  className="h-9 text-xs font-mono flex-1"
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={lookupBuyer} disabled={lookingUp}>
                  {lookingUp
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Search className="w-3.5 h-3.5" />
                  }
                </Button>
              </div>
            )}

            {buyerMode === 'qr' && (
              <Button
                variant="outline"
                className="w-full h-9 text-xs gap-2"
                onClick={() => setScanQR(true)}
              >
                <Camera className="w-3.5 h-3.5" />
                Digitalizar QR do Comprador
              </Button>
            )}

            {buyerInfo && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">{buyerInfo.nome}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">NIF: {buyerInfo.nif}</p>
                </div>
                <button onClick={() => setBuyerInfo(null)} className="text-emerald-400 hover:text-emerald-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* Payment Method */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3 h-3" /> Pagamento
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1">
              {PAYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPaymentMethod(opt.value); setTrocoInfo(null); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    paymentMethod === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground border border-border/50'
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="flex-1 text-left">{opt.label}</span>
                  {paymentMethod === opt.value && (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Calculator Button (only for cash payments) */}
          {paymentMethod === 'cash' && cart.length > 0 && (
            <Button
              variant="outline"
              className="w-full h-9 text-xs gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => setShowCalculator(true)}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calcular Troco
              {trocoInfo && (
                <Badge variant="outline" className="ml-auto text-[10px] border-emerald-300 dark:border-emerald-700">
                  Troco: {formatCurrency(trocoInfo.troco)}
                </Badge>
              )}
            </Button>
          )}

          {/* Confirm Button */}
          <Button
            className="w-full h-12 text-sm font-semibold gap-2 rounded-xl"
            onClick={confirmSale}
            disabled={cart.length === 0 || processing}
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Emitir Factura · {formatCurrency(cartTotal)}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MainLayout>
      {/* Success overlay */}
      {successSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 p-8 rounded-3xl bg-card border border-border shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">Venda Concluída!</p>
            {lastInvoiceNumber && (
              <p className="text-sm text-muted-foreground">Factura <span className="font-bold text-foreground">{lastInvoiceNumber}</span> emitida</p>
            )}
            <p className="text-3xl font-mono font-bold text-primary">{formatCurrency(cartTotal)}</p>
            {trocoInfo && trocoInfo.troco > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Troco: <span className="font-bold font-mono">{formatCurrency(trocoInfo.troco)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
          isOnline
            ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800'
            : 'text-destructive bg-destructive/10 border-destructive/20'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{formatSessionTime(sessionTime)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BarChart3 className="w-3 h-3" />
          <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</span>
        </div>
        {lastInvoiceNumber && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Hash className="w-3 h-3" />
            <span>Última: {lastInvoiceNumber}</span>
          </div>
        )}

        {/* Mobile view toggle */}
        <div className="flex lg:hidden ml-auto items-center rounded-lg border border-border/60 overflow-hidden h-7">
          <button
            onClick={() => setMobileView('produtos')}
            className={`px-2.5 h-full text-xs font-medium transition-colors flex items-center gap-1 ${mobileView === 'produtos' ? 'bg-muted' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Package className="w-3 h-3" />
            Produtos
          </button>
          <button
            onClick={() => setMobileView('carrinho')}
            className={`px-2.5 h-full text-xs font-medium border-l border-border/60 transition-colors flex items-center gap-1 ${mobileView === 'carrinho' ? 'bg-muted' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <ShoppingCart className="w-3 h-3" />
            Carrinho
            {cartItemCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      {/* Desktop: side by side | Mobile: tabs */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9.5rem)]">
        {/* Desktop: both panels visible */}
        <div className="hidden lg:flex flex-row gap-4 flex-1 overflow-hidden">
          {ProductsPanel}
          {CartPanel}
        </div>

        {/* Mobile: one panel at a time */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {mobileView === 'produtos' ? ProductsPanel : CartPanel}
        </div>
      </div>

      {/* Cash Calculator Modal */}
      {showCalculator && (
        <CashCalculator
          total={cartTotal}
          onClose={() => setShowCalculator(false)}
          onConfirm={handleConfirmCash}
        />
      )}

      {/* Camera Scanner Overlay */}
      {scanning && (
        <BarcodeScanner
          onScan={(code) => { setScanning(false); handleBarcodeScan(code); }}
          onClose={() => setScanning(false)}
        />
      )}

      {/* QR Scanner for Buyer */}
      {scanQR && (
        <BarcodeScanner
          onScan={handleBuyerQR}
          onClose={() => setScanQR(false)}
        />
      )}
    </MainLayout>
  );
}