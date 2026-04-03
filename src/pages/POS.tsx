import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ScanLine, Trash2, Plus, Minus, ShoppingCart, Receipt, User,
  Search, Keyboard, Camera, UserCheck, Loader2, Printer, Download,
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

function recalcItem(item: CartItem): CartItem {
  const base = item.preco_unitario * item.quantidade;
  const discounted = base * (1 - item.desconto / 100);
  const iva = discounted * (item.taxa_iva / 100);
  return { ...item, subtotal: discounted, valor_iva: iva, total: discounted + iva };
}

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
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [scanQR, setScanQR] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // F2 shortcut to focus barcode field
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); barcodeRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToCart = useCallback((barcode: string) => {
    const product = produtos.find(p => p.barcode === barcode || p.codigo === barcode);
    if (!product) {
      toast.error(`Produto não encontrado: ${barcode}`);
      return;
    }
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
    toast.success(`${product.nome} adicionado`);
  }, [produtos]);

  const handleBarcodeScan = useCallback((code: string) => {
    addToCart(code);
    setBarcodeInput('');
  }, [addToCart]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.produto_id === id ? recalcItem({ ...i, quantidade: Math.max(1, i.quantidade + delta) }) : i)
    );
  };

  const updateDiscount = (id: string, desconto: number) => {
    setCart(prev => prev.map(i => i.produto_id === id ? recalcItem({ ...i, desconto }) : i));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.produto_id !== id));

  const cartSubtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const cartIva = cart.reduce((s, i) => s + i.valor_iva, 0);
  const cartTotal = cart.reduce((s, i) => s + i.total, 0);

  // Lookup buyer by Faktura ID
  const lookupBuyer = async () => {
    if (!fakturaId.trim()) return;
    setLookingUp(true);
    try {
      const { data, error } = await supabase.rpc('lookup_buyer_by_faktura_id', { _faktura_id: fakturaId.trim() });
      if (error) throw error;
      if (data && data.length > 0) {
        const b = data[0];
        setBuyerInfo({ user_id: b.user_id, nome: b.nome, nif: b.nif, faktura_id: fakturaId.trim() });
        toast.success(`Comprador: ${b.nome}`);
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

  // Handle QR scan for buyer
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

  // Confirm sale
  const confirmSale = async () => {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return; }
    if (buyerMode === 'anonymous' && !selectedClienteId) {
      toast.error('Selecione um cliente ou use ID Faktura'); return;
    }

    setProcessing(true);
    try {
      let clienteId = selectedClienteId;

      // If buyer found via Faktura ID, find or create client record
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

      await createFatura.mutateAsync({
        tipo: 'fatura-recibo',
        cliente_id: clienteId,
        data_emissao: today,
        data_vencimento: dueDate,
        metodo_pagamento: paymentMethod,
        observacoes: 'Venda POS',
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

      setCart([]);
      setBuyerInfo(null);
      setFakturaId('');
      setBuyerMode('anonymous');
      setSelectedClienteId('');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
        {/* Left: Scanner + Product List */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Barcode Input Bar */}
          <Card>
            <CardContent className="p-3">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Digitalizar código de barras (F2)"
                    className="pl-9 font-mono"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="icon" variant="outline">
                  <Keyboard className="w-4 h-4" />
                </Button>
                <Button type="button" size="icon" onClick={() => setScanning(true)}>
                  <Camera className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Product Grid */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" /> Produtos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-y-auto max-h-[calc(100%-3rem)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {produtos.slice(0, 24).map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p.barcode || p.codigo)}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition text-left"
                  >
                    <p className="text-xs font-medium truncate">{p.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(p.preco_unitario)}</p>
                    {p.barcode && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{p.barcode}</p>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cart + Checkout */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {/* Cart */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Carrinho
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{cart.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-y-auto flex-1">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ScanLine className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Digitalize produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.produto_id} className="p-2 rounded-md border border-border bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.preco_unitario)} × {item.quantidade}</p>
                        </div>
                        <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(item.total)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.produto_id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantidade}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.produto_id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.desconto}
                          onChange={e => updateDiscount(item.produto_id, Number(e.target.value))}
                          className="h-7 w-16 text-xs"
                          placeholder="Desc %"
                          min={0}
                          max={100}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.produto_id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Totals */}
            {cart.length > 0 && (
              <div className="border-t p-3 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>IVA</span><span>{formatCurrency(cartIva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span><span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Buyer + Payment */}
          <Card>
            <CardContent className="p-3 space-y-3">
              {/* Buyer Selection */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> Comprador
                </p>
                <div className="flex gap-1">
                  {(['anonymous', 'faktura_id', 'qr'] as BuyerMode[]).map(mode => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={buyerMode === mode ? 'default' : 'outline'}
                      onClick={() => { setBuyerMode(mode); setBuyerInfo(null); }}
                      className="text-xs flex-1"
                    >
                      {mode === 'anonymous' ? 'Cliente' : mode === 'faktura_id' ? 'Faktura ID' : 'QR'}
                    </Button>
                  ))}
                </div>

                {buyerMode === 'anonymous' && (
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.nome} — {c.nif}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {buyerMode === 'faktura_id' && (
                  <div className="flex gap-1">
                    <Input
                      value={fakturaId}
                      onChange={e => setFakturaId(e.target.value)}
                      placeholder="FK-XXXXX"
                      className="h-8 text-xs font-mono"
                    />
                    <Button size="sm" className="h-8" onClick={lookupBuyer} disabled={lookingUp}>
                      {lookingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    </Button>
                  </div>
                )}

                {buyerMode === 'qr' && (
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => setScanQR(true)}>
                    <Camera className="w-3 h-3 mr-1" /> Digitalizar QR do Comprador
                  </Button>
                )}

                {buyerInfo && (
                  <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium">{buyerInfo.nome}</p>
                      <p className="text-[10px] text-muted-foreground">NIF: {buyerInfo.nif}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Pagamento</p>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash" className="text-xs">Numerário</SelectItem>
                    <SelectItem value="wallet" className="text-xs">Carteira Faktura</SelectItem>
                    <SelectItem value="multicaixa" className="text-xs">Multicaixa Express</SelectItem>
                    <SelectItem value="transferencia" className="text-xs">Transferência</SelectItem>
                    <SelectItem value="pendente" className="text-xs">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confirm */}
              <Button
                className="w-full"
                size="lg"
                onClick={confirmSale}
                disabled={cart.length === 0 || processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4 mr-2" />
                )}
                Confirmar Venda — {formatCurrency(cartTotal)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
