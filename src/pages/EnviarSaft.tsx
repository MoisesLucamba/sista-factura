import { useRef, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DocumentosAdicionais } from '@/components/saft/DocumentosAdicionais';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa, useSaftUploads } from '@/hooks/useCredito';
import { parseSaft, validateSaft, type SaftParsed, type SaftValidation } from '@/lib/saft-parse';
import { calcularScore } from '@/lib/credit-score';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recordConsent, SAFT_ANALYSIS_VERSION } from '@/lib/legal/consent';
import {
  UploadCloud, FileX2, CheckCircle2, XCircle, Loader2, FileText, ShieldCheck,
} from 'lucide-react';

const kz = (v: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0);

export default function EnviarSaft() {
  const { user } = useAuth();
  const { data: empresa } = useEmpresa();
  const { data: uploads = [] } = useSaftUploads();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [parsed, setParsed] = useState<SaftParsed | null>(null);
  const [validation, setValidation] = useState<SaftValidation | null>(null);
  const [analysisConsent, setAnalysisConsent] = useState(false);

  const handleFile = async (file: File) => {
    if (!analysisConsent) {
      toast.error('Autoriza a análise do SAF-T antes de escolher um ficheiro.');
      return;
    }
    setBusy(true);
    setParsed(null);
    setValidation(null);
    try {
      await recordConsent({ consent_type: 'saft_analysis', granted: true, document_version: SAFT_ANALYSIS_VERSION });
      const xml = await file.text();
      const p = parseSaft(xml);
      const v = validateSaft(p, empresa?.nif);
      setParsed(p);
      setValidation(v);

      const { data: upload, error } = await supabase
        .from('saft_uploads')
        .insert({
          user_id: user!.id,
          empresa_id: empresa?.id ?? null,
          file_name: file.name,
          file_size: file.size,
          periodo_inicio: p.periodoInicio,
          periodo_fim: p.periodoFim,
          periodo_label: p.periodoLabel,
          nif_ficheiro: p.nif,
          hash_control: p.hashControl,
          software_cert_number: p.softwareCertNumber,
          total_vendas: p.totalVendas,
          num_documentos: p.numDocumentos,
          vendas_por_mes: p.vendasPorMes as unknown as never,
          produtos: p.produtos as unknown as never,
          estado: v.valido ? 'validado' : 'rejeitado',
        })
        .select('id')
        .single();
      if (error) throw error;

      await supabase.from('validacoes_saft').insert({
        upload_id: upload.id,
        user_id: user!.id,
        formato_ok: v.formatoOk,
        certificado_ok: v.certificadoOk,
        hash_control_ok: v.hashControlOk,
        nif_ok: v.nifOk,
        detalhes: v.detalhes as unknown as never,
        mensagem: v.mensagem,
      });

      if (v.valido) {
        const s = calcularScore(p.vendasPorMes, { conformidadeOk: true });
        await supabase.from('score_historico').insert({
          user_id: user!.id,
          empresa_id: empresa?.id ?? null,
          periodo: p.periodoLabel,
          score: s.score,
          nivel: s.classe,
          fatores: s.breakdown as unknown as never,
        });
        toast.success(`SAF-T validado. Score actualizado: ${s.score}`);
      } else {
        toast.error('Ficheiro rejeitado na validação.');
      }

      qc.invalidateQueries({ queryKey: ['saft_uploads'] });
      qc.invalidateQueries({ queryKey: ['score_historico'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível ler o ficheiro.');
    } finally {
      setBusy(false);
    }
  };

  const checks = validation ? [
    { ok: validation.formatoOk, label: 'Estrutura SAF-T (AO) reconhecida' },
    { ok: validation.certificadoOk, label: 'Nº de certificado AGT do software' },
    { ok: validation.hashControlOk, label: 'Assinatura digital dos documentos' },
    { ok: validation.nifOk, label: 'NIF corresponde à empresa registada' },
  ] : [];

  return (
    <MainLayout
      title="Enviar SAF-T"
      description="Envia o ficheiro que o teu software de faturação já gera. Nós validamos e analisamos."
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <div className="flex items-start gap-3 border-b border-border p-5 sm:p-6" onClick={event => event.stopPropagation()}>
              <Checkbox
                id="saft-analysis-consent"
                checked={analysisConsent}
                onCheckedChange={checked => setAnalysisConsent(checked === true)}
                disabled={busy}
                aria-required="true"
                className="mt-0.5"
              />
              <Label htmlFor="saft-analysis-consent" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
                Autorizo o Giro a ler este SAF-T (AO) no meu dispositivo para validar estrutura, hash, assinaturas e NIF, e a registar os campos extraídos, validações e Score. O ficheiro XML original não é enviado para os servidores.
              </Label>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => {
                e.preventDefault(); setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f && analysisConsent) handleFile(f);
              }}
              onClick={() => analysisConsent && inputRef.current?.click()}
              onKeyDown={event => { if (analysisConsent && (event.key === 'Enter' || event.key === ' ')) inputRef.current?.click(); }}
              role="button"
              tabIndex={analysisConsent ? 0 : -1}
              aria-disabled={!analysisConsent || busy}
              className={`rounded-xl border-2 border-dashed transition-colors p-12 flex flex-col items-center text-center gap-3 ${
                !analysisConsent || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              {busy ? <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    : <UploadCloud className="w-10 h-10 text-primary" />}
              <p className="font-bold text-lg">Arrasta o teu SAF-T (.xml) para aqui</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Aceitamos o SAF-T (AO) mensal ou anual exportado por qualquer software certificado pela AGT.
                O ficheiro é analisado no teu dispositivo antes de ser registado.
              </p>
              <Button type="button" variant="secondary" disabled={busy || !analysisConsent}>Escolher ficheiro</Button>
              <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                disabled={!analysisConsent || busy}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </div>
          </CardContent>
        </Card>

        {validation && parsed && (
          <Card className={validation.valido ? 'border-emerald-500/40' : 'border-destructive/40'}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Relatório de validação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`text-sm font-semibold ${validation.valido ? 'text-emerald-600' : 'text-destructive'}`}>
                {validation.mensagem}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <XCircle className="w-4 h-4 text-destructive" />}
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t">
                <div><p className="text-xs text-muted-foreground">Empresa</p><p className="font-semibold text-sm">{parsed.empresaNome || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">NIF</p><p className="font-semibold text-sm">{parsed.nif || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Período</p><p className="font-semibold text-sm">{parsed.periodoLabel}</p></div>
                <div><p className="text-xs text-muted-foreground">Total facturado</p><p className="font-semibold text-sm">{kz(parsed.totalVendas)}</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        <DocumentosAdicionais />

        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de envios</CardTitle></CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileX2 className="w-4 h-4" /> Ainda não enviaste nenhum ficheiro.
              </p>
            ) : (
              <div className="divide-y">
                {uploads.map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{u.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.periodo_label} · {u.num_documentos} documentos · {kz(Number(u.total_vendas))}
                      </p>
                    </div>
                    <Badge variant={u.estado === 'validado' ? 'default' : 'destructive'} className="capitalize">
                      {u.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
