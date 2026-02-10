import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { TopClients } from '@/components/dashboard/TopClients';
import { useDashboardStats, useFaturas } from '@/hooks/useFaturas';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, formatNumber } from '@/lib/format';
import { 
  Banknote, 
  Receipt, 
  FileText, 
  Users,
  AlertCircle,
  Clock,
  Plus,
  Loader2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: faturas = [] } = useFaturas();
  const { data: clientes = [] } = useClientes();

  const faturasVencidas = faturas.filter(f => 
    f.estado === 'emitida' && new Date(f.data_vencimento) < new Date()
  ).length;

  if (loadingStats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="relative w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Header with Gradient */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Visão geral da sua faturação
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Tempo real
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Button 
            asChild 
            size="lg"
            className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <Link to="/faturas/nova">
              <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
              Nova Fatura
              <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Modern Stats Grid with Stagger Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <StatCard
            title="Faturação Mensal"
            value={formatCurrency(stats?.faturacaoMensal || 0)}
            icon={Banknote}
            variant="primary"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <StatCard
            title="IVA a Entregar"
            value={formatCurrency(stats?.ivaMensal || 0)}
            subtitle="14% sobre faturação"
            icon={Receipt}
            variant="warning"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <StatCard
            title="Faturas Emitidas"
            value={formatNumber(stats?.faturasEmitidas || 0)}
            subtitle={`${stats?.faturasPendentes || 0} pendentes`}
            icon={FileText}
            variant="success"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <StatCard
            title="Total Clientes"
            value={formatNumber(stats?.totalClientes || 0)}
            icon={Users}
            variant="default"
          />
        </div>
      </div>

      {/* Enhanced Alert for Overdue Invoices */}
      {faturasVencidas > 0 && (
        <div className="group relative mb-8 overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent p-6 shadow-sm hover:shadow-md transition-all animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg text-destructive flex items-center gap-2">
                {faturasVencidas} fatura{faturasVencidas > 1 ? 's' : ''} vencida{faturasVencidas > 1 ? 's' : ''}
                <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 font-normal">
                  Ação necessária
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Existem faturas por cobrar com data de vencimento ultrapassada.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 transition-all shadow-sm group/btn" 
              asChild
            >
              <Link to="/faturas?estado=vencida">
                <Clock className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                Ver Faturas
                <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Charts and Lists with Glass Effect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <RevenueChart />
        </div>
        <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <TopClients clientes={clientes} faturas={faturas} />
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <RecentInvoices faturas={faturas.slice(0, 5)} />
      </div>
    </MainLayout>
  );
}