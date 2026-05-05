import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { exportToCSV } from '@/lib/csv-export';
import {
  Coins, CalendarClock, AlertTriangle, Crown, Trophy,
  Save, Plus, History, Settings as SettingsIcon, CheckCircle,
  Ban, Bell, Edit3, Download, Loader2,
} from 'lucide-react';

const supa = supabase as any;

const Section = ({ icon: Icon, title, children }: any) => (
  <Card className="overflow-hidden">
    <CardHeader className="bg-muted/30 border-b">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-5 space-y-5">{children}</CardContent>
  </Card>
);

const SummaryCard = ({ label, value, color = 'primary' }: any) => (
  <div className={`rounded-lg border p-4 bg-${color}/5 border-${color}/20`}>
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default function GestaoFinanceira() {
  // ─── CRÉDITOS ───
  const [creditCfg, setCreditCfg] = useState<any>({ custo_por_fatura: 1, custo_mora_por_fatura: 3, faturas_gratis_challenge: 100 });
  const [credits, setCredits] = useState<any[]>([]);

  // ─── COBRANÇAS ───
  const [billingCfg, setBillingCfg] = useState<any>({
    dia_cobranca: 'sexta', hora_fecho: '23:59',
    aviso_quinta: '22:00', lembrete_sexta: '08:00',
    taxa_normal: 1, taxa_mora: 3,
    dia1_acao: 'alerta', dia3_acao: 'acesso_limitado', dia7_acao: 'suspensao',
  });
  const [charges, setCharges] = useState<any[]>([]);

  // ─── SUBSCRIÇÕES ───
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [automation, setAutomation] = useState<any>({});

  // ─── CHALLENGE ───
  const [challenge, setChallenge] = useState<any>({ total_vagas: 244, duracao_horas: 244, faturas_gratis: 100, ativo: true });
  const [participants, setParticipants] = useState<any[]>([]);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0 });

  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!challenge?.fim) return;
    const tick = () => {
      const diff = new Date(challenge.fim).getTime() - Date.now();
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0 }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown({ d, h, m });
    };
    tick();
    const i = setInterval(tick, 60000);
    return () => clearInterval(i);
  }, [challenge?.fim]);

  async function loadAll() {
    setLoading(true);
    try {
      const [
        cs, uc, bs, wc, sp, us, sa, ch, pa,
      ] = await Promise.all([
        supa.from('credit_settings').select('*').limit(1).maybeSingle(),
        supa.from('user_credits').select('*, profiles!inner(nome, faktura_id, tipo)').limit(200),
        supa.from('billing_settings').select('*').limit(1).maybeSingle(),
        supa.from('weekly_charges').select('*, profiles!inner(nome, faktura_id)').order('created_at', { ascending: false }).limit(200),
        supa.from('subscription_plans').select('*').order('preco_mensal'),
        supa.from('user_subscriptions').select('*, profiles!inner(nome, faktura_id), subscription_plans(nome)').limit(200),
        supa.from('subscription_automation').select('*').limit(1).maybeSingle(),
        supa.from('fk244_challenge').select('*').limit(1).maybeSingle(),
        supa.from('fk244_participants').select('*, profiles!inner(nome, faktura_id)').order('posicao'),
      ]);
      if (cs.data) setCreditCfg(cs.data);
      setCredits(uc.data || []);
      if (bs.data) setBillingCfg(bs.data);
      setCharges(wc.data || []);
      setPlans(sp.data || []);
      setSubscriptions(us.data || []);
      if (sa.data) setAutomation(sa.data);
      if (ch.data) setChallenge(ch.data);
      setParticipants(pa.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveCreditCfg() {
    const { error } = await supa.from('credit_settings').update({
      custo_por_fatura: Number(creditCfg.custo_por_fatura),
      custo_mora_por_fatura: Number(creditCfg.custo_mora_por_fatura),
      faturas_gratis_challenge: Number(creditCfg.faturas_gratis_challenge),
    }).eq('id', creditCfg.id);
    if (error) toast.error(error.message); else toast.success('Configuração de créditos guardada');
  }

  async function saveBillingCfg() {
    const { error } = await supa.from('billing_settings').update(billingCfg).eq('id', billingCfg.id);
    if (error) toast.error(error.message); else toast.success('Configuração de cobranças guardada');
  }

  async function saveChallenge() {
    const { error } = await supa.from('fk244_challenge').update({
      total_vagas: Number(challenge.total_vagas),
      duracao_horas: Number(challenge.duracao_horas),
      faturas_gratis: Number(challenge.faturas_gratis),
      ativo: challenge.ativo,
    }).eq('id', challenge.id);
    if (error) toast.error(error.message); else toast.success('Challenge actualizado');
  }

  async function saveAutomation(field: string, value: boolean) {
    setAutomation({ ...automation, [field]: value });
    const { error } = await supa.from('subscription_automation').update({ [field]: value }).eq('id', automation.id);
    if (error) toast.error(error.message);
  }

  async function updateChargeStatus(id: string, status: string) {
    const { error } = await supa.from('weekly_charges').update({
      status, paid_at: status === 'pago' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Estado actualizado');
    loadAll();
  }

  // ─── Computed ───
  const totalCobrar = charges.reduce((s, c) => s + Number(c.amount_total || 0), 0);
  const totalPago = charges.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.amount_total), 0);
  const totalAtraso = charges.filter(c => ['mora', 'pendente'].includes(c.status)).reduce((s, c) => s + Number(c.amount_total), 0);

  const morasList = charges.filter(c => c.status === 'mora' || (c.amount_mora && Number(c.amount_mora) > 0));
  const totalMoraValor = morasList.reduce((s, c) => s + Number(c.amount_total), 0);

  const subActivas = subscriptions.filter(s => s.estado === 'ativa').length;
  const receitaMensal = subscriptions
    .filter(s => s.estado === 'ativa')
    .reduce((sum, s) => sum + Number(s.subscription_plans?.preco_mensal || 0), 0);
  const hoje = new Date();
  const semana = new Date(hoje.getTime() + 7 * 86400000);
  const expirando = subscriptions.filter(s => {
    const exp = new Date(s.expira);
    return exp >= hoje && exp <= semana;
  }).length;

  const vagasOcupadas = participants.length;
  const vagasPercent = (vagasOcupadas / (challenge.total_vagas || 1)) * 100;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">

      {/* ═══ DIV 1 — CRÉDITOS ═══ */}
      <Section icon={Coins} title="Créditos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Custo por fatura</Label>
            <Input type="number" value={creditCfg.custo_por_fatura}
              onChange={e => setCreditCfg({ ...creditCfg, custo_por_fatura: e.target.value })} />
          </div>
          <div>
            <Label>Custo mora por fatura</Label>
            <Input type="number" value={creditCfg.custo_mora_por_fatura}
              onChange={e => setCreditCfg({ ...creditCfg, custo_mora_por_fatura: e.target.value })} />
          </div>
          <div>
            <Label>Faturas grátis challenge</Label>
            <Input type="number" value={creditCfg.faturas_gratis_challenge}
              onChange={e => setCreditCfg({ ...creditCfg, faturas_gratis_challenge: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveCreditCfg} size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Guardar configuração</Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faktura ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Usados</TableHead>
              <TableHead className="text-right">Restantes</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sem registos</TableCell></TableRow>}
            {credits.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.profiles?.faktura_id || '—'}</TableCell>
                <TableCell>{c.profiles?.nome}</TableCell>
                <TableCell><Badge variant="outline">{c.profiles?.tipo}</Badge></TableCell>
                <TableCell className="text-right">{c.credits_used}</TableCell>
                <TableCell className="text-right font-medium">{c.credits_remaining}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" title="Adicionar créditos"><Plus className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Histórico"><History className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Ajuste manual"><Edit3 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* ═══ DIV 2 — COBRANÇAS SEMANAIS ═══ */}
      <Section icon={CalendarClock} title="Cobranças Semanais">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Dia de cobrança</Label>
            <Input value={billingCfg.dia_cobranca} onChange={e => setBillingCfg({ ...billingCfg, dia_cobranca: e.target.value })} />
          </div>
          <div>
            <Label>Hora de fecho</Label>
            <Input value={billingCfg.hora_fecho} onChange={e => setBillingCfg({ ...billingCfg, hora_fecho: e.target.value })} />
          </div>
          <div>
            <Label>Aviso quinta</Label>
            <Input value={billingCfg.aviso_quinta} onChange={e => setBillingCfg({ ...billingCfg, aviso_quinta: e.target.value })} />
          </div>
          <div>
            <Label>Lembrete sexta</Label>
            <Input value={billingCfg.lembrete_sexta} onChange={e => setBillingCfg({ ...billingCfg, lembrete_sexta: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveBillingCfg} size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Guardar configuração</Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Total a cobrar" value={formatCurrency(totalCobrar)} />
          <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/20">
            <p className="text-xs text-muted-foreground uppercase">Total pago</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalPago)}</p>
          </div>
          <div className="rounded-lg border p-4 bg-red-500/5 border-red-500/20">
            <p className="text-xs text-muted-foreground uppercase">Total em atraso</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalAtraso)}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faktura ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Faturas</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sem cobranças</TableCell></TableRow>}
            {charges.map(c => {
              const cor = c.status === 'pago' ? 'bg-green-500/15 text-green-700' :
                c.status === 'mora' ? 'bg-red-500/15 text-red-700' : 'bg-amber-500/15 text-amber-700';
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.profiles?.faktura_id || '—'}</TableCell>
                  <TableCell>{c.profiles?.nome}</TableCell>
                  <TableCell className="text-right">{c.invoices_count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.amount_total)}</TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${cor}`}>{c.status}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(c.id, 'pago')} title="Marcar pago"><CheckCircle className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(c.id, 'perdoado')} title="Perdoar"><CheckCircle className="w-3.5 h-3.5 text-blue-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(c.id, 'mora')} title="Aplicar mora"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(c.id, 'bloqueado')} title="Bloquear"><Ban className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" title="Notificar"><Bell className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Section>

      {/* ═══ DIV 3 — MORAS E PENALIZAÇÕES ═══ */}
      <Section icon={AlertTriangle} title="Moras e Penalizações">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label>Taxa normal</Label>
            <Input type="number" value={billingCfg.taxa_normal} onChange={e => setBillingCfg({ ...billingCfg, taxa_normal: e.target.value })} />
          </div>
          <div>
            <Label>Taxa mora</Label>
            <Input type="number" value={billingCfg.taxa_mora} onChange={e => setBillingCfg({ ...billingCfg, taxa_mora: e.target.value })} />
          </div>
          <div>
            <Label>Dia 1 atraso</Label>
            <Input value={billingCfg.dia1_acao} onChange={e => setBillingCfg({ ...billingCfg, dia1_acao: e.target.value })} />
          </div>
          <div>
            <Label>Dia 3 atraso</Label>
            <Input value={billingCfg.dia3_acao} onChange={e => setBillingCfg({ ...billingCfg, dia3_acao: e.target.value })} />
          </div>
          <div>
            <Label>Dia 7 atraso</Label>
            <Input value={billingCfg.dia7_acao} onChange={e => setBillingCfg({ ...billingCfg, dia7_acao: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveBillingCfg} size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5" />Guardar configuração</Button>

        <div className="rounded-lg border p-4 bg-red-500/5 border-red-500/20">
          <p className="text-xs text-muted-foreground uppercase">Contas em mora / Valor total</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{morasList.length} contas — {formatCurrency(totalMoraValor)}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faktura ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Faturas</TableHead>
              <TableHead className="text-right">Valor Normal</TableHead>
              <TableHead className="text-right">Mora</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {morasList.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem moras</TableCell></TableRow>}
            {morasList.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.profiles?.faktura_id}</TableCell>
                <TableCell>{m.profiles?.nome}</TableCell>
                <TableCell className="text-right">{m.invoices_count}</TableCell>
                <TableCell className="text-right">{formatCurrency(m.amount_normal)}</TableCell>
                <TableCell className="text-right text-red-600 font-medium">{formatCurrency(m.amount_mora)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(m.amount_total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end flex-wrap">
                    <Button size="sm" variant="ghost" title="Cobrar mora"><CheckCircle className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(m.id, 'perdoado')} title="Perdoar mora"><CheckCircle className="w-3.5 h-3.5 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(m.id, 'pago')} title="Perdoar tudo"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => updateChargeStatus(m.id, 'bloqueado')} title="Bloquear"><Ban className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Notificar"><Bell className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="destructive" className="w-full sm:w-auto">Cobrar mora em todas as contas</Button>
      </Section>

      {/* ═══ DIV 4 — SUBSCRIÇÕES ═══ */}
      <Section icon={Crown} title="Subscrições">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(p => (
            <div key={p.id} className="rounded-lg border p-5 bg-gradient-to-br from-card to-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg">Plano {p.nome}</h4>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {p.preco_mensal > 0 ? `${formatCurrency(p.preco_mensal)}/mês` : 'Grátis'}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5"><Edit3 className="w-3.5 h-3.5" />Editar</Button>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>• {p.faturas_max ? `${p.faturas_max} faturas/mês` : 'Faturas ilimitadas'}</li>
                <li>• {p.features?.funcionalidades_avancadas ? 'Todas as funcionalidades' : 'Sem funcionalidades avançadas'}</li>
                <li>• {p.marca_dagua ? 'Com marca d\'água' : 'Sem marca d\'água'}</li>
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Total activas" value={subActivas} />
          <SummaryCard label="Receita mensal" value={formatCurrency(receitaMensal)} />
          <div className="rounded-lg border p-4 bg-amber-500/5 border-amber-500/20">
            <p className="text-xs text-muted-foreground uppercase">A expirar esta semana</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{expirando}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faktura ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem subscrições</TableCell></TableRow>}
            {subscriptions.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.profiles?.faktura_id}</TableCell>
                <TableCell>{s.profiles?.nome}</TableCell>
                <TableCell><Badge>{s.subscription_plans?.nome}</Badge></TableCell>
                <TableCell>{s.inicio}</TableCell>
                <TableCell>{s.expira}</TableCell>
                <TableCell><Badge variant={s.estado === 'ativa' ? 'default' : 'secondary'}>{s.estado}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end flex-wrap">
                    <Button size="sm" variant="ghost" title="Estender">+30d</Button>
                    <Button size="sm" variant="ghost" title="Mudar plano"><Edit3 className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Cancelar"><Ban className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Dias grátis"><Plus className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" title="Notificar"><Bell className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
          {[
            { k: 'notificar_7_dias', l: 'Notificar 7 dias antes' },
            { k: 'notificar_3_dias', l: 'Notificar 3 dias antes' },
            { k: 'notificar_no_dia', l: 'Notificar no dia' },
            { k: 'downgrade_automatico', l: 'Downgrade automático' },
            { k: 'graca_7_dias', l: 'Graça 7 dias' },
          ].map(({ k, l }) => (
            <div key={k} className="flex items-center justify-between gap-2 p-3 rounded border bg-muted/20">
              <Label className="text-xs">{l}</Label>
              <Switch checked={!!automation[k]} onCheckedChange={v => saveAutomation(k, v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ DIV 5 — FK-244 CHALLENGE ═══ */}
      <Section icon={Trophy} title="FK-244 Challenge">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{vagasOcupadas} de {challenge.total_vagas} vagas preenchidas</span>
            <span className="text-sm text-muted-foreground">{vagasPercent.toFixed(1)}%</span>
          </div>
          <Progress value={vagasPercent} className="h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Total vagas</Label>
            <Input type="number" value={challenge.total_vagas}
              onChange={e => setChallenge({ ...challenge, total_vagas: e.target.value })} />
          </div>
          <div>
            <Label>Duração (horas)</Label>
            <Input type="number" value={challenge.duracao_horas}
              onChange={e => setChallenge({ ...challenge, duracao_horas: e.target.value })} />
          </div>
          <div>
            <Label>Faturas grátis</Label>
            <Input type="number" value={challenge.faturas_gratis}
              onChange={e => setChallenge({ ...challenge, faturas_gratis: e.target.value })} />
          </div>
          <div className="flex items-end gap-3 p-3 rounded border bg-muted/20">
            <div className="flex-1">
              <Label>Challenge activo</Label>
              <div className="text-xs text-muted-foreground mt-1">{challenge.ativo ? 'Em curso' : 'Parado'}</div>
            </div>
            <Switch checked={!!challenge.ativo} onCheckedChange={v => setChallenge({ ...challenge, ativo: v })} />
          </div>
        </div>

        <div className="rounded-lg border-2 border-primary/30 p-5 bg-gradient-to-br from-primary/5 to-primary/10 text-center">
          <p className="text-xs uppercase text-muted-foreground tracking-wider">Tempo restante</p>
          <div className="flex justify-center gap-6 mt-2">
            <div><span className="text-3xl font-bold text-primary">{countdown.d}</span><span className="text-xs ml-1">dias</span></div>
            <div><span className="text-3xl font-bold text-primary">{countdown.h}</span><span className="text-xs ml-1">horas</span></div>
            <div><span className="text-3xl font-bold text-primary">{countdown.m}</span><span className="text-xs ml-1">min</span></div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={saveChallenge} className="gap-1.5"><Save className="w-3.5 h-3.5" />Guardar</Button>
          <Button variant="destructive" onClick={() => { setChallenge({ ...challenge, ativo: false }); saveChallenge(); }}>Encerrar challenge</Button>
          <Button variant="outline" onClick={() => {
            const novoFim = new Date(new Date(challenge.fim).getTime() + 24 * 3600 * 1000).toISOString();
            setChallenge({ ...challenge, fim: novoFim });
            supa.from('fk244_challenge').update({ fim: novoFim }).eq('id', challenge.id).then(() => toast.success('Challenge estendido +24h'));
          }}>Estender challenge (+24h)</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Faktura ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Data registo</TableHead>
              <TableHead className="text-right">Faturas usadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem participantes</TableCell></TableRow>}
            {participants.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-bold">#{p.posicao}</TableCell>
                <TableCell className="font-mono text-xs">{p.profiles?.faktura_id}</TableCell>
                <TableCell>{p.profiles?.nome}</TableCell>
                <TableCell>{new Date(p.data_registo).toLocaleString('pt-PT')}</TableCell>
                <TableCell className="text-right">{p.faturas_usadas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="outline" className="gap-1.5" onClick={() => {
          exportToCSV(
            participants.map(p => ({
              posicao: p.posicao,
              faktura_id: p.profiles?.faktura_id || '',
              nome: p.profiles?.nome || '',
              data_registo: p.data_registo,
              faturas_usadas: p.faturas_usadas,
            })),
            [
              { key: 'posicao', label: 'Posição' },
              { key: 'faktura_id', label: 'Faktura ID' },
              { key: 'nome', label: 'Nome' },
              { key: 'data_registo', label: 'Data registo' },
              { key: 'faturas_usadas', label: 'Faturas usadas' },
            ],
            'fk244-challenge'
          );
        }}><Download className="w-3.5 h-3.5" />Exportar</Button>
      </Section>

    </div>
  );
}
