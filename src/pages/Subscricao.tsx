import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import {
  CreditCard, Check, Wallet, Zap, FileText, ShoppingCart,
  BarChart3, FileCode2, Loader2, Plus, Receipt,
} from 'lucide-react';

const PLATFORM_FEE = 8000;       // Kz / mês — POS, relatórios, SAF-T, ferramentas gerais
const PER_INVOICE_FEE = 1;       // 1 Kz por fatura/documento emitido

const QUICK_TOPUPS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function Subscricao() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(10000);
  const [method, setMethod] = useState<'multicaixa' | 'transferencia' | 'carteira'>('multicaixa');
  const [loading, setLoading] = useState(false);

  // Saldo (somatório de transactions tipo deposit menos consumo) — leitura best-effort
  const { data: walletStats } = useQuery({
    queryKey: ['subscricao-wallet', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('status', 'completed');
      const all = data || [];
      const inflow = all.filter(t => t.type === 'deposit' || t.type === 'payment').reduce((s, t) => s + Number(t.amount), 0);
      const outflow = all.filter(t => t.type === 'transfer' || t.type === 'withdrawal' || t.type === 'fee').reduce((s, t) => s + Number(t.amount), 0);
      return { balance: inflow - outflow };
    },
  });

  // Quantidade de faturas/documentos emitidos no mês atual (para projecção)
  const { data: monthStats } = useQuery({
    queryKey: ['subscricao-month', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('faturas')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString());
      return { count: count || 0 };
    },
  });

  const balance = walletStats?.balance || 0;
  const docCount = monthStats?.count || 0;
  const projectedMonth = PLATFORM_FEE + (docCount * PER_INVOICE_FEE);

  const recharge = async () => {
    if (!user || !amount || amount < 100) {
      toast.error('Valor mínimo: 100 Kz');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount,
        status: 'completed',
        description: `Carregamento via ${method}`,
        metadata: { method, source: 'subscricao' },
      });
      if (error) throw error;
      toast.success(`Carteira carregada com ${formatCurrency(amount)}`);
      qc.invalidateQueries({ queryKey: ['subscricao-wallet'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar carteira');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Subscrição & Carteira</h1>
            <p className="text-xs text-muted-foreground">Carregue a sua carteira de faturas. Pague apenas o que usa.</p>
          </div>
        </div>

        {/* Saldo & projecção */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Saldo da carteira</CardDescription>
              <CardTitle className="text-4xl font-black font-mono">{formatCurrency(balance)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Receipt className="w-3.5 h-3.5" />
                <span>{docCount} documentos emitidos este mês · projecção: <strong className="text-foreground">{formatCurrency(projectedMonth)}</strong></span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Modelo de cobrança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-primary mt-0.5" />
                <p><strong>{formatCurrency(PLATFORM_FEE)}/mês</strong> — uso da plataforma (POS, Relatórios, SAF-T)</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-primary mt-0.5" />
                <p><strong>{formatCurrency(PER_INVOICE_FEE)} por documento</strong> emitido (FT, FR, NC, GR…)</p>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">Cobrado mensalmente após o uso, debitado da carteira.</p>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades incluídas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incluído na taxa mensal</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: ShoppingCart, label: 'POS — Ponto de Venda' },
              { icon: BarChart3,    label: 'Relatórios completos' },
              { icon: FileCode2,    label: 'Exportação SAF-T (AGT)' },
              { icon: Wallet,       label: 'Carteira & Pagamentos' },
              { icon: Receipt,      label: 'Gestão de Stock' },
              { icon: FileText,     label: 'Todos os tipos de documento' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg border bg-card/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{f.label}</span>
                <Check className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Carregar carteira */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" /> Carregar carteira
            </CardTitle>
            <CardDescription className="text-xs">Carregue a sua carteira para cobrir a taxa mensal e a emissão de documentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QUICK_TOPUPS.map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    amount === v
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  {v.toLocaleString('pt-PT')}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Valor (Kz)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={100}
                step={100}
                className="font-mono text-lg font-bold"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Método de pagamento</Label>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { v: 'multicaixa' as const, icon: 'fa-solid fa-mobile-screen-button', label: 'Multicaixa Express' },
                  { v: 'transferencia' as const, icon: 'fa-solid fa-building-columns', label: 'Transferência' },
                  { v: 'carteira' as const, icon: 'fa-solid fa-wallet', label: 'Outra carteira' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setMethod(opt.v)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                      method === opt.v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                  >
                    <i className={`${opt.icon} w-4 text-center`} aria-hidden="true"></i>
                    <span className="flex-1 text-left">{opt.label}</span>
                    {method === opt.v && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={recharge} disabled={loading} className="w-full h-11 font-bold gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Carregar {formatCurrency(amount || 0)}
            </Button>

            <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground space-y-1">
              <p><Badge variant="outline" className="mr-1 text-[9px]">Importante</Badge>
                As emissões de documentos só são debitadas da carteira no final do mês. Mantenha saldo suficiente para evitar a suspensão.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
