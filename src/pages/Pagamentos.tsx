import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';
import {
  CreditCard, Link2, Building2, ArrowUpRight,
  CheckCircle, Clock, XCircle, Filter,
  TrendingUp, Banknote, RefreshCw, Plus,
  Copy, ExternalLink, QrCode, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatePaymentLinkDialog } from '@/components/pagamentos/CreatePaymentLinkDialog';
import { PaymentLinkDetails } from '@/components/pagamentos/PaymentLinkDetails';

function usePaymentLinks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payment-links', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function useReconciliations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reconciliations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_reconciliations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

const statusConfig = {
  active: { label: 'Activo', icon: CheckCircle, className: 'bg-success/10 text-success' },
  paid: { label: 'Pago', icon: CheckCircle, className: 'bg-primary/10 text-primary' },
  expired: { label: 'Expirado', icon: Clock, className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  pending: { label: 'Pendente', icon: Clock, className: 'bg-warning/10 text-warning' },
  matched: { label: 'Conciliado', icon: CheckCircle, className: 'bg-success/10 text-success' },
  partial: { label: 'Parcial', icon: Clock, className: 'bg-warning/10 text-warning' },
  unmatched: { label: 'Não conciliado', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

export default function Pagamentos() {
  const { data: links = [], isLoading: loadingLinks } = usePaymentLinks();
  const { data: reconciliations = [], isLoading: loadingRecon } = useReconciliations();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsCode, setDetailsCode] = useState<string | null>(null);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pagar/${code}`);
    toast.success('Link copiado!');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pagamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerir links de pagamento, Multicaixa e conciliação bancária
            </p>
          </div>
          <Button className="gradient-fintech border-0 text-primary-foreground glow-fintech" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Link de Pagamento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl gradient-fintech flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Links Activos</p>
                  <p className="text-xl font-bold font-mono">{links.filter(l => l.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recebido via Link</p>
                  <p className="text-xl font-bold font-mono">
                    {formatCurrency(links.filter(l => l.status === 'paid').reduce((s, l) => s + Number(l.amount), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conciliações Pendentes</p>
                  <p className="text-xl font-bold font-mono">
                    {reconciliations.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="links" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="links" className="gap-2">
              <Link2 className="w-4 h-4" /> Links de Pagamento
            </TabsTrigger>
            <TabsTrigger value="multicaixa" className="gap-2">
              <CreditCard className="w-4 h-4" /> Multicaixa
            </TabsTrigger>
            <TabsTrigger value="reconciliacao" className="gap-2">
              <Building2 className="w-4 h-4" /> Conciliação
            </TabsTrigger>
          </TabsList>

          {/* Payment Links */}
          <TabsContent value="links">
            <Card>
              <CardContent className="p-0">
                {loadingLinks ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                  </div>
                ) : links.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-fintech-subtle flex items-center justify-center">
                      <QrCode className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-semibold mb-1">Nenhum link de pagamento</p>
                    <p className="text-sm text-muted-foreground mb-4">Crie links para receber pagamentos dos seus clientes.</p>
                    <Button className="gradient-fintech border-0 text-primary-foreground" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Link
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {links.map((link) => {
                      const config = statusConfig[link.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      return (
                        <div key={link.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Link2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{link.description || link.code}</p>
                              <p className="text-xs text-muted-foreground font-mono">{link.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-bold font-mono text-sm">{formatCurrency(Number(link.amount))}</p>
                            <Badge variant="secondary" className={config.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailsCode(link.code)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(link.code)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multicaixa */}
          <TabsContent value="multicaixa">
            <Card>
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-warning" />
                </div>
                <p className="font-semibold mb-1">Multicaixa Express</p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Integração com Multicaixa Express para receber pagamentos directamente na sua conta. 
                  Configure a sua conta EMIS para começar.
                </p>
                <Badge variant="secondary" className="bg-warning/10 text-warning">Em breve</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Reconciliation */}
          <TabsContent value="reconciliacao">
            <Card>
              <CardContent className="p-0">
                {loadingRecon ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                  </div>
                ) : reconciliations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-semibold mb-1">Nenhuma conciliação</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      A conciliação automática comparará pagamentos bancários com as suas faturas.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {reconciliations.map((recon) => {
                      const config = statusConfig[recon.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      return (
                        <div key={recon.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{recon.bank_reference || 'Ref. bancária'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(recon.created_at).toLocaleDateString('pt-AO')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-mono text-sm">{formatCurrency(Number(recon.bank_amount))}</p>
                              <p className="text-xs text-muted-foreground">Banco</p>
                            </div>
                            <Badge variant="secondary" className={config.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
