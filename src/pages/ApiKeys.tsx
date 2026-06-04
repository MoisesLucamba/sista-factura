import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, Key, Loader2, Plus, ShieldOff, BookOpen, Download } from 'lucide-react';
import { API_DOCS_MARKDOWN } from '@/lib/api-docs';

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `fkt_live_${body}`;
}

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState('Integração principal');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setKeys(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);
    try {
      const key = randomKey();
      const hash = await sha256Hex(key);
      const prefix = key.slice(0, 14); // fkt_live_xxxxx
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id, name: name.trim(), key_prefix: prefix, key_hash: hash,
      });
      if (error) throw error;
      setNewKey(key);
      toast.success('API key criada — copie agora, não voltará a ser exibida.');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revogar esta chave? As integrações que a usam deixarão de funcionar.')) return;
    await supabase.from('api_keys').update({ is_active: false, revoked_at: new Date().toISOString() }).eq('id', id);
    toast.success('Chave revogada');
    load();
  };

  const downloadDocs = () => {
    const blob = new Blob([API_DOCS_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faktura-api-docs-v1.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documentação descarregada');
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight">API & Integrações</h1>
            <p className="text-xs text-muted-foreground">Use a API Faktura para emitir facturas a partir de outros sistemas.</p>
          </div>
          <Button onClick={downloadDocs} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Baixar documentação
          </Button>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 space-y-2 text-sm">
            <p className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4" /> Base URL</p>
            <code className="block bg-background rounded p-2 text-xs font-mono break-all">
              https://ewfjvgzachtonehujvom.supabase.co/functions/v1/faktura-api
            </code>
            <p className="text-xs text-muted-foreground">
              Autenticação por header <code>x-api-key</code>. Clique em <strong>Baixar documentação</strong> para o guia completo (Markdown).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Nova chave</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome / descrição</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: ERP da loja" />
            </div>
            <Button onClick={create} disabled={loading} className="gap-2 font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Gerar API Key
            </Button>

            {newKey && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                <p className="text-xs font-bold text-amber-700">⚠️ Copie agora — só será exibida uma vez:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background rounded p-2 text-xs font-mono break-all">{newKey}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copiado'); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Chaves existentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {keys.length === 0 && <p className="text-xs text-muted-foreground">Ainda não criou nenhuma chave.</p>}
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{k.name}</p>
                    {k.is_active ? <Badge>Activa</Badge> : <Badge variant="secondary">Revogada</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{k.key_prefix}…</p>
                  <p className="text-[10px] text-muted-foreground">
                    Criada: {new Date(k.created_at).toLocaleString('pt-PT')}
                    {k.last_used_at && ` · Último uso: ${new Date(k.last_used_at).toLocaleString('pt-PT')}`}
                  </p>
                </div>
                {k.is_active && (
                  <Button size="sm" variant="outline" onClick={() => revoke(k.id)} className="gap-1">
                    <ShieldOff className="w-3.5 h-3.5" /> Revogar
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
