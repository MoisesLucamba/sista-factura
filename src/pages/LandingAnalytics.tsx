import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MousePointerClick, Activity, Users, ExternalLink } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Row {
  id: string;
  event_name: string;
  section: string | null;
  label: string | null;
  url: string | null;
  referrer: string | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
}

export default function LandingAnalytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('landing_events')
        .select('id,event_name,section,label,url,referrer,session_id,user_id,created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!error) setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const sessions = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;
    const byLabel: Record<string, number> = {};
    const bySection: Record<string, number> = {};
    for (const r of rows) {
      if (r.label) byLabel[r.label] = (byLabel[r.label] || 0) + 1;
      if (r.section) bySection[r.section] = (bySection[r.section] || 0) + 1;
    }
    const labelChart = Object.entries(byLabel)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const sectionChart = Object.entries(bySection)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count);
    return { total, sessions, labelChart, sectionChart };
  }, [rows]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Analytics — Landing
          </h1>
          <p className="text-muted-foreground text-sm">
            Cliques e eventos registados na landing page (últimos 1000).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MousePointerClick className="w-4 h-4" />Eventos</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" />Sessões únicas</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{stats.sessions}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top secção</CardTitle></CardHeader>
                <CardContent className="text-xl font-semibold">{stats.sectionChart[0]?.section ?? '—'}</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Botões / Links mais clicados</CardTitle></CardHeader>
              <CardContent style={{ height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.labelChart} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="label" type="category" width={180} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Actividade recente</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-3">Quando</th>
                        <th className="py-2 pr-3">Evento</th>
                        <th className="py-2 pr-3">Secção</th>
                        <th className="py-2 pr-3">Label</th>
                        <th className="py-2 pr-3">URL</th>
                        <th className="py-2 pr-3">Sessão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 100).map((r) => (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                            {new Date(r.created_at).toLocaleString('pt-PT')}
                          </td>
                          <td className="py-2 pr-3"><Badge variant="secondary">{r.event_name}</Badge></td>
                          <td className="py-2 pr-3">{r.section ?? '—'}</td>
                          <td className="py-2 pr-3 font-medium">{r.label ?? '—'}</td>
                          <td className="py-2 pr-3 max-w-[240px] truncate">
                            {r.url ? (
                              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                {r.url} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : '—'}
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{r.session_id?.substring(0, 8) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">Ainda sem eventos.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
