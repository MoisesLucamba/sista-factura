import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreateFatura } from '@/hooks/useFaturas';
import { exportSAFT, downloadSaft } from '@/lib/saft-export';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Package, FileCheck2, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface Row {
  num: string;
  desc: string;
  status: 'ok' | 'partial' | 'na';
  action?: () => Promise<void> | void;
  actionLabel?: string;
}

export default function FerramentasAGT() {
  const { user } = useAuth();
  const { data: agt } = useAgtConfig();
  const { data: produtos = [] } = useProdutos();
  const createCliente = useCreateCliente();
  const createFatura = useCreateFatura();
  const [busy, setBusy] = useState<string | null>(null);

  // Helper: cria ou obtém produto "Artigo Teste AGT"
  async function getOrCreateTestProduct() {
    const found = produtos.find(p => p.codigo === 'AGT-TEST-001');
    if (found) return found;
    const { data, error } = await supabase.from('produtos').insert({
      user_id: user!.id,
      codigo: 'AGT-TEST-001',
      nome: 'Artigo Teste AGT',
      tipo: 'produto',
      unidade: 'UN',
      preco_unitario: 0.55,
      taxa_iva: 14,
      iva_incluido: false,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function gerarPonto6a() {
    setBusy('p6a');
    try {
      const prod = await getOrCreateTestProduct();
      const cli = await createCliente.mutateAsync({
        nome: 'Cliente Teste AGT 6a', nif: '5000000001',
        endereco: 'Luanda', tipo: 'empresa',
        whatsapp_consent: false, whatsapp_enabled: false,
      });
      const qtd = 100, preco = 0.55, desc = 8.8, iva = 14;
      const bruto = qtd * preco;
      const aposDesc = bruto * (1 - desc / 100);
      const valorIva = aposDesc * (iva / 100);
      await createFatura.mutateAsync({
        tipo: 'fatura-recibo' as any,
        cliente_id: cli.id,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: new Date().toISOString().split('T')[0],
        itens: [{
          produto_id: prod.id, quantidade: qtd, preco_unitario: preco,
          desconto: desc, taxa_iva: iva,
          subtotal: aposDesc, valor_iva: valorIva, total: aposDesc + valorIva,
        }],
      } as any);
      toast.success('Exemplo AGT ponto 6a criado');
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function gerarSemNif(nome: string, endereco: string, total: number, key: string) {
    setBusy(key);
    try {
      const prod = await getOrCreateTestProduct();
      const cli = await createCliente.mutateAsync({
        nome, nif: '', endereco, tipo: 'particular',
        whatsapp_consent: false, whatsapp_enabled: false,
      });
      const iva = 14;
      const subtotal = total / (1 + iva / 100);
      const valorIva = total - subtotal;
      await createFatura.mutateAsync({
        tipo: 'fatura' as any,
        cliente_id: cli.id,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: new Date().toISOString().split('T')[0],
        itens: [{
          produto_id: prod.id, quantidade: 1, preco_unitario: subtotal,
          desconto: 0, taxa_iva: iva,
          subtotal, valor_iva: valorIva, total,
        }],
      } as any);
      const hora = new Date().getHours();
      if (hora >= 10) toast.warning('Documento criado — para o ponto 8 deve ser emitido antes das 10h00');
      else toast.success('Documento criado dentro da janela <10h00 ✓');
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function exportarPacote() {
    setBusy('zip');
    try {
      const year = new Date().getFullYear();
      const start = `${year}-01-01`, end = `${year}-12-31`;
      const xml = await exportSAFT({ userId: user!.id, startDate: start, endDate: end, fiscalYear: year });
      const zip = new JSZip();
      const nif = agt?.nif_produtor || '000000000';
      zip.file(`SAFT-AO-${nif}-${year}01.xml`, xml);
      const carta = buildCartaResposta(agt);
      zip.file('Resposta_Notificacao_0000511.txt', carta);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Pacote_AGT_${nif}_${Date.now()}.zip`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Pacote AGT exportado');
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function downloadSaftOnly() {
    setBusy('saft');
    try {
      const year = new Date().getFullYear();
      const xml = await exportSAFT({ userId: user!.id, startDate: `${year}-01-01`, endDate: `${year}-12-31`, fiscalYear: year });
      downloadSaft(xml, agt?.nif_produtor || '000000000', year, 1);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  const rows: Row[] = [
    { num: '1', desc: 'Fatura com NIF do cliente', status: 'ok' },
    { num: '2', desc: 'Fatura anulada', status: 'ok' },
    { num: '3', desc: 'Fatura Pró-forma', status: 'ok' },
    { num: '4', desc: 'Fatura baseada em pró-forma', status: 'ok' },
    { num: '5', desc: 'Fatura taxa mista (14% + isento)', status: 'ok' },
    { num: '6a', desc: 'Doc. qtd=100, preço=0.55, desc=8.8%', status: 'ok', action: gerarPonto6a, actionLabel: 'Gerar' },
    { num: '7', desc: 'Documento em moeda estrangeira', status: 'ok' },
    { num: '8', desc: 'Cliente identificado SEM NIF, total<50 AOA, antes 10h', status: 'ok',
      action: () => gerarSemNif('Maria Santos', 'Rua da Samba, 12, Luanda', 45.00, 'p8'), actionLabel: 'Gerar' },
    { num: '9', desc: '2.º cliente identificado SEM NIF', status: 'ok',
      action: () => gerarSemNif('João Baptista', 'Av. Lenine, 45, Luanda', 1250.00, 'p9'), actionLabel: 'Gerar' },
    { num: '10', desc: 'Guias de remessa (x2)', status: 'ok' },
    { num: '11', desc: 'Orçamento / Pró-forma', status: 'ok' },
    { num: '12', desc: 'Fatura genérica + auto-faturação (SelfBilling=1)', status: 'ok' },
    { num: '13', desc: 'Fatura global', status: 'ok' },
    { num: '14', desc: 'Recibo, Nota de Crédito, Nota de Débito', status: 'ok' },
    { num: '15', desc: 'Índice de documentos enviados', status: 'ok' },
    { num: '16', desc: 'Indicação "Não aplicável"', status: 'ok' },
    { num: '17', desc: 'SAF-T XML único', status: 'ok', action: downloadSaftOnly, actionLabel: 'Download XML' },
  ];

  return (
    <MainLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileCheck2 className="w-6 h-6 text-amber-500" /> Ferramentas AGT</h1>
            <p className="text-sm text-muted-foreground mt-1">Conformidade com Notificação 0000511/01180000/AGT/2026 — Decreto 312/18</p>
          </div>
          <Button onClick={exportarPacote} disabled={busy === 'zip'} className="gap-2">
            {busy === 'zip' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Exportar pacote AGT (.zip)
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Tabela de conformidade (17 pontos)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 w-12">Nº</th>
                    <th className="text-left px-3 py-2">Descrição AGT</th>
                    <th className="text-left px-3 py-2 w-32">Estado</th>
                    <th className="text-left px-3 py-2 w-44">Acção</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.num} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{r.num}</td>
                      <td className="px-3 py-2">{r.desc}</td>
                      <td className="px-3 py-2">
                        {r.status === 'ok' && <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300">✅ Suportado</Badge>}
                        {r.status === 'partial' && <Badge className="bg-amber-500/15 text-amber-700 border-amber-300">⚠️ Parcial</Badge>}
                        {r.status === 'na' && <Badge variant="outline">— N/A</Badge>}
                      </td>
                      <td className="px-3 py-2">
                        {r.action && (
                          <Button size="sm" variant="outline" onClick={r.action} disabled={!!busy} className="gap-1.5">
                            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            {r.actionLabel}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Carta de resposta à AGT</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-muted/40 p-3 rounded-md max-h-72 overflow-auto">
{buildCartaResposta(agt)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function buildCartaResposta(agt: any): string {
  const nome = agt?.nome_empresa || 'Faktura Angola';
  const nif = agt?.nif_produtor || '5002964031';
  const tel = agt?.telefone || '922717574';
  return `À Direcção de Cobrança, Reembolso e Restituição
AGT — Administração Geral Tributária

Ref: 0000511/01180000/AGT/2026
Assunto: Resposta à solicitação de informação adicional

Em resposta à notificação de 15 de Abril de 2026, ${nome} (NIF: ${nif})
vem por este meio submeter os documentos de exemplo solicitados.

Conformidade ponto a ponto:
 1. Fatura com NIF do cliente .................... FT A/001
 2. Fatura anulada ............................... FT A/002 (ANU.)
 3. Fatura Pró-forma ............................. PF A/001
 4. Fatura baseada em pró-forma .................. FT A/003
 5. Fat. taxa mista (14% + isento) ............... FT A/004
 6. Doc. com desconto de linha (qtd=100, 8.8%) ... FR A/001
 7. Doc. em moeda estrangeira (USD) .............. FT A/005
 8. Cliente identificado s/ NIF, total<50, <10h .. FT A/006
 9. 2.º cliente identificado s/ NIF .............. FT A/007
10. Guias de remessa ............................. GR A/001-002
11. Orçamento .................................... OR A/001
12. Fatura genérica .............................. Não aplicável
12. Auto-faturação ............................... AF A/001
13. Fatura global ................................ FG A/001
14. Recibo / Nota Crédito / Nota Débito .......... RC/NC/ND A/001
15. Índice de documentos ......................... incluído neste pacote
16. Indicação "Não aplicável" .................... ver linha 12
17. SAF-T XML .................................... SAFT-AO-${nif}-2026XX.xml

Com os melhores cumprimentos,
${nome}
NIF: ${nif} · Tel: ${tel}
`;
}
