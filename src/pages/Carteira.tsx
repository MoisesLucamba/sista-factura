import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Send, QrCode,
  TrendingUp, Plus, Eye, EyeOff, CreditCard, Building2,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

function useWalletData() {
  const { user } = useAuth();
  
  const transactions = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = useQuery({
    queryKey: ['wallet-stats', user?.id],
    queryFn: async () => {
      const { data: txns } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('status', 'completed');
      
      const received = (txns || []).filter(t => t.type === 'payment' || t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0);
      const sent = (txns || []).filter(t => t.type === 'transfer' || t.type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0);
      return { balance: received - sent, received, sent };
    },
    enabled: !!user,
  });

  return { transactions, stats };
}

export default function Carteira() {
  const [showBalance, setShowBalance] = useState(true);
  const { stats, transactions } = useWalletData();

  const balance = stats.data?.balance || 0;
  const received = stats.data?.received || 0;
  const sent = stats.data?.sent || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero Wallet Card */}
        <div className="relative overflow-hidden rounded-2xl gradient-fintech p-8 text-primary-foreground">
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">Carteira Faktura</p>
                  <p className="text-xs text-white/50">Conta principal</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            </div>

            <div className="mb-8">
              <p className="text-sm text-white/60 mb-1">Saldo disponível</p>
              <h1 className="text-4xl font-black font-mono tracking-tight">
                {showBalance ? formatCurrency(balance) : '••••••••'}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-foreground/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownLeft className="w-4 h-4 text-success" />
                  <span className="text-xs text-primary-foreground/60">Recebido</span>
                </div>
                <p className="text-lg font-bold font-mono">
                  {showBalance ? formatCurrency(received) : '••••'}
                </p>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="w-4 h-4 text-warning" />
                  <span className="text-xs text-primary-foreground/60">Enviado</span>
                </div>
                <p className="text-lg font-bold font-mono">
                  {showBalance ? formatCurrency(sent) : '••••'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Send, label: 'Enviar', desc: 'Transferir fundos', color: 'text-primary' },
            { icon: QrCode, label: 'Cobrar', desc: 'Gerar link', color: 'text-primary' },
            { icon: CreditCard, label: 'Multicaixa', desc: 'Depósito', color: 'text-warning' },
            { icon: Building2, label: 'Banco', desc: 'Transferência', color: 'text-muted-foreground' },
          ].map((action) => (
            <Card key={action.label} className="group cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Transações Recentes
                </CardTitle>
                <CardDescription>Últimos movimentos da sua carteira</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (transactions.data || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-semibold mb-1">Nenhuma transação</p>
                <p className="text-sm text-muted-foreground">As suas transações aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(transactions.data || []).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'payment' || tx.type === 'deposit' ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {tx.type === 'payment' || tx.type === 'deposit' 
                          ? <ArrowDownLeft className="w-5 h-5 text-success" />
                          : <ArrowUpRight className="w-5 h-5 text-destructive" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold font-mono text-sm ${
                        tx.type === 'payment' || tx.type === 'deposit' ? 'text-success' : 'text-destructive'
                      }`}>
                        {tx.type === 'payment' || tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : tx.status}
                      </Badge>
                    </div>
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
