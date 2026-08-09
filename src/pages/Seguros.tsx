import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSegurosPedidos, useCriarSeguroPedido } from '@/hooks/useSeguros';
import { useEmpresa } from '@/hooks/useCredito';
import { formatCurrency, formatDate } from '@/lib/format';
import { ShieldCheck, Loader2, Send, HeartPulse, Truck, Flame, Users } from 'lucide-react';

const TIPOS = [
  { value: 'multirriscos', label: 'Multirriscos comercial', icon: Flame,
    desc: 'Incêndio, roubo, danos por água e responsabilidade civil no teu estabelecimento.' },
  { value: 'acidentes_trabalho', label: 'Acidentes de trabalho', icon: Users,
    desc: 'Obrigatório para empresas com trabalhadores por conta de outrem.' },
  { value: 'saude', label: 'Saúde colectiva', icon: HeartPulse,
    desc: 'Plano de saúde para a equipa, com rede de clínicas parceiras.' },
  { value: 'frota', label: 'Frota automóvel', icon: Truck,
    desc: 'Cobertura para as viaturas ao serviço da empresa.' },
  { value: 'credito', label: 'Seguro de crédito', icon: ShieldCheck,
    desc: 'Protege a empresa contra incumprimento de clientes e garante financiamentos.' },
];

const ESTADO_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  em_contacto: 'Em contacto',
  proposta: 'Proposta emitida',
  fechado: 'Concluído',
  rejeitado: 'Recusado',
};

export default function Seguros() {
  const { data: pedidos, isLoading } = useSegurosPedidos();
  const { data: empresa } = useEmpresa();
  const criar = useCriarSeguroPedido();

  const [form, setForm] = useState({
    tipo: 'multirriscos',
    valor_seguro: '',
    num_trabalhadores: '',
    actividade: '',
    contacto: '',
    notas: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    criar.mutate({
      tipo: form.tipo,
      valor_seguro: Number(form.valor_seguro.replace(/\D/g, '')) || 0,
      num_trabalhadores: Number(form.num_trabalhadores.replace(/\D/g, '')) || 0,
      actividade: form.actividade.trim() || null,
      contacto: form.contacto.trim() || null,
      notas: form.notas.trim() || null,
      empresa_id: empresa?.id ?? null,
    }, {
      onSuccess: () => setForm(f => ({ ...f, valor_seguro: '', num_trabalhadores: '', notas: '' })),
    });
  };

  const tipoActual = TIPOS.find(t => t.value === form.tipo);

  return (
    <MainLayout
      title="Seguros PME"
      description="Pede uma proposta de seguro para a tua empresa. Usamos os dados da tua faturação para acelerar a cotação."
      loading={isLoading}
      maxWidth="xl"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Novo pedido de seguro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de seguro *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {tipoActual && (
                  <p className="text-xs text-muted-foreground">{tipoActual.desc}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor a segurar (AOA)</Label>
                  <Input inputMode="numeric" value={form.valor_seguro}
                         onChange={e => setForm(f => ({ ...f, valor_seguro: e.target.value }))}
                         placeholder="10000000" />
                </div>
                <div className="space-y-2">
                  <Label>Nº de trabalhadores</Label>
                  <Input inputMode="numeric" value={form.num_trabalhadores}
                         onChange={e => setForm(f => ({ ...f, num_trabalhadores: e.target.value }))}
                         placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label>Actividade da empresa</Label>
                  <Input value={form.actividade}
                         onChange={e => setForm(f => ({ ...f, actividade: e.target.value }))}
                         placeholder="Comércio a retalho" />
                </div>
                <div className="space-y-2">
                  <Label>Contacto para a cotação</Label>
                  <Input value={form.contacto}
                         onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                         placeholder="+244 9XX XXX XXX" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea rows={3} value={form.notas}
                          onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                          placeholder="Detalhes relevantes: número de lojas, viaturas, stock médio..." />
              </div>

              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar pedido
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coberturas disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {TIPOS.map(t => (
                <div key={t.value} className="flex gap-3 rounded-xl border border-border p-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
                    <t.icon className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Os teus pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!pedidos || pedidos.length === 0) && (
                <p className="text-sm text-muted-foreground">Ainda não tens pedidos de seguro.</p>
              )}
              {pedidos?.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {TIPOS.find(t => t.value === p.tipo)?.label ?? p.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(p.valor_seguro))} · {formatDate(p.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary">{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
