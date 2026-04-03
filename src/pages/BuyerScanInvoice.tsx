import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner, lookupBarcode } from '@/components/produtos/BarcodeScanner';
import { formatCurrency } from '@/lib/format';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ScanLine, Plus, Minus, Trash2, Camera, ShoppingCart,
  CheckCircle, Loader2, Package, Search, FileText, X, Store,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScannedItem {
  id: string;
  barcode: string;
  nome: string;
  marca?: string;
  categoria?: string;
  preco: number;
  quantidade: number;
  total: number;
  merchant_name?: string;
  is_faktura_merchant: boolean;
  faktura_merchant_user_id?: string;
  imagem_url?: string;
}

export default function BuyerScanInvoice() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<ScannedItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const lookupProduct = useCallback(async (barcode: string) => {
    setSearching(true);
    try {
      // 1. Search Faktura shared database first
      const { data: shared } = await supabase
        .from('shared_products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (shared) {
        // Find cheapest merchant
        const { data: merchants } = await supabase
          .from('produtos')
          .select('user_id, preco_unitario, nome')
          .eq('barcode', barcode)
          .order('preco_unitario', { ascending: true })
          .limit(1);

        let merchantName: string | undefined;
        let merchantUserId: string | undefined;
        if (merchants && merchants.length > 0) {
          merchantUserId = merchants[0].user_id;
          const { data: config } = await supabase
            .from('agt_config')
            .select('nome_empresa')
            .eq('user_id', merchantUserId)
            .single();
          merchantName = config?.nome_empresa || undefined;
        }

        addToCart({
          barcode,
          nome: shared.nome,
          marca: shared.marca || undefined,
          categoria: shared.categoria || undefined,
          preco: shared.min_price || shared.avg_price || 0,
          merchant_name: merchantName,
          is_faktura_merchant: true,
          faktura_merchant_user_id: merchantUserId,
          imagem_url: shared.imagem_url || undefined,
        });
        return;
      }

      // 2. Fallback to Open Food Facts
      const offProduct = await lookupBarcode(barcode);
      if (offProduct) {
        addToCart({
          barcode,
          nome: offProduct.name || barcode,
          marca: offProduct.brand || undefined,
          categoria: offProduct.category || undefined,
          preco: 0,
          is_faktura_merchant: false,
          imagem_url: offProduct.image_url || undefined,
        });
        return;
      }

      // 3. Unknown product
      addToCart({
        barcode,
        nome: `Produto ${barcode}`,
        preco: 0,
        is_faktura_merchant: false,
      });
      toast.info('Produto não encontrado na base de dados. Preencha o preço manualmente.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao pesquisar produto');
    } finally {
      setSearching(false);
    }
  }, []);

  const addToCart = (product: Omit<ScannedItem, 'id' | 'quantidade' | 'total'>) => {
    const existing = cart.find(i => i.barcode === product.barcode);
    if (existing) {
      setCart(prev => prev.map(i =>
        i.barcode === product.barcode
          ? { ...i, quantidade: i.quantidade + 1, total: (i.quantidade + 1) * i.preco }
          : i
      ));
      toast.success(`+1 ${product.nome}`);
    } else {
      setCart(prev => [...prev, {
        ...product,
        id: crypto.randomUUID(),
        quantidade: 1,
        total: product.preco,
      }]);
      toast.success(`${product.nome} adicionado`);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const q = Math.max(1, i.quantidade + delta);
      return { ...i, quantidade: q, total: q * i.preco };
    }));
  };

  const updatePrice = (id: string, preco: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      return { ...i, preco, total: i.quantidade * preco };
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);

  const handleScan = (barcode: string) => {
    setScanning(false);
    lookupProduct(barcode);
  };

  const handleBarcodeSubmit = () => {
    if (barcodeInput.trim().length >= 4) {
      lookupProduct(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const saveExpenseRecord = async () => {
    if (!user || cart.length === 0) return;
    setSaving(true);
    try {
      const records = cart.map(item => ({
        buyer_user_id: user.id,
        barcode: item.barcode,
        produto_nome: item.nome,
        marca: item.marca || null,
        categoria: item.categoria || null,
        preco: item.preco,
        quantidade: item.quantidade,
        total: item.total,
        merchant_name: item.merchant_name || null,
        is_faktura_merchant: item.is_faktura_merchant,
        faktura_merchant_user_id: item.faktura_merchant_user_id || null,
      }));

      const { error } = await supabase.from('buyer_expense_records').insert(records);
      if (error) throw error;

      toast.success('Registo de despesa guardado com sucesso!');
      setSaved(true);
      setCart([]);
    } catch (err: any) {
      toast.error('Erro ao guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" />
            Scan & Fatura
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digitalize códigos de barras para criar o seu registo de despesas pessoal
          </p>
        </div>

        {/* Scanner Controls */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBarcodeSubmit()}
                  placeholder="Digite ou cole o código de barras..."
                  className="font-mono pr-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
              </div>
              <Button variant="outline" onClick={handleBarcodeSubmit} disabled={searching}>
                <Search className="w-4 h-4" />
              </Button>
              <Button onClick={() => setScanning(true)} className="gap-2">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Digitalizar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {scanning && (
          <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Carrinho ({cart.length})
                </span>
                <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm truncate">{item.nome}</p>
                        {item.marca && <p className="text-xs text-muted-foreground">{item.marca}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{item.barcode}</code>
                      {item.is_faktura_merchant ? (
                        <Badge variant="default" className="text-[10px] gap-1 h-5">
                          <Store className="w-2.5 h-2.5" /> Faktura
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5">Externo</Badge>
                      )}
                    </div>
                    {item.merchant_name && (
                      <p className="text-xs text-muted-foreground">Vendedor: {item.merchant_name}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Preço:</span>
                        <Input
                          type="number"
                          value={item.preco || ''}
                          onChange={e => updatePrice(item.id, Number(e.target.value))}
                          className="w-24 h-7 text-xs"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-bold w-8 text-center">{item.quantidade}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-right text-sm font-bold text-primary">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between text-lg font-black">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={saveExpenseRecord}
                disabled={saving || subtotal === 0}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Guardar Registo de Despesa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {cart.length === 0 && !saved && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ScanLine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">Pronto para digitalizar</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Digitalize códigos de barras de produtos para construir o seu registo de despesas pessoal
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success state */}
        {saved && cart.length === 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">Registo guardado!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                As suas despesas foram registadas com sucesso
              </p>
              <Button variant="outline" onClick={() => setSaved(false)}>
                <ScanLine className="w-4 h-4 mr-2" />
                Digitalizar mais produtos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
