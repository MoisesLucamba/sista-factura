import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import {
  CreditCard, Check, Wallet, Zap, FileText, Loader2, Plus, Receipt,
  Calendar, RotateCw, CheckCircle2, AlertTriangle, Clock, ShoppingCart, BarChart3, FileCode2,
} from 'lucide-react';

const PLATFORM_FEE = 8000;
const PER_INVOICE_FEE = 1;
const QUICK_TOPUPS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function Subscricao() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(10000);
  const [method, setMethod] = useState<'multicaixa' | 'wallet' | 'transferencia'>('multicaixa');
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  // Subscription
  const { data: sub } = useQuery({
    queryKey: ['subscription', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  // Subscription invoices history
  const { data: invoices } = useQuery({
    queryKey: ['sub-invoices', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('subscription_invoices').select('*').order('period_start', { ascending: false }).limit(12);
      return data || [];
    },
  });

  // Wallet balance + month docs
  const { data: walletStats } = useQuery({
    queryKey: ['subscricao-wallet', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('amount, type, status').eq('status', 'completed');
      const all = data || [];
      const inflow = all.filter(t => t.type === 'deposit' || t.type === 'payment').reduce((s, t) => s + Number(t.amount), 0);
      const outflow = all.filter(t => t.type === 'transfer' || t.type === 'withdrawal' || t.type === 'fee').reduce((s, t) => s + Number(t.amount), 0);
      return { balance: inflow - outflow };
    },
  });
  const { data: monthStats } = useQuery({
    queryKey: ['subscricao-month', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await supabase.from('faturas').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString());
      return { count: count || 0 };
    },
  });

  const balance = walletStats?.balance || 0;
  const docCount = monthStats?.count || 0;
  const projectedMonth = PLATFORM_FEE + docCount * PER_INVOICE_FEE;

  const activate = async () => {
    if (!user) return;
    setActivating(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const nextBill = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        status: 'active',
        plan_fee: PLATFORM_FEE,
        per_doc_fee: PER_INVOICE_FEE,
        current_period_start: start.toISOString().substring(0, 10),
        current_period_end: end.toISOString().substring(0, 10),
        next_billing_at: nextBill.toISOString(),
        auto_renew: true,
        payment_method: method,
      });
      if (error) throw error;
      toast.success('Subscrição activada — renovação automática ligada');
      qc.invalidateQueries({ queryKey: ['subscription'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActivating(false);
    }
  };

  const updateSub = async (patch: any) => {
    if (!sub) return;
    const { error } = await supabase.from('subscriptions').update(patch).eq('id', sub.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['subscription'] });
  };

  const recharge = async () => {
    if (!user || !amount || amount < 100) { toast.error('Valor mínimo: 100 Kz'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id, type: 'deposit', amount, status: 'completed',
        description: `Carregamento via ${method}`, metadata: { method, source: 'subscricao' },
      });
      if (error) throw error;
      toast.success(`Carteira carregada com ${formatCurrency(amount)}`);
      qc.invalidateQueries({ queryKey: ['subscricao-wallet'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  const payNow = async (invoiceId: string) => {
    setPaying(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke('subscription-charge', {
        body: { invoice_id: invoiceId, method: sub?.payment_method },
      });
      if (error) throw error;
      if (data?.ok) toast.success('Pagamento concluído');
      else toast.error(data?.error || 'Falha no pagamento');
      qc.invalidateQueries({ queryKey: ['sub-invoices'] });
      qc.invalidateQueries({ queryKey: ['subscription'] });
    } catch (e: any) { toast.error(e.message); }
    finally { setPaying(null); }
  };

  const subBadge = (s?: string) => {
    if (s === 'active') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Activa</Badge>;
    if (s === 'grace') return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Em período de graça</Badge>;
    if (s === 'suspended') return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Suspensa</Badge>;
    if (s === 'cancelled') return <Badge variant="outline">Cancelada</Badge>;
    return <Badge variant="outline">Sem subscrição</Badge>;
  };

  const invStatus = (s: string) => {
    if (s === 'paid') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Paga</Badge>;
    if (s === 'failed') return <Badge className="bg-red-500/15 text-red-600 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Falhou</Badge>;
    if (s === 'overdue') return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30">Em atraso</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Subscrição & Carteira</h1>
            <p className="text-xs text-muted-foreground">Débito mensal automático: {formatCurrency(PLATFORM_FEE)} + {formatCurrency(PER_INVOICE_FEE)} por documento emitido.</p>
          </div>
        </div>

        {/* Subscrição activa */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Estado da subscrição</CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <CardTitle className="text-2xl font-black">{sub ? formatCurrency(Number(sub.plan_fee))+'/mês' : 'Não activa'}</CardTitle>
                  {subBadge(sub?.status)}
                </div>
              </div>
              {sub && (
                <div className="text-right text-xs">
                  <p className="text-muted-foreground">Próximo débito</p>
                  <p className="font-bold flex items-center gap-1"><Calendar className="w-3 h-3" />{sub.next_billing_at ? format(new Date(sub.next_billing_at), 'dd/MM/yyyy') : '—'}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!sub ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Activa a subscrição para começar a emitir documentos. {formatCurrency(PLATFORM_FEE)}/mês + {formatCurrency(PER_INVOICE_FEE)} por documento (cobrado no fim do ciclo).</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {([
                    { v: 'multicaixa', icon: 'fa-solid fa-mobile-screen-button', label: 'Multicaixa Express' },
                    { v: 'wallet', icon: 'fa-solid fa-wallet', label: 'Carteira Faktura' },
                    { v: 'transferencia', icon: 'fa-solid fa-building-columns', label: 'Transferência' },
                  ] as const).map(opt => (
                    <button key={opt.v} onClick={() => setMethod(opt.v)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${method === opt.v ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted border-border'}`}>
                      <i className={`${opt.icon} w-4 text-center`} />
                      <span className="flex-1 text-left">{opt.label}</span>
                      {method === opt.v && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                <Button onClick={activate} disabled={activating} className="w-full h-11 font-bold gap-2">
                  {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Activar subscrição
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <p className="text-muted-foreground">Documentos este mês</p>
                    <p className="text-lg font-black font-mono">{docCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <p className="text-muted-foreground">Projecção do mês</p>
                    <p className="text-lg font-black font-mono">{formatCurrency(projectedMonth)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border">
                    <p className="text-muted-foreground">Saldo carteira</p>
                    <p className="text-lg font-black font-mono">{formatCurrency(balance)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-semibold">Renovação automática</p>
                    <p className="text-[11px] text-muted-foreground">Renovação até ao fim do ciclo, débito automático.</p>
                  </div>
                  <Switch checked={sub.auto_renew} onCheckedChange={(v) => updateSub({ auto_renew: v })} />
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-semibold">Método de pagamento</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {(['multicaixa', 'wallet', 'transferencia'] as const).map(v => (
                      <button key={v} onClick={() => updateSub({ payment_method: v })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${sub.payment_method === v ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de cobrança */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4" /> Histórico de cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            {!invoices?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem cobranças registadas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2 px-2">Período</th>
                      <th className="text-center py-2 px-2">Docs</th>
                      <th className="text-right py-2 px-2">Total</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Acção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b">
                        <td className="py-2 px-2 font-mono">{inv.period_start?.substring(0, 7)}</td>
                        <td className="py-2 px-2 text-center">{inv.documents_count}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{formatCurrency(Number(inv.total))}</td>
                        <td className="py-2 px-2">{invStatus(inv.status)}</td>
                        <td className="py-2 px-2 text-right">
                          {(inv.status === 'pending' || inv.status === 'failed' || inv.status === 'overdue') && (
                            <Button size="sm" variant="outline" onClick={() => payNow(inv.id)} disabled={paying === inv.id}>
                              {paying === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pagar agora'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incluído */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incluído na taxa mensal</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: ShoppingCart, label: 'POS — Ponto de Venda' },
              { icon: BarChart3, label: 'Relatórios completos' },
              { icon: FileCode2, label: 'Exportação & envio SAF-T' },
              { icon: Wallet, label: 'Carteira & Pagamentos' },
              { icon: Receipt, label: 'Gestão de Stock' },
              { icon: FileText, label: 'Todos os tipos de documento' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg border bg-card/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><f.icon className="w-4 h-4 text-primary" /></div>
                <span className="text-sm font-medium">{f.label}</span>
                <Check className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Carregar carteira */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Carregar carteira</CardTitle>
            <CardDescription className="text-xs">Mantenha saldo para cobrir as cobranças mensais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QUICK_TOPUPS.map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${amount === v ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted border-border'}`}>
                  {v.toLocaleString('pt-PT')}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor (Kz)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={100} step={100} className="font-mono text-lg font-bold" />
            </div>
            <Separator />
            <Button onClick={recharge} disabled={loading} className="w-full h-11 font-bold gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Carregar {formatCurrency(amount || 0)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
