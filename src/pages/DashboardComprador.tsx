import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet, User, ShoppingBag, Star, LogOut, Copy, CheckCircle,
  Loader2, TrendingUp, Gift, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import logoFaktura from '@/assets/logo-faktura.png';

interface WalletData {
  faktura_id: string;
  pontos: number;
  saldo: number;
}

interface Purchase {
  id: string;
  vendor_name: string | null;
  descricao: string | null;
  valor: number;
  pontos_ganhos: number;
  created_at: string;
}

export default function DashboardComprador() {
  const { user, profile, signOut } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [walletRes, purchasesRes] = await Promise.all([
        supabase.from('buyer_wallets').select('faktura_id, pontos, saldo').eq('user_id', user.id).single(),
        supabase.from('buyer_purchases').select('*').eq('buyer_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);
      if (walletRes.data) setWallet(walletRes.data as WalletData);
      if (purchasesRes.data) setPurchases(purchasesRes.data as Purchase[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const copyId = () => {
    if (wallet?.faktura_id) {
      navigator.clipboard.writeText(wallet.faktura_id);
      setCopied(true);
      toast.success('ID copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .afu { animation: fade-up .5s ease both; }
        .shimmer-text {
          background: linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%);
          background-size:200% auto; -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <img src={logoFaktura} alt="Faktura" className="h-8 object-contain" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {profile?.nome}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Welcome + ID Card */}
        <div className="afu" style={{ animationDelay: '0ms' }}>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bem-vindo de volta 👋</p>
                  <h1 className="text-2xl font-black tracking-tight">
                    <span className="shimmer-text">{profile?.nome}</span>
                  </h1>
                </div>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Seu ID Faktura</p>
                    <p className="text-xl font-black text-primary tracking-wider">{wallet?.faktura_id || '---'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyId}>
                    {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="afu grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '100ms' }}>
          {[
            { icon: Wallet, label: 'Saldo', value: formatCurrency(wallet?.saldo || 0), color: 'text-primary' },
            { icon: Star, label: 'Pontos', value: `${wallet?.pontos || 0} pts`, color: 'text-amber-500' },
            { icon: ShoppingBag, label: 'Compras', value: `${purchases.length}`, color: 'text-emerald-500' },
            { icon: TrendingUp, label: 'Ganhos', value: formatCurrency(purchases.reduce((s, p) => s + p.pontos_ganhos, 0) * 1), color: 'text-blue-500' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                <p className="text-lg font-black">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Card */}
        <div className="afu" style={{ animationDelay: '200ms' }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Nome', value: profile?.nome },
                { label: 'Email', value: profile?.email },
                { label: 'NIF', value: (profile as any)?.nif || 'Não informado' },
                { label: 'Telefone', value: (profile as any)?.telefone || 'Não informado' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        <div className="afu" style={{ animationDelay: '300ms' }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Histórico de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma compra registada ainda</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Partilhe o seu ID <strong className="text-primary">{wallet?.faktura_id}</strong> ao fazer compras
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {purchases.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{p.vendor_name || 'Loja'}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.descricao || 'Compra'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold">{formatCurrency(p.valor)}</p>
                        {p.pontos_ganhos > 0 && (
                          <p className="text-xs text-primary font-semibold flex items-center gap-1 justify-end">
                            <Gift className="w-3 h-3" /> +{p.pontos_ganhos} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="afu" style={{ animationDelay: '400ms' }}>
          <Card className="bg-primary/5 border-primary/15">
            <CardContent className="p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Como ganhar pontos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '1', text: 'Partilhe o seu ID ao comprar' },
                  { step: '2', text: 'A empresa emite a fatura com o seu ID' },
                  { step: '3', text: 'Receba 50 Kz por fatura acima de 1.500 Kz' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
