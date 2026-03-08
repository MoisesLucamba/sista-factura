import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { TopClients } from '@/components/dashboard/TopClients';
import { useDashboardStats, useFaturas } from '@/hooks/useFaturas';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Sparkles,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

/* ─── Animated counter ───────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const duration = 900;
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else setDisplay(target);
    };
    requestAnimationFrame(step);
  }, [value]);

  const formatted = typeof value === 'string' && value.includes(',')
    ? prefix + display.toLocaleString('pt-AO', { maximumFractionDigits: 0 }) + suffix
    : prefix + Math.round(display).toLocaleString() + suffix;

  return <span>{formatted}</span>;
}

/* ─── Time greeting ──────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: faturas = [] } = useFaturas();
  const { data: clientes = [] } = useClientes();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const faturasVencidas = faturas.filter(
    (f) => f.estado === 'emitida' && new Date(f.data_vencimento) < new Date()
  ).length;

  // Auto-mark overdue invoices on load
  useEffect(() => {
    if (user?.id) {
      supabase.rpc('mark_overdue_invoices', { _user_id: user.id }).then(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* ── Loading ── */
  if (loadingStats) {
    return (
      <MainLayout>
        <style>{`
          @keyframes dash { to { stroke-dashoffset: 0; } }
          .loader-ring { animation: spin 1.2s linear infinite; transform-origin: center; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div className="flex flex-col items-center justify-center h-72 gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary loader-ring" />
            <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-center" style={{ animation: 'fade-up .6s ease both .2s' }}>
            <p className="text-sm font-semibold text-foreground">A carregar dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">A sincronizar os seus dados…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const statItems: Array<{ title: string; value: string; subtitle?: string; icon: any; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; trend?: { value: number; isPositive: boolean } }> = [
    {
      title: 'Faturação Mensal',
      value: formatCurrency(stats?.faturacaoMensal || 0),
      icon: Banknote,
      variant: 'primary',
      trend: stats?.trendPercentage !== undefined ? { value: Math.abs(stats.trendPercentage), isPositive: stats.trendPercentage >= 0 } : undefined,
    },
    {
      title: 'IVA a Entregar',
      value: formatCurrency(stats?.ivaMensal || 0),
      subtitle: '14% sobre faturação',
      icon: Receipt,
      variant: 'warning',
    },
    {
      title: 'Faturas Emitidas',
      value: formatNumber(stats?.faturasEmitidas || 0),
      subtitle: `${stats?.faturasPendentes || 0} pendentes`,
      icon: FileText,
      variant: 'success',
    },
    {
      title: 'Total Clientes',
      value: formatNumber(stats?.totalClientes || 0),
      icon: Users,
      variant: 'default',
    },
  ];

  return (
    <MainLayout>
      <style>{`
        @keyframes fade-up   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fade-left { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes alert-in  { from { opacity:0; transform:translateY(-10px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        .anim-fade-up   { animation: fade-up  .55s cubic-bezier(.4,0,.2,1) both; }
        .anim-fade-left { animation: fade-left .55s cubic-bezier(.4,0,.2,1) both; }
        .anim-alert-in  { animation: alert-in  .5s cubic-bezier(.34,1.56,.64,1) both; }
        .anim-float     { animation: float 5s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/.55) 45%, hsl(var(--primary)) 90%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .stat-card-wrap { transition: transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s ease; }
        .stat-card-wrap:hover { transform: translateY(-4px); box-shadow: 0 12px 32px hsl(var(--primary)/.1); }

        .quick-action { transition: all .25s cubic-bezier(.4,0,.2,1); }
        .quick-action:hover { transform: translateY(-2px); }

        .live-dot { animation: pulse-dot 1.8s ease-in-out infinite; }

        .grid-section { transition: all .3s ease; }
        .grid-section:hover { transform: translateY(-2px); }
      `}</style>

      {/* ── Hero Header ── */}
      <div
        className="anim-fade-up relative mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-7"
        style={{ animationDelay: '0ms' }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl anim-float" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Left: greeting + title */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background live-dot" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-0.5">
                {getGreeting()} 👋
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                <span className="shimmer-text">Dashboard</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
                <span className="text-xs text-muted-foreground">Dados em tempo real</span>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-2 hover:bg-primary/8 hover:border-primary/40 transition-all border-border/60"
              asChild
            >
              <Link to="/faturas">
                <FileText className="w-4 h-4" />
                Ver Faturas
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group"
            >
              <Link to="/faturas/nova">
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Nova Fatura
                <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Overdue Alert ── */}
      {faturasVencidas > 0 && (
        <div
          className="anim-alert-in group relative mb-6 overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent p-5"
          style={{ animationDelay: '100ms' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-destructive/60 via-destructive/30 to-transparent" />
          <div className="absolute inset-0 bg-destructive/3 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center flex-shrink-0 shadow-md shadow-destructive/20">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-destructive">
                  {faturasVencidas} fatura{faturasVencidas > 1 ? 's' : ''} vencida{faturasVencidas > 1 ? 's' : ''}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold border border-destructive/20">
                  Ação necessária
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Existem faturas por cobrar com data de vencimento ultrapassada.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 border-destructive/35 text-destructive hover:bg-destructive/10 hover:border-destructive/60 transition-all group/btn"
              asChild
            >
              <Link to="/faturas?estado=vencida">
                <Clock className="w-4 h-4 mr-2" />
                Resolver
                <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statItems.map((item, i) => (
          <div
            key={i}
            className="stat-card-wrap anim-fade-up"
            style={{ animationDelay: `${150 + i * 80}ms` }}
          >
            <StatCard
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              variant={item.variant}
              trend={item.trend}
            />
          </div>
        ))}
      </div>

      {/* ── Quick info band ── */}
      <div
        className="anim-fade-up grid grid-cols-3 gap-3 mb-6"
        style={{ animationDelay: '450ms' }}
      >
        {[
          { label: 'Este mês', value: formatCurrency(stats?.faturacaoMensal || 0), icon: Sparkles, color: 'text-primary' },
          { label: 'Pendentes', value: `${stats?.faturasPendentes || 0} faturas`, icon: Clock, color: 'text-amber-500' },
          { label: 'Clientes activos', value: formatNumber(stats?.totalClientes || 0), icon: Users, color: 'text-emerald-500' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={i}
            className="quick-action bg-card border border-border/50 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-primary/25 hover:shadow-md cursor-default"
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className="text-sm font-bold truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts + Top Clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div
          className="anim-fade-up lg:col-span-2 grid-section"
          style={{ animationDelay: '500ms' }}
        >
          <RevenueChart />
        </div>
        <div
          className="anim-fade-up lg:col-span-1 grid-section"
          style={{ animationDelay: '580ms' }}
        >
          <TopClients clientes={clientes} faturas={faturas} />
        </div>
      </div>

      {/* ── Recent Invoices + Referrals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="anim-fade-up lg:col-span-2 grid-section"
          style={{ animationDelay: '660ms' }}
        >
          <RecentInvoices faturas={faturas.slice(0, 5)} />
        </div>
        <div
          className="anim-fade-up lg:col-span-1 grid-section"
          style={{ animationDelay: '740ms' }}
        >
          <ReferralDashboard />
        </div>
      </div>
    </MainLayout>
  );
}