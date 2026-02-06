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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da sua faturação
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow">
          <Link to="/faturas/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Faturação Mensal"
          value={formatCurrency(stats?.faturacaoMensal || 0)}
          icon={Banknote}
          variant="primary"
        />
        <StatCard
          title="IVA a Entregar"
          value={formatCurrency(stats?.ivaMensal || 0)}
          subtitle="14% sobre faturação"
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Faturas Emitidas"
          value={formatNumber(stats?.faturasEmitidas || 0)}
          subtitle={`${stats?.faturasPendentes || 0} pendentes`}
          icon={FileText}
          variant="success"
        />
        <StatCard
          title="Total Clientes"
          value={formatNumber(stats?.totalClientes || 0)}
          icon={Users}
          variant="default"
        />
      </div>

      {/* Alert for overdue invoices */}
      {faturasVencidas > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-destructive">
              {faturasVencidas} fatura(s) vencida(s)
            </p>
            <p className="text-sm text-destructive/80">
              Existem faturas por cobrar com data de vencimento ultrapassada.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" asChild>
            <Link to="/faturas?estado=vencida">
              <Clock className="w-4 h-4 mr-2" />
              Ver Faturas
            </Link>
          </Button>
        </div>
      )}

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <TopClients clientes={clientes} faturas={faturas} />
        </div>
      </div>

      <div className="mt-6">
        <RecentInvoices faturas={faturas.slice(0, 5)} />
      </div>
    </MainLayout>
  );
}
