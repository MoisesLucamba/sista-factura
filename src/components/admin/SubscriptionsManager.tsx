import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, Calendar, RefreshCw, Loader2, Crown, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  id: string;
  nome: string;
  preco_mensal: number;
  periodo: string;
  dias_gratis: number;
  faturas_max: number | null;
  ativo: boolean;
  descricao?: string | null;
}

interface UserSub {
  id: string;
  user_id: string;
  plan_id: string;
  inicio: string;
  expira: string;
  estado: string;
  trial_ends_at: string | null;
  notes: string | null;
  granted_by: string | null;
  user_nome?: string;
  user_email?: string;
  user_faktura_id?: string;
  plan_nome?: string;
  plan_preco?: number;
  plan_periodo?: string;
}

const PERIOD_DAYS: Record<string, number> = { mensal: 30, trimestral: 90, anual: 365 };

export default function SubscriptionsManager() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<UserSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('subs');

  // Grant dialog
  const [showGrant, setShowGrant] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantTrialDays, setGrantTrialDays] = useState(15);
  const [grantNotes, setGrantNotes] = useState('');
  const [granting, setGranting] = useState(false);

  // Plan editor
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: plansData } = await (supabase as any).from('subscription_plans').select('*').order('preco_mensal');
    setPlans((plansData || []) as Plan[]);

    const { data: subsData } = await (supabase as any)
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsData?.length) {
      const userIds = [...new Set(subsData.map((s: any) => s.user_id))];
      const planIds = [...new Set(subsData.map((s: any) => s.plan_id))];
      const { data: profs } = await supabase.from('profiles').select('user_id, nome, email, faktura_id').in('user_id', userIds);
      const { data: pls } = await (supabase as any).from('subscription_plans').select('id, nome, preco_mensal, periodo').in('id', planIds);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      const planMap = new Map((pls || []).map((p: any) => [p.id, p]));
      const enriched = subsData.map((s: any) => ({
        ...s,
        user_nome: profMap.get(s.user_id)?.nome,
        user_email: profMap.get(s.user_id)?.email,
        user_faktura_id: profMap.get(s.user_id)?.faktura_id,
        plan_nome: planMap.get(s.plan_id)?.nome,
        plan_preco: planMap.get(s.plan_id)?.preco_mensal,
        plan_periodo: planMap.get(s.plan_id)?.periodo,
      }));
      setSubs(enriched as UserSub[]);
    } else {
      setSubs([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredSubs = useMemo(() => {
    if (!search) return subs;
    const q = search.toLowerCase();
    return subs.filter(s =>
      s.user_nome?.toLowerCase().includes(q) ||
      s.user_email?.toLowerCase().includes(q) ||
      s.user_faktura_id?.toLowerCase().includes(q)
    );
  }, [subs, search]);

  const grantSubscription = async () => {
    if (!grantEmail || !grantPlanId) { toast.error('Email e plano são obrigatórios'); return; }
    setGranting(true);

    // Find user by email
    const { data: prof } = await supabase.from('profiles').select('user_id').ilike('email', grantEmail.trim()).maybeSingle();
    if (!prof) { toast.error('Utilizador não encontrado com este email'); setGranting(false); return; }

    const plan = plans.find(p => p.id === grantPlanId);
    const days = PERIOD_DAYS[plan?.periodo || 'mensal'] || 30;
    const today = new Date();
    const trialEnd = grantTrialDays > 0 ? new Date(today.getTime() + grantTrialDays * 86400000) : null;
    const expira = new Date(today.getTime() + (days + grantTrialDays) * 86400000);

    const payload = {
      user_id: prof.user_id,
      plan_id: grantPlanId,
      inicio: today.toISOString().split('T')[0],
      expira: expira.toISOString().split('T')[0],
      trial_ends_at: trialEnd ? trialEnd.toISOString().split('T')[0] : null,
      estado: 'ativa',
      notes: grantNotes || null,
      granted_by: user?.id,
    };

    const { error } = await (supabase as any).from('user_subscriptions').upsert(payload, { onConflict: 'user_id' });
    if (error) toast.error('Erro: ' + error.message);
    else {
      toast.success('Subscrição atribuída!');
      setShowGrant(false);
      setGrantEmail(''); setGrantNotes(''); setGrantPlanId(''); setGrantTrialDays(15);
      load();
    }
    setGranting(false);
  };

  const extendSubscription = async (sub: UserSub, days: number) => {
    const newDate = new Date(new Date(sub.expira).getTime() + days * 86400000);
    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .update({ expira: newDate.toISOString().split('T')[0], estado: 'ativa' })
      .eq('id', sub.id);
    if (error) toast.error('Erro ao estender'); else { toast.success(`Estendida +${days} dias`); load(); }
  };

  const cancelSubscription = async (sub: UserSub) => {
    if (!confirm('Cancelar subscrição?')) return;
    const { error } = await (supabase as any).from('user_subscriptions').update({ estado: 'cancelada' }).eq('id', sub.id);
    if (error) toast.error('Erro'); else { toast.success('Cancelada'); load(); }
  };

  const reactivateSubscription = async (sub: UserSub) => {
    const { error } = await (supabase as any).from('user_subscriptions').update({ estado: 'ativa' }).eq('id', sub.id);
    if (error) toast.error('Erro'); else { toast.success('Reativada'); load(); }
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    const { id, ...updates } = editingPlan;
    const { error } = await (supabase as any).from('subscription_plans').update(updates).eq('id', id);
    if (error) toast.error('Erro'); else { toast.success('Plano atualizado'); setEditingPlan(null); load(); }
  };

  const subStatusBadge = (sub: UserSub) => {
    const today = new Date().toISOString().split('T')[0];
    const expired = sub.expira < today;
    const inTrial = sub.trial_ends_at && sub.trial_ends_at >= today;
    if (sub.estado === 'cancelada') return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Cancelada</Badge>;
    if (expired) return <Badge variant="outline" className="border-red-400 text-red-600 gap-1"><Clock className="w-3 h-3" />Expirada</Badge>;
    if (inTrial) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Crown className="w-3 h-3" />Trial</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Ativa</Badge>;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="subs" className="gap-1.5"><CreditCard className="w-4 h-4" />Subscrições ({subs.length})</TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5"><Crown className="w-4 h-4" />Planos ({plans.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1"><RefreshCw className="w-3.5 h-3.5" />Atualizar</Button>
            <Button size="sm" onClick={() => setShowGrant(true)} className="gap-1"><Plus className="w-3.5 h-3.5" />Atribuir Plano</Button>
          </div>
        </div>

        <TabsContent value="subs" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por nome, email ou Faktura ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filteredSubs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma subscrição encontrada.</CardContent></Card>
          ) : filteredSubs.map(sub => (
            <Card key={sub.id} className="border-border/50">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{sub.user_nome || '—'}</p>
                    {subStatusBadge(sub)}
                    <Badge variant="outline" className="text-[10px]">{sub.plan_nome} · {sub.plan_periodo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{sub.user_email} · {sub.user_faktura_id}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span><Calendar className="w-3 h-3 inline mr-1" />Início: {sub.inicio}</span>
                    <span>Expira: {sub.expira}</span>
                    {sub.trial_ends_at && <span className="text-amber-600">Trial até: {sub.trial_ends_at}</span>}
                    <span className="text-emerald-600 font-bold">{formatCurrency(sub.plan_preco || 0)}</span>
                  </p>
                  {sub.notes && <p className="text-[11px] text-muted-foreground italic mt-1">📝 {sub.notes}</p>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => extendSubscription(sub, 30)}>+30 dias</Button>
                  <Button size="sm" variant="outline" onClick={() => extendSubscription(sub, 90)}>+90 dias</Button>
                  {sub.estado === 'cancelada'
                    ? <Button size="sm" variant="outline" onClick={() => reactivateSubscription(sub)} className="text-emerald-600">Reativar</Button>
                    : <Button size="sm" variant="outline" onClick={() => cancelSubscription(sub)} className="text-destructive">Cancelar</Button>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="plans" className="space-y-3">
          {plans.map(p => (
            <Card key={p.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{p.nome}</p>
                    <Badge variant="outline">{p.periodo}</Badge>
                    {p.ativo ? <Badge className="bg-emerald-500/15 text-emerald-600">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-bold text-primary">{formatCurrency(p.preco_mensal)}</span>
                    {p.dias_gratis > 0 && <span className="ml-2 text-amber-600">{p.dias_gratis} dias grátis</span>}
                    {p.faturas_max && <span className="ml-2">· até {p.faturas_max} faturas</span>}
                  </p>
                  {p.descricao && <p className="text-xs text-muted-foreground mt-1">{p.descricao}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingPlan({ ...p })}>Editar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Grant Dialog */}
      <Dialog open={showGrant} onOpenChange={setShowGrant}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir subscrição manualmente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email do utilizador *</Label>
              <Input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Plano *</Label>
              <Select value={grantPlanId} onValueChange={setGrantPlanId}>
                <SelectTrigger><SelectValue placeholder="Escolher plano..." /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.ativo).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {formatCurrency(p.preco_mensal)} ({p.periodo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dias grátis (trial)</Label>
              <Input type="number" value={grantTrialDays} onChange={e => setGrantTrialDays(Number(e.target.value) || 0)} />
              <p className="text-[11px] text-muted-foreground mt-1">Default: 15 dias.</p>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea value={grantNotes} onChange={e => setGrantNotes(e.target.value)} placeholder="Motivo, cortesia, etc." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrant(false)}>Cancelar</Button>
            <Button onClick={grantSubscription} disabled={granting}>
              {granting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={o => !o && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar plano</DialogTitle></DialogHeader>
          {editingPlan && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editingPlan.nome} onChange={e => setEditingPlan({ ...editingPlan, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (Kz)</Label><Input type="number" value={editingPlan.preco_mensal} onChange={e => setEditingPlan({ ...editingPlan, preco_mensal: Number(e.target.value) })} /></div>
                <div>
                  <Label>Período</Label>
                  <Select value={editingPlan.periodo} onValueChange={v => setEditingPlan({ ...editingPlan, periodo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dias grátis</Label><Input type="number" value={editingPlan.dias_gratis} onChange={e => setEditingPlan({ ...editingPlan, dias_gratis: Number(e.target.value) })} /></div>
                <div><Label>Limite faturas</Label><Input type="number" value={editingPlan.faturas_max ?? ''} onChange={e => setEditingPlan({ ...editingPlan, faturas_max: e.target.value ? Number(e.target.value) : null })} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={editingPlan.descricao || ''} onChange={e => setEditingPlan({ ...editingPlan, descricao: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo" checked={editingPlan.ativo} onChange={e => setEditingPlan({ ...editingPlan, ativo: e.target.checked })} />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            <Button onClick={savePlan}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
