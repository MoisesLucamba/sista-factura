import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { TopClients } from '@/components/dashboard/TopClients';
import { mockDashboardStats } from '@/lib/mock-data';
import { formatCurrency, formatNumber } from '@/lib/format';
import { 
  Banknote, 
  Receipt, 
  FileText, 
  Users,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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
          value={formatCurrency(mockDashboardStats.faturacaoMensal)}
          icon={Banknote}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="IVA a Entregar"
          value={formatCurrency(mockDashboardStats.ivaMensal)}
          subtitle="14% sobre faturação"
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Faturas Emitidas"
          value={formatNumber(mockDashboardStats.faturasEmitidas)}
          subtitle={`${mockDashboardStats.faturasPendentes} pendentes`}
          icon={FileText}
          variant="success"
        />
        <StatCard
          title="Total Clientes"
          value={formatNumber(mockDashboardStats.totalClientes)}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          variant="default"
        />
      </div>

      {/* Alert for overdue invoices */}
      {mockDashboardStats.faturasVencidas > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-destructive">
              {mockDashboardStats.faturasVencidas} fatura(s) vencida(s)
            </p>
            <p className="text-sm text-destructive/80">
              Existem faturas por cobrar com data de vencimento ultrapassada.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <Clock className="w-4 h-4 mr-2" />
            Ver Faturas
          </Button>
        </div>
      )}

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <TopClients />
        </div>
      </div>

      <div className="mt-6">
        <RecentInvoices />
      </div>
    </MainLayout>
  );
}
