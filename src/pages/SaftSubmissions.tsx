import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileCode2, Loader2, Send, RotateCw, CheckCircle2, AlertTriangle, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function SaftSubmissions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [manualPeriod, setManualPeriod] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ['saft-submissions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saft_submissions')
        .select('*')
        .order('period', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const trigger = async (period?: string) => {
    const key = period || 'auto';
    setSubmitting(key);
    try {
      const { data, error } = await supabase.functions.invoke('saft-submit', {
        body: { user_id: user?.id, period },
      });
      if (error) throw error;
      toast.success(`Submissão processada (${data?.processed || 0} períodos)`);
      qc.invalidateQueries({ queryKey: ['saft-submissions'] });
    } catch (e: any) {
      toast.error(e.message || 'Falha na submissão');
    } finally {
      setSubmitting(null);
    }
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from('saft').createSignedUrl(path, 60);
    if (error) { toast.error('Não foi possível obter o ficheiro'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const statusBadge = (s: string) => {
    if (s === 'sent') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>;
    if (s === 'error') return <Badge className="bg-red-500/15 text-red-600 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <FileCode2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Envios SAF-T à AGT</h1>
            <p className="text-xs text-muted-foreground">Submissão programática mensal — corre automaticamente até dia 5 de cada mês.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissão manual</CardTitle>
            <CardDescription className="text-xs">
              Indique o período (YYYY-MM) para gerar e enviar o ficheiro SAF-T. Deixe vazio para usar o mês anterior.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Período</Label>
              <Input type="month" value={manualPeriod} onChange={(e) => setManualPeriod(e.target.value)} />
            </div>
            <Button onClick={() => trigger(manualPeriod)} disabled={!!submitting} className="gap-2">
              {submitting === manualPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submeter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : !rows?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma submissão registada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left py-2 px-2">Período</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Submetido em</th>
                      <th className="text-left py-2 px-2">Ref. AGT</th>
                      <th className="text-center py-2 px-2">Tent.</th>
                      <th className="text-right py-2 px-2">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-2 font-mono font-bold">{r.period}</td>
                        <td className="py-2 px-2">{statusBadge(r.status)}</td>
                        <td className="py-2 px-2 text-xs">
                          {r.submitted_at ? format(new Date(r.submitted_at), 'dd/MM/yyyy HH:mm') : '—'}
                        </td>
                        <td className="py-2 px-2 font-mono text-xs">{r.agt_reference || '—'}</td>
                        <td className="py-2 px-2 text-center text-xs">{r.attempts}</td>
                        <td className="py-2 px-2 text-right space-x-1">
                          {r.xml_path && (
                            <Button size="sm" variant="ghost" onClick={() => download(r.xml_path)}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {(r.status === 'error' || r.status === 'pending') && (
                            <Button size="sm" variant="outline" onClick={() => trigger(r.period)} disabled={!!submitting}>
                              {submitting === r.period ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.some((r: any) => r.error_message) && (
                  <div className="mt-4 text-xs space-y-1">
                    {rows.filter((r: any) => r.error_message).map((r: any) => (
                      <div key={r.id} className="text-red-600">
                        <strong>{r.period}:</strong> {r.error_message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
