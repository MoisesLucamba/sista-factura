import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, Loader2, Wallet,
  MapPin, Phone, Mail, Globe, CheckCircle, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import logoFaktura from '@/assets/faktura-logo.svg';

interface MerchantInfo {
  user_id: string;
  nome_empresa: string | null;
  logo_url: string | null;
  endereco_empresa: string | null;
  telefone: string | null;
  email: string | null;
  website: string | null;
  nif_produtor: string | null;
  actividade_comercial: string | null;
}

interface Product {
  id: string;
  user_id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  preco_unitario: number;
  unidade: string;
  taxa_iva: number;
  stock: number | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function LojaMerchant() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!merchantId) return;
    loadMerchant();
  }, [merchantId]);

  const loadMerchant = async () => {
    // merchantId can be a Faktura ID like FK-244-XXXXX or a user_id
    // First try to find by looking up profiles with seller type
    let userId = merchantId!;
    
    // If it looks like a Faktura-style ID, look up merchant differently
    // Merchants don't have faktura_id, so merchantId is actually the user_id encoded
    // We use a simplified approach: merchantId = user_id
    
    const { data: config } = await supabase
      .from('agt_config')
      .select('user_id, nome_empresa, logo_url, endereco_empresa, telefone, email, website, nif_produtor, actividade_comercial')
      .eq('user_id', userId)
      .single();

    if (config) {
      setMerchant(config as MerchantInfo);
      
      const { data: prods } = await supabase
        .from('produtos')
        .select('id, user_id, codigo, nome, descricao, tipo, preco_unitario, unidade, taxa_iva, stock')
        .eq('user_id', userId)
        .order('nome');
      
      setProducts((prods || []) as Product[]);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.nome} adicionado`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === productId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const subtotal = item.product.preco_unitario * item.quantity;
    const iva = subtotal * (item.product.taxa_iva / 100);
    return sum + subtotal + iva;
  }, 0);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.preco_unitario * item.quantity, 0);
  const cartIva = cartTotal - cartSubtotal;

  const handleCheckout = async () => {
    if (!user || !merchant) {
      toast.error('Deve iniciar sessão para pagar');
      navigate('/login');
      return;
    }

    setProcessing(true);
    try {
      // Check buyer wallet balance
      const { data: wallet } = await supabase
        .from('buyer_wallets')
        .select('saldo, faktura_id')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.saldo < cartTotal) {
        toast.error('Saldo insuficiente na carteira');
        setProcessing(false);
        return;
      }

      // Create client record if not exists for merchant
      const buyerProfile = profile;
      let clienteId: string;

      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', merchant.user_id)
        .eq('nif', buyerProfile?.nif || '999999999')
        .single();

      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clientes')
          .insert({
            user_id: merchant.user_id,
            nome: buyerProfile?.nome || 'Consumidor Final',
            nif: buyerProfile?.nif || '999999999',
            endereco: 'Angola',
            tipo: 'particular',
          })
          .select('id')
          .single();
        if (clientError) throw clientError;
        clienteId = newClient.id;
      }

      // Generate invoice number via RPC
      const { data: numero } = await supabase.rpc('generate_invoice_number', {
        _user_id: merchant.user_id,
        _serie: 'FR',
      });

      if (!numero) throw new Error('Falha ao gerar número');

      // Create invoice for merchant
      const { data: fatura, error: faturaError } = await supabase
        .from('faturas')
        .insert({
          user_id: merchant.user_id,
          numero: numero as string,
          serie: 'FR',
          tipo: 'fatura-recibo',
          estado: 'paga',
          cliente_id: clienteId,
          data_emissao: new Date().toISOString().split('T')[0],
          data_vencimento: new Date().toISOString().split('T')[0],
          data_pagamento: new Date().toISOString().split('T')[0],
          subtotal: cartSubtotal,
          total_iva: cartIva,
          total: cartTotal,
          metodo_pagamento: 'Carteira Faktura',
          buyer_user_id: user.id,
          buyer_faktura_id: wallet.faktura_id,
          is_locked: true,
          observacoes: 'Pagamento via QR Code - Loja Digital',
        } as any)
        .select('id')
        .single();

      if (faturaError) throw faturaError;

      // Insert line items
      const itens = cart.map(item => {
        const subtotal = item.product.preco_unitario * item.quantity;
        const valorIva = subtotal * (item.product.taxa_iva / 100);
        return {
          fatura_id: fatura.id,
          produto_id: item.product.id,
          quantidade: item.quantity,
          preco_unitario: item.product.preco_unitario,
          desconto: 0,
          taxa_iva: item.product.taxa_iva,
          subtotal,
          valor_iva: valorIva,
          total: subtotal + valorIva,
        };
      });

      await supabase.from('itens_fatura').insert(itens);

      // Deduct from buyer wallet
      await supabase
        .from('buyer_wallets')
        .update({ saldo: wallet.saldo - cartTotal })
        .eq('user_id', user.id);

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: cartTotal,
        type: 'payment',
        status: 'completed',
        currency: 'AOA',
        description: `Pagamento a ${merchant.nome_empresa || 'Vendedor'}`,
        fatura_id: fatura.id,
        completed_at: new Date().toISOString(),
      });

      // Notification to buyer
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'success',
        title: 'Pagamento Realizado ✅',
        message: `Pagou ${formatCurrency(cartTotal)} a ${merchant.nome_empresa || 'Vendedor'}. Fatura ${numero} gerada automaticamente.`,
      });

      setSuccess(true);
      setCart([]);
      toast.success('Pagamento realizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro no pagamento: ' + (err.message || 'Tente novamente'));
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Store className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Loja não encontrada</h1>
        <p className="text-sm text-muted-foreground mb-4">O vendedor não foi encontrado ou não configurou a sua loja.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-black mb-2">Pagamento Concluído!</h1>
        <p className="text-muted-foreground text-center mb-6">
          O seu pagamento a <strong>{merchant.nome_empresa}</strong> foi processado. A fatura foi gerada automaticamente.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/comprador')}>
            Ver Dashboard
          </Button>
          <Button onClick={() => { setSuccess(false); setCart([]); }}>
            Continuar a Comprar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoFaktura} alt="Faktura" className="h-7 object-contain" />
          </div>
          {cart.length > 0 && (
            <Button variant="outline" className="gap-2 relative" onClick={() => setCheckoutOpen(true)}>
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrinho</span>
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Merchant Profile */}
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {merchant.logo_url ? (
                <img src={merchant.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black tracking-tight">{merchant.nome_empresa || 'Vendedor'}</h1>
                {merchant.actividade_comercial && (
                  <p className="text-sm text-muted-foreground">{merchant.actividade_comercial}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {merchant.endereco_empresa && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{merchant.endereco_empresa}</span>
                  )}
                  {merchant.telefone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{merchant.telefone}</span>
                  )}
                  {merchant.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{merchant.email}</span>
                  )}
                  {merchant.website && (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{merchant.website}</span>
                  )}
                </div>
                {merchant.nif_produtor && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">NIF: {merchant.nif_produtor}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Input
          placeholder="Pesquisar produtos ou serviços..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {/* Products */}
        <div>
          <h2 className="text-lg font-bold mb-4">
            Produtos & Serviços ({filteredProducts.length})
          </h2>
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum produto disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const cartItem = cart.find(i => i.product.id === product.id);
                const outOfStock = product.tipo === 'produto' && product.stock !== null && product.stock <= 0;
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-sm">{product.nome}</h3>
                          <p className="text-xs text-muted-foreground">{product.codigo}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {product.tipo === 'servico' ? 'Serviço' : 'Produto'}
                        </Badge>
                      </div>
                      {product.descricao && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.descricao}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black text-primary">{formatCurrency(product.preco_unitario)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            + IVA {product.taxa_iva}% | {product.unidade}
                          </p>
                        </div>
                        {outOfStock ? (
                          <Badge variant="destructive" className="text-[10px]">Sem stock</Badge>
                        ) : cartItem ? (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-bold w-6 text-center">{cartItem.quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(product)} className="gap-1">
                            <Plus className="w-3 h-3" /> Adicionar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} item(ns)</p>
                <p className="text-lg font-black text-primary">{formatCurrency(cartTotal)}</p>
              </div>
              <Button onClick={() => setCheckoutOpen(true)} className="gap-2">
                <Wallet className="w-4 h-4" />
                Pagar com Faktura
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x {formatCurrency(item.product.preco_unitario)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{formatCurrency(item.product.preco_unitario * item.quantity)}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatCurrency(cartIva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={processing} className="gap-2">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {processing ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
