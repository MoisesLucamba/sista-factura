import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/hooks/useCredito';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import { FolderUp, Loader2, CheckCircle2, Paperclip, Download, Trash2 } from 'lucide-react';

const TIPOS = [
  { id: 'modelo_7', label: 'Modelo 7', desc: 'Declaração anual de rendimentos (Imposto Industrial).' },
  { id: 'modelo_1', label: 'Modelo 1', desc: 'Declaração de início / alteração de actividade.' },
  { id: 'certidao_fiscal', label: 'Certidão fiscal', desc: 'Certidão de não dívida emitida pela AGT.' },
  { id: 'extractos', label: 'Extractos bancários', desc: 'Últimos 6 a 12 meses da conta da empresa.' },
  { id: 'alvara', label: 'Alvará comercial', desc: 'Licença de actividade em vigor.' },
  { id: 'facturas_fornecedores', label: 'Facturas de fornecedores', desc: 'Comprovativos de compras recentes.' },
];

const BUCKET = 'documentos-adicionais';

interface DocRow {
  id: string;
  tipo: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

export function DocumentosAdicionais() {
  const { user } = useAuth();
  const { data: empresa } = useEmpresa();
  const qc = useQueryClient();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ['documentos_adicionais', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_adicionais')
        .select('id, tipo, file_name, file_path, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocRow[];
    },
  });

  const enviar = async (tipo: string, file: File) => {
    setBusy(tipo);
    try {
      const path = `${user!.id}/${tipo}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from('documentos_adicionais').insert({
        user_id: user!.id,
        empresa_id: empresa?.id ?? null,
        tipo,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
      });
      if (error) throw error;
      toast.success('Documento carregado.');
      qc.invalidateQueries({ queryKey: ['documentos_adicionais'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível carregar o documento.');
    } finally {
      setBusy(null);
    }
  };

  const abrir = async (doc: DocRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 300);
    if (error || !data) { toast.error('Não foi possível abrir o ficheiro.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const remover = async (doc: DocRow) => {
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    const { error } = await supabase.from('documentos_adicionais').delete().eq('id', doc.id);
    if (error) { toast.error('Não foi possível remover.'); return; }
    toast.success('Documento removido.');
    qc.invalidateQueries({ queryKey: ['documentos_adicionais'] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FolderUp className="w-4 h-4 text-primary" /> Documentos adicionais
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Opcionais, mas reforçam o teu dossier junto dos bancos parceiros. Ficheiros privados: só tu,
          o Giro e o banco a quem submeteres o pedido conseguem ver.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {TIPOS.map(t => {
          const enviados = docs.filter(d => d.tipo === t.id);
          return (
            <div key={t.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {t.label}
                    {enviados.length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {enviados.length}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                <Button
                  size="sm" variant="secondary" disabled={busy === t.id}
                  onClick={() => inputs.current[t.id]?.click()}
                >
                  {busy === t.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Paperclip className="w-4 h-4 mr-2" /> Carregar</>}
                </Button>
                <input
                  ref={el => { inputs.current[t.id] = el; }}
                  type="file" className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.xml,.xlsx,.csv"
                  onChange={e => { const f = e.target.files?.[0]; if (f) enviar(t.id, f); e.target.value = ''; }}
                />
              </div>

              {enviados.length > 0 && (
                <div className="mt-3 divide-y border-t pt-2">
                  {enviados.map(d => (
                    <div key={d.id} className="flex items-center gap-2 py-2 text-sm">
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{d.file_name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(d.created_at)}</span>
                      <Button size="icon" variant="ghost" onClick={() => abrir(d)} aria-label="Abrir documento">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remover(d)} aria-label="Remover documento">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
