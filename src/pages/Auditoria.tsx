import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuditoria, type AuditRow } from '@/hooks/useAuditoria';
import { exportToCSV } from '@/lib/csv-export';
import { formatCurrency, formatDate } from '@/lib/format';
import { Search, Download, Loader2, ScrollText, FileSpreadsheet } from 'lucide-react';

const CATEGORIAS = ['Todas', 'Evento', 'Decisão', 'Desembolso'] as const;

const badgeVariant = (categoria: AuditRow['categoria']) =>
  categoria === 'Decisão' ? 'default' : categoria === 'Desembolso' ? 'secondary' : 'outline';

export default function Auditoria() {
  const { data: rows = [], isLoading } = useAuditoria();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [pme, setPme] = useState('Todas');
  const [banco, setBanco] = useState('Todos');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  const pmes = useMemo(() => ['Todas', ...Array.from(new Set(rows.map(r => r.pme))).filter(v => v !== '—').sort()], [rows]);
  const bancos = useMemo(() => ['Todos', ...Array.from(new Set(rows.map(r => r.banco))).filter(v => v !== '—').sort()], [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (categoria !== 'Todas' && r.categoria !== categoria) return false;
    if (pme !== 'Todas' && r.pme !== pme) return false;
    if (banco !== 'Todos' && r.banco !== banco) return false;
    if (de && r.data < de) return false;
    if (ate && r.data > `${ate}T23:59:59`) return false;
    if (q) {
      const alvo = `${r.tipo} ${r.pme} ${r.banco} ${r.estado} ${r.detalhe}`.toLowerCase();
      if (!alvo.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, q, categoria, pme, banco, de, ate]);

  const totalDesembolsado = filtered
    .filter(r => r.categoria === 'Desembolso' && r.estado === 'pago')
    .reduce((s, r) => s + (r.valor ?? 0), 0);

  const exportar = () => {
    exportToCSV(
      filtered.map(r => ({
        data: formatDate(r.data),
        categoria: r.categoria,
        tipo: r.tipo,
        pme: r.pme,
        banco: r.banco,
        valor: r.valor ?? '',
        estado: r.estado,
        detalhe: r.detalhe,
      })),
      [
        { key: 'data', label: 'Data' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'pme', label: 'PME' },
        { key: 'banco', label: 'Banco' },
        { key: 'valor', label: 'Valor (AOA)' },
        { key: 'estado', label: 'Estado' },
        { key: 'detalhe', label: 'Detalhe' },
      ],
      `papel-auditoria-${new Date().toISOString().slice(0, 10)}`,
    );
  };

  return (
    <MainLayout
      title="Auditoria"
      description="Histórico pesquisável de eventos, decisões de crédito e desembolsos, por PME e por banco."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Registos no filtro</p>
            <p className="text-2xl font-black">{filtered.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Decisões de crédito</p>
            <p className="text-2xl font-black">{filtered.filter(r => r.categoria === 'Decisão').length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total desembolsado</p>
            <p className="text-2xl font-black">{formatCurrency(totalDesembolsado)}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" /> Trilho de auditoria
            </CardTitle>
            <Button onClick={exportar} disabled={filtered.length === 0} size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Exportar Excel / CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar…" className="pl-9" />
              </div>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={pme} onValueChange={setPme}>
                <SelectTrigger><SelectValue placeholder="PME" /></SelectTrigger>
                <SelectContent>{pmes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger>
                <SelectContent>{bancos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={de} onChange={e => setDe(e.target.value)} />
                <Input type="date" value={ate} onChange={e => setAte(e.target.value)} />
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" /> Sem registos para os filtros escolhidos.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Categoria</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">PME</th>
                      <th className="text-left p-3">Banco</th>
                      <th className="text-right p-3">Valor</th>
                      <th className="text-left p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{formatDate(r.data)}</td>
                        <td className="p-3"><Badge variant={badgeVariant(r.categoria)}>{r.categoria}</Badge></td>
                        <td className="p-3">
                          <span className="font-medium">{r.tipo}</span>
                          {r.detalhe && <span className="block text-xs text-muted-foreground">{r.detalhe}</span>}
                        </td>
                        <td className="p-3">{r.pme}</td>
                        <td className="p-3">{r.banco}</td>
                        <td className="p-3 text-right font-semibold whitespace-nowrap">
                          {r.valor !== null ? formatCurrency(r.valor) : '—'}
                        </td>
                        <td className="p-3 capitalize">{r.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
