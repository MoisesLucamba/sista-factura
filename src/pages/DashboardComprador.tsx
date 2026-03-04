import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import type { Fatura } from '@/hooks/useFaturas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, User, ShoppingBag, Star, LogOut, Copy, CheckCircle,
  Loader2, TrendingUp, Gift, Clock, FileText, Edit2, Save, X,
  Receipt, Eye, Calendar, ArrowUpRight, Shield, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import logoFaktura from '@/assets/logo-faktura.png';

interface WalletData {
  faktura_id: string;
  pontos: number;
  saldo: number;
}

interface Purchase {
  id: string;
  vendor_name: string | null;
  descricao: string | null;
  valor: number;
  pontos_ganhos: number;
  created_at: string;
  fatura_id: string | null;
}

interface InvoiceLinked {
  id: string;
  numero: string;
  total: number;
  estado: string;
  data_emissao: string;
  tipo: string;
  buyer_faktura_id: string | null;
}

export default function DashboardComprador() {
  const { user, profile, signOut } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [invoices, setInvoices] = useState<InvoiceLinked[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editNif, setEditNif] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [walletRes, purchasesRes, invoicesRes] = await Promise.all([
        supabase.from('buyer_wallets').select('faktura_id, pontos, saldo').eq('user_id', user.id).single(),
        supabase.from('buyer_purchases').select('*').eq('buyer_user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('faturas').select('id, numero, total, estado, data_emissao, tipo, buyer_faktura_id').eq('buyer_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);
      if (walletRes.data) setWallet(walletRes.data as WalletData);
      if (purchasesRes.data) setPurchases(purchasesRes.data as Purchase[]);
      if (invoicesRes.data) setInvoices(invoicesRes.data as InvoiceLinked[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const copyId = () => {
    if (wallet?.faktura_id) {
      navigator.clipboard.writeText(wallet.faktura_id);
      setCopied(true);
      toast.success('ID copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = useCallback(async (invoiceId: string, numero: string) => {
    setDownloadingId(invoiceId);
    try {
      // Fetch full invoice with client and items
      const { data: fatura, error: fErr } = await supabase
        .from('faturas')
        .select('*')
        .eq('id', invoiceId)
        .single();
      if (fErr || !fatura) throw new Error('Fatura não encontrada');

      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', fatura.cliente_id)
        .single();

      const { data: itensRaw } = await supabase
        .from('itens_fatura')
        .select('*')
        .eq('fatura_id', invoiceId);

      // Fetch product names for each item
      const itens = await Promise.all(
        (itensRaw || []).map(async (item) => {
          const { data: produto } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', item.produto_id)
            .single();
          return { ...item, produto: produto || undefined };
        })
      );

      // Get vendor company info
      const { data: vendorConfig } = await supabase
        .from('agt_config')
        .select('*')
        .eq('user_id', fatura.user_id)
        .single();

      const fullFatura = {
        ...fatura,
        tipo: fatura.tipo as Fatura['tipo'],
        estado: fatura.estado as Fatura['estado'],
        cliente: cliente ? { ...cliente, tipo: cliente.tipo as 'empresa' | 'particular' } : undefined,
        itens: itens.map(i => ({ ...i, produto: i.produto ? { ...i.produto, tipo: i.produto.tipo as 'produto' | 'servico' } : undefined })),
      } as Fatura;

      const blob = await generateInvoicePDF(fullFatura, vendorConfig || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descarregado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const startEditing = () => {
    setEditNome(profile?.nome || '');
    setEditTelefone((profile as any)?.telefone || '');
    setEditNif((profile as any)?.nif || '');
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome: editNome, telefone: editTelefone, nif: editNif })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Perfil atualizado!');
      setEditing(false);
      // Reload page to refresh profile
      window.location.reload();
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      emitida: { label: 'Emitida', variant: 'default' },
      paga: { label: 'Paga', variant: 'secondary' },
      anulada: { label: 'Anulada', variant: 'destructive' },
      rascunho: { label: 'Rascunho', variant: 'outline' },
    };
    const info = map[estado] || { label: estado, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalGasto = purchases.reduce((s, p) => s + p.valor, 0);
  const totalPontos = wallet?.pontos || 0;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .afu { animation: fade-up .5s ease both; }
        .shimmer-text {
          background: linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%);
          background-size:200% auto; -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <img src={logoFaktura} alt="Faktura" className="h-8 object-contain" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {profile?.nome}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Welcome + ID Card */}
        <div className="afu" style={{ animationDelay: '0ms' }}>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bem-vindo de volta 👋</p>
                  <h1 className="text-2xl font-black tracking-tight">
                    <span className="shimmer-text">{profile?.nome}</span>
                  </h1>
                </div>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Seu ID Faktura</p>
                    <p className="text-xl font-black text-primary tracking-wider">{wallet?.faktura_id || '---'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyId}>
                    {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="afu grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '100ms' }}>
          {[
            { icon: Wallet, label: 'Saldo', value: formatCurrency(wallet?.saldo || 0), color: 'text-primary' },
            { icon: Star, label: 'Pontos', value: `${totalPontos} pts`, color: 'text-amber-500' },
            { icon: ShoppingBag, label: 'Compras', value: `${purchases.length}`, color: 'text-emerald-500' },
            { icon: TrendingUp, label: 'Total Gasto', value: formatCurrency(totalGasto), color: 'text-blue-500' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                <p className="text-lg font-black">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="afu" style={{ animationDelay: '200ms' }}>
          <Tabs defaultValue="faturas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faturas" className="text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1 hidden sm:block" />
                Faturas
              </TabsTrigger>
              <TabsTrigger value="compras" className="text-xs sm:text-sm">
                <ShoppingBag className="w-4 h-4 mr-1 hidden sm:block" />
                Compras
              </TabsTrigger>
              <TabsTrigger value="perfil" className="text-xs sm:text-sm">
                <User className="w-4 h-4 mr-1 hidden sm:block" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="pontos" className="text-xs sm:text-sm">
                <Star className="w-4 h-4 mr-1 hidden sm:block" />
                Pontos
              </TabsTrigger>
            </TabsList>

            {/* Faturas Tab */}
            <TabsContent value="faturas">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Minhas Faturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-10">
                      <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma fatura registada</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        As faturas aparecem aqui quando um vendedor usar o seu ID <strong className="text-primary">{wallet?.faktura_id}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate font-mono">{inv.numero}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(inv.data_emissao).toLocaleDateString('pt-AO')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
                            {estadoBadge(inv.estado)}
                            <p className="text-sm font-bold">{formatCurrency(Number(inv.total))}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={downloadingId === inv.id}
                              onClick={() => handleDownloadPDF(inv.id, inv.numero)}
                              title="Descarregar PDF"
                            >
                              {downloadingId === inv.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compras Tab */}
            <TabsContent value="compras">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Histórico de Compras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchases.length === 0 ? (
                    <div className="text-center py-10">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma compra registada ainda</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Partilhe o seu ID <strong className="text-primary">{wallet?.faktura_id}</strong> ao fazer compras
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{p.vendor_name || 'Loja'}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.descricao || 'Compra'}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-sm font-bold">{formatCurrency(p.valor)}</p>
                            {p.pontos_ganhos > 0 && (
                              <p className="text-xs text-primary font-semibold flex items-center gap-1 justify-end">
                                <Gift className="w-3 h-3" /> +{p.pontos_ganhos} pts
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Perfil Tab */}
            <TabsContent value="perfil">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Meu Perfil
                  </CardTitle>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>NIF</Label>
                          <Input value={editNif} onChange={(e) => setEditNif(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={profile?.email || ''} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: 'Nome', value: profile?.nome },
                        { label: 'Email', value: profile?.email },
                        { label: 'NIF', value: (profile as any)?.nif || 'Não informado' },
                        { label: 'Telefone', value: (profile as any)?.telefone || 'Não informado' },
                        { label: 'ID Faktura', value: wallet?.faktura_id || '---' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="w-4 h-4 text-primary" />
                      Segurança
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O seu ID Faktura é único e pessoal. Partilhe-o com vendedores para acumular pontos nas suas compras.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pontos Tab */}
            <TabsContent value="pontos">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div>
                        <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-3xl font-black">{totalPontos}</p>
                        <p className="text-sm text-muted-foreground">Pontos Totais</p>
                      </div>
                      <div>
                        <Wallet className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-3xl font-black">{formatCurrency(wallet?.saldo || 0)}</p>
                        <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Extrato de pontos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                      Extrato de Pontos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {purchases.filter(p => p.pontos_ganhos > 0).length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Ainda não ganhou pontos</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {purchases.filter(p => p.pontos_ganhos > 0).map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{p.vendor_name || 'Loja'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.created_at).toLocaleDateString('pt-AO')}
                              </p>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              +{p.pontos_ganhos} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card className="bg-primary/5 border-primary/15">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      Como ganhar pontos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { step: '1', text: 'Partilhe o seu ID ao comprar' },
                        { step: '2', text: 'A empresa emite a fatura com o seu ID' },
                        { step: '3', text: 'Receba 50 Kz por fatura acima de 1.500 Kz' },
                      ].map(({ step, text }) => (
                        <div key={step} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
                          <p className="text-sm text-muted-foreground">{text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
