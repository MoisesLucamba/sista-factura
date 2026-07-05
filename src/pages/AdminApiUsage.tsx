import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Loader2, Activity, Users, Zap } from 'lucide-react';

interface KeyRow { id: string; user_id: string; name: string; key_prefix: string; is_active: boolean; last_used_at: string | null; created_at: string; }
interface LogRow { id: string; api_key_id: string | null; user_id: string | null; endpoint: string; method: string; status: number; latency_ms: number | null; created_at: string; }
interface Profile { user_id: string; nome: string; email: string; faktura_id: string | null; }

export default function AdminApiUsage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [k, l] = await Promise.all([
        supabase.from('api_keys').select('id,user_id,name,key_prefix,is_active,last_used_at,created_at').order('created_at', { ascending: false }),
        supabase.from('api_usage_logs').select('id,api_key_id,user_id,endpoint,method,status,latency_ms,created_at').order('created_at', { ascending: false }).limit(500),
      ]);
      const keyRows = (k.data as KeyRow[]) || [];
      const logRows = (l.data as LogRow[]) || [];
      setKeys(keyRows);
      setLogs(logRows);
      const ids = Array.from(new Set([...keyRows.map(r => r.user_id), ...logRows.map(r => r.user_id).filter(Boolean) as string[]]));
      if (ids.length) {
        const { data: p } = await supabase.from('profiles').select('user_id,nome,email,faktura_id').in('user_id', ids);
        const map: Record<string, Profile> = {};
        (p || []).forEach((x: any) => { map[x.user_id] = x; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const perUser: Record<string, number> = {};
    logs.forEach(l => { if (l.user_id) perUser[l.user_id] = (perUser[l.user_id] || 0) + 1; });
    return {
      totalCalls: logs.length,
      activeKeys: keys.filter(k => k.is_active).length,
      uniqueUsers: new Set(logs.map(l => l.user_id).filter(Boolean)).size,
      topUsers: Object.entries(perUser).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [logs, keys]);

  const label = (uid?: string | null) => uid ? (profiles[uid]?.nome || profiles[uid]?.email || uid.slice(0, 8)) : '—';
  const fk = (uid?: string | null) => uid ? profiles[uid]?.faktura_id : null;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6 text-primary" /> API — Uso e Integrações</h1>
          <p className="text-muted-foreground text-sm">Quem está a consumir a Faktura API e com que frequência.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" />Chamadas (últimas 500)</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.totalCalls}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4" />Chaves activas</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.activeKeys}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" />Integradores únicos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.uniqueUsers}</CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Chaves API por utilizador</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left border-b">
                      <th className="py-2 pr-3">Utilizador</th><th className="py-2 pr-3">ID Faktura</th>
                      <th className="py-2 pr-3">Nome da chave</th><th className="py-2 pr-3">Prefixo</th>
                      <th className="py-2 pr-3">Estado</th><th className="py-2 pr-3">Último uso</th><th className="py-2 pr-3">Criada</th>
                    </tr></thead>
                    <tbody>
                      {keys.map(k => (
                        <tr key={k.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-3">{label(k.user_id)}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{fk(k.user_id) || '—'}</td>
                          <td className="py-2 pr-3">{k.name}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{k.key_prefix}…</td>
                          <td className="py-2 pr-3">{k.is_active ? <Badge>Activa</Badge> : <Badge variant="secondary">Revogada</Badge>}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleString('pt-PT') : 'Nunca'}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{new Date(k.created_at).toLocaleDateString('pt-PT')}</td>
                        </tr>
                      ))}
                      {keys.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Ainda sem chaves API.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Chamadas recentes</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left border-b">
                      <th className="py-2 pr-3">Quando</th><th className="py-2 pr-3">Utilizador</th>
                      <th className="py-2 pr-3">Método</th><th className="py-2 pr-3">Endpoint</th>
                      <th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Latência</th>
                    </tr></thead>
                    <tbody>
                      {logs.slice(0, 200).map(l => (
                        <tr key={l.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-PT')}</td>
                          <td className="py-2 pr-3">{label(l.user_id)}</td>
                          <td className="py-2 pr-3"><Badge variant="secondary">{l.method}</Badge></td>
                          <td className="py-2 pr-3 font-mono text-xs">{l.endpoint}</td>
                          <td className="py-2 pr-3">
                            <Badge variant={l.status < 400 ? 'default' : 'destructive'}>{l.status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{l.latency_ms ?? '—'} ms</td>
                        </tr>
                      ))}
                      {logs.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">Sem chamadas registadas.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
