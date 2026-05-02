import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileDown, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { exportSAFT, downloadSaft } from '@/lib/saft-export';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SaftExport() {
  const { user } = useAuth();
  const today = new Date();
  const [startDate, setStartDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const xml = await exportSAFT({ userId: user.id, startDate, endDate });
      const { data: agt } = await supabase
        .from('agt_config').select('nif_produtor').eq('user_id', user.id).maybeSingle();
      const nif = agt?.nif_produtor || '000000000';
      const d = new Date(startDate);
      downloadSaft(xml, nif, d.getFullYear(), d.getMonth() + 1);
      toast.success('SAF-T XML gerado com sucesso!');
    } catch (e: any) {
      toast.error('Erro ao gerar SAF-T: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Exportar SAF-T (AO)</h1>
            <p className="text-xs text-muted-foreground">Decreto Presidencial 312/18 — AGT Angola</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Período de exportação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Data início</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data fim</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleExport} disabled={loading} className="w-full gap-2 font-bold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar...</> : <><FileDown className="w-4 h-4" /> Exportar SAF-T XML</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">Sobre o ficheiro SAF-T (AO)</p>
            <p>O SAF-T (Standard Audit File for Tax) é o ficheiro XML que a AGT (Administração Geral Tributária de Angola) exige para auditoria fiscal, conforme o Decreto Presidencial 312/18.</p>
            <p>Documentos comerciais como Pró-Formas e Orçamentos não são incluídos no ficheiro fiscal.</p>
            <p>Nome do ficheiro gerado: <code className="font-mono">SAFT-AO-[NIF]-[ano][mês].xml</code></p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
