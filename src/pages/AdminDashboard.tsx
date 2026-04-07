import { useState, useEffect, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Users, FileText, ShieldCheck, ShieldX, Eye, CheckCircle, XCircle,
  Loader2, UserCheck, UserX, Clock, TrendingUp, Banknote, BarChart3,
  AlertTriangle, Search, Activity, RefreshCw, History,
  Building2, Shield, Mail, Phone, Hash, CalendarDays, ArrowUpRight,
  ArrowDownRight, Lock, Unlock, UserCog, Key, Ban, ToggleLeft,
  ToggleRight, CreditCard, Receipt, FileCheck, Copy, ExternalLink,
  ChevronDown, ChevronUp, Globe, Settings, Package, Layers,
  DollarSign, TrendingDown, Info, AlertCircle, MoreHorizontal,
  Filter, Download, Printer,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  nif: string | null;
  telefone: string | null;
  tipo: string | null;
  approval_status: string;
  id_doc_front_url: string | null;
  id_doc_back_url: string | null;
  id_doc_nif_url: string | null;
  seller_subtype: string | null;
  created_at: string;
  rejection_reason: string | null;
  faktura_id: string | null;
  // Extended fields
  is_blocked?: boolean;
  morada?: string | null;
  cidade?: string | null;
  pais?: string | null;
  // Page permissions (stored as JSON in profile or separate table)
  page_permissions?: Record<string, boolean>;
}

interface Fatura {
  id: string;
  numero: string;
  total: number;
  estado: string;
  data_emissao: string;
  cliente_nome?: string;
}

interface Pagamento {
  id: string;
  valor: number;
  estado: string;
  metodo: string;
  created_at: string;
  referencia?: string;
}

interface SystemStats {
  totalUsers: number;
  pendingApprovals: number;
  totalFaturas: number;
  totalRevenue: number;
  totalBuyers: number;
  totalSellers: number;
  approvedUsers: number;
  rejectedUsers: number;
  blockedUsers: number;
  recentSignups: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
  totalPagamentos: number;
  pendingPagamentos: number;
}

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

// Platform pages/features that can be toggled per user
const PLATFORM_PAGES = [
  { key: 'faturas', label: 'Faturas', icon: FileText, description: 'Criar e gerir faturas' },
  { key: 'pagamentos', label: 'Pagamentos', icon: CreditCard, description: 'Efetuar e ver pagamentos' },
  { key: 'relatorios', label: 'Relatórios', icon: BarChart3, description: 'Acesso a relatórios' },
  { key: 'clientes', label: 'Clientes', icon: Users, description: 'Gestão de clientes' },
  { key: 'produtos', label: 'Produtos/Serviços', icon: Package, description: 'Catálogo de produtos' },
  { key: 'perfil', label: 'Editar Perfil', icon: UserCog, description: 'Editar dados do perfil' },
  { key: 'exportar', label: 'Exportar Dados', icon: Download, description: 'Exportar dados em CSV/PDF' },
  { key: 'api', label: 'Acesso API', icon: Key, description: 'Integração via API' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[140px]">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: e.color }}>
            {e.name}: {typeof e.value === 'number' && e.name?.toLowerCase().includes('valor') ? formatCurrency(e.value) : e.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  // Core data
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected user & their detail data
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userFaturas, setUserFaturas] = useState<Fatura[]>([]);
  const [userPagamentos, setUserPagamentos] = useState<Pagamento[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // Dialogs
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeSection, setActiveSection] = useState('overview');
  const [userDetailTab, setUserDetailTab] = useState('info');

  // Doc urls
  const [docUrls, setDocUrls] = useState<{ front: string | null; back: string | null; nif: string | null }>({ front: null, back: null, nif: null });

  // ── Load all data ────────────────────────────────────────────────────────

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profiles) setUsers(profiles as unknown as Profile[]);

      const { count: totalFaturas } = await supabase.from('faturas').select('*', { count: 'exact', head: true });
      const { data: revenueData } = await supabase.from('faturas').select('total, data_emissao').in('estado', ['emitida', 'paga']);
      const totalRevenue = revenueData?.reduce((s, f) => s + Number(f.total), 0) || 0;

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonth = now.getMonth() === 0
        ? `${now.getFullYear() - 1}-12`
        : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
      const monthlyRevenue = revenueData?.filter(f => f.data_emissao?.startsWith(thisMonth)).reduce((s, f) => s + Number(f.total), 0) || 0;
      const prevMonthRevenue = revenueData?.filter(f => f.data_emissao?.startsWith(prevMonth)).reduce((s, f) => s + Number(f.total), 0) || 0;

      const { count: totalPagamentos } = await supabase.from('pagamentos').select('*', { count: 'exact', head: true });
      const { count: pendingPagamentos } = await supabase.from('pagamentos').select('*', { count: 'exact', head: true }).eq('estado', 'pendente');

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      setStats({
        totalUsers: profiles?.length || 0,
        pendingApprovals: profiles?.filter(p => (p as any).approval_status === 'pending').length || 0,
        totalFaturas: totalFaturas || 0,
        totalRevenue,
        totalBuyers: profiles?.filter(p => (p as any).tipo === 'comprador').length || 0,
        totalSellers: profiles?.filter(p => (p as any).tipo !== 'comprador').length || 0,
        approvedUsers: profiles?.filter(p => (p as any).approval_status === 'approved').length || 0,
        rejectedUsers: profiles?.filter(p => (p as any).approval_status === 'rejected').length || 0,
        blockedUsers: profiles?.filter(p => (p as any).is_blocked).length || 0,
        recentSignups: profiles?.filter(p => p.created_at >= sevenDaysAgo).length || 0,
        monthlyRevenue,
        prevMonthRevenue,
        totalPagamentos: totalPagamentos || 0,
        pendingPagamentos: pendingPagamentos || 0,
      });

      const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (logs) setAuditLogs(logs as unknown as AuditEntry[]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Erro ao carregar dados');
    }
    setLoading(false);
  };

  // ── Load user detail ──────────────────────────────────────────────────────

  const openUserDetail = async (u: Profile) => {
    setSelectedUser(u);
    setUserDetailTab('info');
    setShowUserDetail(true);
    setLoadingUserDetail(true);

    try {
      // Faturas do utilizador
      const { data: faturas } = await supabase
        .from('faturas')
        .select('id, numero, total, estado, data_emissao, cliente_nome')
        .eq('user_id', u.user_id)
        .order('data_emissao', { ascending: false })
        .limit(50);
      setUserFaturas((faturas as unknown as Fatura[]) || []);

      // Pagamentos do utilizador
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('id, valor, estado, metodo, created_at, referencia')
        .eq('user_id', u.user_id)
        .order('created_at', { ascending: false })
        .limit(50);
      setUserPagamentos((pagamentos as unknown as Pagamento[]) || []);

      // Permissões (assumindo campo page_permissions JSONB no perfil)
      const perms: Record<string, boolean> = {};
      PLATFORM_PAGES.forEach(p => {
        perms[p.key] = (u as any).page_permissions?.[p.key] !== false; // default true
      });
      setUserPermissions(perms);
    } catch (e) {
      console.error(e);
    }
    setLoadingUserDetail(false);
  };

  // ── Approve / Reject ──────────────────────────────────────────────────────

  const approveUser = async (u: Profile) => {
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id } as any)
      .eq('user_id', u.user_id);
    if (error) toast.error('Erro ao aprovar utilizador');
    else {
      toast.success(`${u.nome} aprovado com sucesso!`);
      loadData();
      if (selectedUser?.user_id === u.user_id) setSelectedUser({ ...selectedUser, approval_status: 'approved' });
    }
    setProcessing(false);
  };

  const rejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) { toast.error('Indique o motivo'); return; }
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'rejected', rejection_reason: rejectionReason, approved_at: new Date().toISOString(), approved_by: user?.id } as any)
      .eq('user_id', selectedUser.user_id);
    if (error) toast.error('Erro ao rejeitar');
    else {
      toast.success(`${selectedUser.nome} rejeitado.`);
      loadData();
      setShowRejectDialog(false);
      setSelectedUser({ ...selectedUser, approval_status: 'rejected', rejection_reason: rejectionReason });
    }
    setProcessing(false);
  };

  const reactivateUser = async (u: Profile) => {
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'pending', rejection_reason: null, approved_at: null, approved_by: null } as any)
      .eq('user_id', u.user_id);
    if (error) toast.error('Erro ao reactivar');
    else {
      toast.success(`${u.nome} reactivado para revisão.`);
      loadData();
      if (selectedUser?.user_id === u.user_id) setSelectedUser({ ...selectedUser, approval_status: 'pending', rejection_reason: null });
    }
    setProcessing(false);
  };

  // ── Block / Unblock ───────────────────────────────────────────────────────

  const toggleBlock = async (u: Profile, block: boolean) => {
    if (block && !blockReason.trim()) { toast.error('Indique o motivo do bloqueio'); return; }
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: block, block_reason: block ? blockReason : null, blocked_at: block ? new Date().toISOString() : null, blocked_by: block ? user?.id : null } as any)
      .eq('user_id', u.user_id);
    if (error) toast.error('Erro ao alterar estado');
    else {
      toast.success(block ? `${u.nome} bloqueado.` : `${u.nome} desbloqueado.`);
      setShowBlockDialog(false);
      setBlockReason('');
      loadData();
      if (selectedUser?.user_id === u.user_id) setSelectedUser({ ...selectedUser, is_blocked: block });
    }
    setProcessing(false);
  };

  // ── Page Permissions ──────────────────────────────────────────────────────

  const savePermissions = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ page_permissions: userPermissions } as any)
      .eq('user_id', selectedUser.user_id);
    if (error) toast.error('Erro ao guardar permissões');
    else {
      toast.success('Permissões atualizadas!');
      setShowPermissionsDialog(false);
      loadData();
    }
    setProcessing(false);
  };

  // ── Documents ─────────────────────────────────────────────────────────────

  const viewDocuments = async (u: Profile) => {
    setSelectedUser(u);
    setDocUrls({ front: null, back: null, nif: null });
    if (u.id_doc_front_url) {
      const { data } = await supabase.storage.from('id-documents').createSignedUrl(u.id_doc_front_url, 300);
      if (data) setDocUrls(prev => ({ ...prev, front: data.signedUrl }));
    }
    if (u.id_doc_back_url) {
      const { data } = await supabase.storage.from('id-documents').createSignedUrl(u.id_doc_back_url, 300);
      if (data) setDocUrls(prev => ({ ...prev, back: data.signedUrl }));
    }
    if (u.id_doc_nif_url) {
      const { data } = await supabase.storage.from('id-documents').createSignedUrl(u.id_doc_nif_url, 300);
      if (data) setDocUrls(prev => ({ ...prev, nif: data.signedUrl }));
    }
    setShowDocDialog(true);
  };

  // ── Filtered Users ────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery
      || u.nome.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.nif && u.nif.includes(searchQuery))
      || (u.faktura_id && u.faktura_id.toLowerCase().includes(q))
      || u.user_id.toLowerCase().includes(q);
    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'pending') return matchSearch && u.approval_status === 'pending';
    if (filterStatus === 'approved') return matchSearch && u.approval_status === 'approved';
    if (filterStatus === 'rejected') return matchSearch && u.approval_status === 'rejected';
    if (filterStatus === 'blocked') return matchSearch && u.is_blocked;
    if (filterStatus === 'buyers') return matchSearch && u.tipo === 'comprador';
    if (filterStatus === 'sellers') return matchSearch && u.tipo !== 'comprador';
    return matchSearch;
  }), [users, searchQuery, filterStatus]);

  // ── Charts ────────────────────────────────────────────────────────────────

  const registrationChart = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = new Date().getFullYear().toString();
    return months.map((mes, i) => {
      const m = String(i + 1).padStart(2, '0');
      return { mes, registos: users.filter(u => u.created_at?.startsWith(`${year}-${m}`)).length };
    });
  }, [users]);

  const statusDistribution = useMemo(() => [
    { name: 'Aprovados', value: stats?.approvedUsers || 0, color: '#22c55e' },
    { name: 'Pendentes', value: stats?.pendingApprovals || 0, color: '#f59e0b' },
    { name: 'Rejeitados', value: stats?.rejectedUsers || 0, color: '#ef4444' },
    { name: 'Bloqueados', value: stats?.blockedUsers || 0, color: '#6b7280' },
  ].filter(e => e.value > 0), [stats]);

  const revenueGrowth = stats && stats.prevMonthRevenue > 0
    ? ((stats.monthlyRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue * 100)
    : 0;

  // ── Badge Helpers ─────────────────────────────────────────────────────────

  const statusBadge = (status: string, blocked?: boolean) => {
    if (blocked) return <Badge className="bg-gray-500/15 text-gray-600 border-gray-500/30 gap-1"><Ban className="w-3 h-3" />Bloqueado</Badge>;
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle className="w-3 h-3" />Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
      default: return <Badge variant="outline" className="border-amber-500/40 text-amber-600 gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
    }
  };

  const typeBadge = (u: Profile) => {
    if (u.tipo === 'comprador') return <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">Comprador</Badge>;
    if (u.seller_subtype === 'empresa') return <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">Vendedor Empresa</Badge>;
    return <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">Vendedor Pessoal</Badge>;
  };

  const estadoFaturaBadge = (estado: string) => {
    switch (estado) {
      case 'paga': return <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Paga</Badge>;
      case 'emitida': return <Badge className="bg-blue-500/15 text-blue-600 text-[10px]">Emitida</Badge>;
      case 'cancelada': return <Badge variant="destructive" className="text-[10px]">Cancelada</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
  };

  const estadoPagamentoBadge = (estado: string) => {
    switch (estado) {
      case 'pago': case 'completo': return <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Pago</Badge>;
      case 'pendente': return <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">Pendente</Badge>;
      case 'falhado': return <Badge variant="destructive" className="text-[10px]">Falhado</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-72">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{`
        @keyframes fade-up { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }
        .afu { animation: fade-up .4s ease both; }
        .afu-1 { animation-delay:.05s; }
        .afu-2 { animation-delay:.1s; }
        .afu-3 { animation-delay:.15s; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div className="afu mb-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Painel de Administração</h1>
              <p className="text-sm text-muted-foreground mt-1">Controlo total: utilizadores, pagamentos, permissões e conformidade</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="w-4 h-4" />Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN TABS ═══ */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />Utilizadores
            {(stats?.pendingApprovals || 0) > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {stats?.pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />Pagamentos
            {(stats?.pendingPagamentos || 0) > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {stats?.pendingPagamentos}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <History className="w-3.5 h-3.5" />Auditoria
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Row 1 */}
          <div className="afu grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Utilizadores', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Aprovações Pendentes', value: stats?.pendingApprovals || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Faturas Emitidas', value: stats?.totalFaturas || 0, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Receita Total', value: formatCurrency(stats?.totalRevenue || 0), icon: Banknote, color: 'text-primary', bg: 'bg-primary/10' },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      <p className="text-2xl font-black mt-1">{value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPI Row 2 */}
          <div className="afu afu-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Aprovados', value: stats?.approvedUsers || 0, icon: UserCheck, color: 'text-emerald-500' },
              { label: 'Rejeitados', value: stats?.rejectedUsers || 0, icon: UserX, color: 'text-destructive' },
              { label: 'Bloqueados', value: stats?.blockedUsers || 0, icon: Ban, color: 'text-gray-500' },
              {
                label: 'Crescimento Mensal',
                value: `${revenueGrowth >= 0 ? '+' : ''}${Math.abs(revenueGrowth).toFixed(1)}%`,
                icon: revenueGrowth >= 0 ? ArrowUpRight : ArrowDownRight,
                color: revenueGrowth >= 0 ? 'text-emerald-500' : 'text-destructive',
              },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="afu afu-2 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />Registos Mensais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={registrationChart}>
                    <defs>
                      <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="registos" name="Registos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#regFill)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />Estado dos Utilizadores
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false}>
                        {statusDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} utilizador(es)`]} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={v => <span className="text-xs text-muted-foreground">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">Sem dados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registos recentes */}
          <Card className="afu afu-3 border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />Registos Recentes (7 dias)
                </CardTitle>
                <Badge variant="secondary">{stats?.recentSignups || 0} novos</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {users
                  .filter(u => u.created_at >= new Date(Date.now() - 7 * 86400000).toISOString())
                  .slice(0, 8)
                  .map(u => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => openUserDetail(u)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{u.nome.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeBadge(u)}
                        {statusBadge(u.approval_status, u.is_blocked)}
                      </div>
                    </div>
                  ))}
                {(stats?.recentSignups || 0) === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">Nenhum registo nos últimos 7 dias</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB: UTILIZADORES
        ══════════════════════════════════════ */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Gestão de Utilizadores
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, email, NIF, ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                <TabsList className="mb-4 flex-wrap gap-1">
                  <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    <Clock className="w-3.5 h-3.5" />Pendentes
                    {(stats?.pendingApprovals || 0) > 0 && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                        {stats?.pendingApprovals}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Aprovados</TabsTrigger>
                  <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
                  <TabsTrigger value="blocked">
                    <Ban className="w-3.5 h-3.5 mr-1" />Bloqueados
                  </TabsTrigger>
                  <TabsTrigger value="buyers">Compradores</TabsTrigger>
                  <TabsTrigger value="sellers">Vendedores</TabsTrigger>
                </TabsList>

                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhum utilizador encontrado</p>
                    </div>
                  ) : (
                    filteredUsers.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/25 hover:bg-muted/30 transition-all"
                      >
                        {/* Avatar + Info */}
                        <div
                          className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                          onClick={() => openUserDetail(u)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_blocked ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary/10'}`}>
                            {u.is_blocked
                              ? <Ban className="w-4 h-4 text-gray-500" />
                              : <span className="text-sm font-bold text-primary">{u.nome.charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{u.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {typeBadge(u)}
                              {u.nif && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Hash className="w-3 h-3" />NIF: {u.nif}
                                </span>
                              )}
                              {u.faktura_id && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />{u.faktura_id}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString('pt-AO')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {statusBadge(u.approval_status, u.is_blocked)}

                          {/* Ver detalhes */}
                          <Button variant="outline" size="sm" onClick={() => openUserDetail(u)} className="gap-1">
                            <Eye className="w-3.5 h-3.5" />Ver
                          </Button>

                          {/* Docs */}
                          {(u.id_doc_front_url || u.id_doc_back_url || u.id_doc_nif_url) && (
                            <Button variant="outline" size="sm" onClick={() => viewDocuments(u)} className="gap-1">
                              <FileCheck className="w-3.5 h-3.5" />Docs
                            </Button>
                          )}

                          {/* Permissões */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedUser(u); const perms: Record<string, boolean> = {}; PLATFORM_PAGES.forEach(p => { perms[p.key] = (u as any).page_permissions?.[p.key] !== false; }); setUserPermissions(perms); setShowPermissionsDialog(true); }}
                            className="gap-1"
                          >
                            <Key className="w-3.5 h-3.5" />Perm.
                          </Button>

                          {/* Aprovar/Rejeitar (pending) */}
                          {u.approval_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => approveUser(u)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle className="w-3.5 h-3.5" />Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(u); setRejectionReason(''); setShowRejectDialog(true); }} disabled={processing} className="gap-1">
                                <XCircle className="w-3.5 h-3.5" />Rejeitar
                              </Button>
                            </>
                          )}

                          {/* Reactivar (rejected) */}
                          {u.approval_status === 'rejected' && (
                            <Button size="sm" variant="outline" onClick={() => reactivateUser(u)} disabled={processing} className="gap-1">
                              <RefreshCw className="w-3.5 h-3.5" />Reactivar
                            </Button>
                          )}

                          {/* Bloquear / Desbloquear */}
                          {u.is_blocked ? (
                            <Button size="sm" variant="outline" onClick={() => toggleBlock(u, false)} disabled={processing} className="gap-1 border-gray-500/30 text-gray-600">
                              <Unlock className="w-3.5 h-3.5" />Desbloquear
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setBlockReason(''); setShowBlockDialog(true); }} disabled={processing} className="gap-1 border-red-500/30 text-red-600 hover:bg-red-50">
                              <Lock className="w-3.5 h-3.5" />Bloquear
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB: PAGAMENTOS
        ══════════════════════════════════════ */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Pagamentos', value: stats?.totalPagamentos || 0, icon: Receipt, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Pendentes', value: stats?.pendingPagamentos || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Receita Este Mês', value: formatCurrency(stats?.monthlyRevenue || 0), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Mês Anterior', value: formatCurrency(stats?.prevMonthRevenue || 0), icon: TrendingDown, color: 'text-muted-foreground', bg: 'bg-muted' },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-black mt-1">{value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />Todos os Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <AllPaymentsTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB: AUDITORIA
        ══════════════════════════════════════ */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />Registos de Auditoria
                </CardTitle>
                <Badge variant="secondary">{auditLogs.length} registos</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum registo de auditoria</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-all">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.action} — <span className="text-muted-foreground">{log.entity_type}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-AO')}
                        </p>
                      </div>
                      {log.entity_id && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-mono">{log.entity_id.slice(0, 8)}...</span>
                          <button onClick={() => copyToClipboard(log.entity_id!)} className="text-muted-foreground hover:text-foreground">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════
          DIALOG: USER DETAIL
      ══════════════════════════════════════ */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {selectedUser && (
            <>
              {/* Header */}
              <div className={`p-6 border-b ${selectedUser.is_blocked ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gradient-to-r from-primary/10 to-transparent'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${selectedUser.is_blocked ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' : 'bg-primary/20 text-primary'}`}>
                      {selectedUser.is_blocked ? <Ban className="w-7 h-7" /> : selectedUser.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{selectedUser.nome}</h2>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {typeBadge(selectedUser)}
                        {statusBadge(selectedUser.approval_status, selectedUser.is_blocked)}
                      </div>
                    </div>
                  </div>
                  {/* Quick Actions in header */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {selectedUser.approval_status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => approveUser(selectedUser)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectionReason(''); setShowRejectDialog(true); }} disabled={processing} className="gap-1">
                          <XCircle className="w-3.5 h-3.5" />Rejeitar
                        </Button>
                      </>
                    )}
                    {selectedUser.approval_status === 'rejected' && (
                      <Button size="sm" variant="outline" onClick={() => reactivateUser(selectedUser)} disabled={processing} className="gap-1">
                        <RefreshCw className="w-3.5 h-3.5" />Reactivar
                      </Button>
                    )}
                    {selectedUser.is_blocked ? (
                      <Button size="sm" variant="outline" onClick={() => toggleBlock(selectedUser, false)} disabled={processing} className="gap-1">
                        <Unlock className="w-3.5 h-3.5" />Desbloquear
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setBlockReason(''); setShowBlockDialog(true); }} className="gap-1 border-red-500/30 text-red-600">
                        <Lock className="w-3.5 h-3.5" />Bloquear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <Tabs value={userDetailTab} onValueChange={setUserDetailTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="info" className="gap-1.5"><Info className="w-3.5 h-3.5" />Informação</TabsTrigger>
                    <TabsTrigger value="faturas" className="gap-1.5">
                      <FileText className="w-3.5 h-3.5" />Faturas
                      {userFaturas.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({userFaturas.length})</span>}
                    </TabsTrigger>
                    <TabsTrigger value="pagamentos-user" className="gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />Pagamentos
                      {userPagamentos.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({userPagamentos.length})</span>}
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="gap-1.5">
                      <Key className="w-3.5 h-3.5" />Permissões
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />Documentos
                    </TabsTrigger>
                  </TabsList>

                  {/* ── INFO ── */}
                  <TabsContent value="info" className="space-y-4">
                    {loadingUserDetail ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                      <>
                        {/* ID do Utilizador */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">ID do Utilizador (UUID)</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-bold break-all">{selectedUser.user_id}</code>
                            <button onClick={() => copyToClipboard(selectedUser.user_id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {selectedUser.faktura_id && (
                          <div className="p-4 rounded-xl bg-muted/50 border border-border/40">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">ID Faktura</p>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono font-bold">{selectedUser.faktura_id}</code>
                              <button onClick={() => copyToClipboard(selectedUser.faktura_id!)} className="text-muted-foreground hover:text-foreground">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { icon: Mail, label: 'Email', value: selectedUser.email },
                            { icon: Phone, label: 'Telefone', value: selectedUser.telefone || '—' },
                            { icon: Hash, label: 'NIF', value: selectedUser.nif || '—' },
                            { icon: Building2, label: 'Tipo', value: selectedUser.tipo === 'comprador' ? 'Comprador' : `Vendedor ${selectedUser.seller_subtype === 'empresa' ? 'Empresa' : 'Pessoal'}` },
                            { icon: CalendarDays, label: 'Data de Registo', value: new Date(selectedUser.created_at).toLocaleString('pt-AO') },
                            { icon: Globe, label: 'Localização', value: [selectedUser.cidade, selectedUser.pais].filter(Boolean).join(', ') || '—' },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 p-3 rounded-lg border border-border/40">
                              <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-sm font-medium">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedUser.rejection_reason && (
                          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                            <p className="text-sm font-bold text-destructive mb-1">Motivo de Rejeição</p>
                            <p className="text-sm text-destructive/80">{selectedUser.rejection_reason}</p>
                          </div>
                        )}

                        {/* Stats resumo */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 rounded-xl bg-muted/50 border border-border/40 text-center">
                            <p className="text-2xl font-black">{userFaturas.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Faturas Emitidas</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 border border-border/40 text-center">
                            <p className="text-2xl font-black">{userPagamentos.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Pagamentos</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 border border-border/40 text-center">
                            <p className="text-2xl font-black text-emerald-600">
                              {formatCurrency(userFaturas.filter(f => ['emitida', 'paga'].includes(f.estado)).reduce((s, f) => s + Number(f.total), 0))}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Total Faturado</p>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* ── FATURAS ── */}
                  <TabsContent value="faturas">
                    {loadingUserDetail ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : userFaturas.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Nenhuma fatura emitida</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Totais */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                            <p className="text-xs text-muted-foreground">Total Faturas</p>
                            <p className="text-lg font-black">{userFaturas.length}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-muted-foreground">Pagas</p>
                            <p className="text-lg font-black text-emerald-600">{userFaturas.filter(f => f.estado === 'paga').length}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                            <p className="text-xs text-muted-foreground">Volume Total</p>
                            <p className="text-lg font-black">{formatCurrency(userFaturas.reduce((s, f) => s + Number(f.total), 0))}</p>
                          </div>
                        </div>

                        {userFaturas.map(f => (
                          <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{f.numero || f.id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {f.data_emissao ? new Date(f.data_emissao).toLocaleDateString('pt-AO') : '—'}
                                  {f.cliente_nome && ` · ${f.cliente_nome}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {estadoFaturaBadge(f.estado)}
                              <p className="text-sm font-bold">{formatCurrency(Number(f.total))}</p>
                              <button onClick={() => copyToClipboard(f.id)} className="text-muted-foreground hover:text-foreground">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ── PAGAMENTOS DO USER ── */}
                  <TabsContent value="pagamentos-user">
                    {loadingUserDetail ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : userPagamentos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Nenhum pagamento registado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                            <p className="text-xs text-muted-foreground">Total Pagamentos</p>
                            <p className="text-lg font-black">{userPagamentos.length}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-muted-foreground">Volume Total</p>
                            <p className="text-lg font-black text-emerald-600">{formatCurrency(userPagamentos.reduce((s, p) => s + Number(p.valor), 0))}</p>
                          </div>
                        </div>

                        {userPagamentos.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{p.metodo || 'Pagamento'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(p.created_at).toLocaleString('pt-AO')}
                                  {p.referencia && ` · Ref: ${p.referencia}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {estadoPagamentoBadge(p.estado)}
                              <p className="text-sm font-bold">{formatCurrency(Number(p.valor))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ── PERMISSÕES ── */}
                  <TabsContent value="permissions" className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Controle quais secções da plataforma este utilizador pode aceder. As alterações têm efeito imediato.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {PLATFORM_PAGES.map(page => {
                        const Icon = page.icon;
                        const enabled = userPermissions[page.key] !== false;
                        return (
                          <div key={page.key} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Icon className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{page.label}</p>
                                <p className="text-xs text-muted-foreground">{page.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                {enabled ? 'Permitido' : 'Bloqueado'}
                              </span>
                              <Switch
                                checked={enabled}
                                onCheckedChange={val => setUserPermissions(prev => ({ ...prev, [page.key]: val }))}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => { const all: Record<string, boolean> = {}; PLATFORM_PAGES.forEach(p => all[p.key] = false); setUserPermissions(all); }}>
                        <ShieldX className="w-4 h-4 mr-1" />Bloquear Tudo
                      </Button>
                      <Button variant="outline" onClick={() => { const all: Record<string, boolean> = {}; PLATFORM_PAGES.forEach(p => all[p.key] = true); setUserPermissions(all); }}>
                        <ShieldCheck className="w-4 h-4 mr-1" />Permitir Tudo
                      </Button>
                      <Button onClick={savePermissions} disabled={processing} className="gap-1">
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Guardar Permissões
                      </Button>
                    </div>
                  </TabsContent>

                  {/* ── DOCUMENTOS ── */}
                  <TabsContent value="docs">
                    <DocumentsTab user={selectedUser} supabase={supabase} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          DIALOG: REJEITAR
      ══════════════════════════════════════ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />Rejeitar — {selectedUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Indique o motivo da rejeição. O utilizador será notificado.</p>
            <Textarea
              placeholder="Ex: Documento ilegível, NIF inválido, dados inconsistentes..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={rejectUser} disabled={processing || !rejectionReason.trim()} className="gap-1">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          DIALOG: BLOQUEAR
      ══════════════════════════════════════ */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" />Bloquear Acesso — {selectedUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O utilizador ficará sem acesso à plataforma imediatamente. Indique o motivo.
            </p>
            <Textarea
              placeholder="Ex: Atividade suspeita, violação dos termos, pedido do utilizador..."
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && toggleBlock(selectedUser, true)}
              disabled={processing || !blockReason.trim()}
              className="gap-1"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          DIALOG: PERMISSÕES (from list)
      ══════════════════════════════════════ */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />Permissões — {selectedUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {PLATFORM_PAGES.map(page => {
              const Icon = page.icon;
              const enabled = userPermissions[page.key] !== false;
              return (
                <div key={page.key} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{page.label}</p>
                      <p className="text-xs text-muted-foreground">{page.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={val => setUserPermissions(prev => ({ ...prev, [page.key]: val }))}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>Cancelar</Button>
            <Button onClick={savePermissions} disabled={processing} className="gap-1">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocumentsTab({ user, supabase }: { user: Profile; supabase: any }) {
  const [docUrls, setDocUrls] = useState<{ front: string | null; back: string | null; nif: string | null }>({ front: null, back: null, nif: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const urls = { front: null as string | null, back: null as string | null, nif: null as string | null };
      if (user.id_doc_front_url) {
        const { data } = await supabase.storage.from('id-documents').createSignedUrl(user.id_doc_front_url, 300);
        if (data) urls.front = data.signedUrl;
      }
      if (user.id_doc_back_url) {
        const { data } = await supabase.storage.from('id-documents').createSignedUrl(user.id_doc_back_url, 300);
        if (data) urls.back = data.signedUrl;
      }
      if (user.id_doc_nif_url) {
        const { data } = await supabase.storage.from('id-documents').createSignedUrl(user.id_doc_nif_url, 300);
        if (data) urls.nif = data.signedUrl;
      }
      setDocUrls(urls);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const hasAnyDoc = docUrls.front || docUrls.back || docUrls.nif;

  if (!hasAnyDoc) return (
    <div className="text-center py-12 text-muted-foreground">
      <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhum documento enviado</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {user.seller_subtype === 'empresa' && docUrls.nif ? (
        <div className="space-y-2">
          <p className="text-sm font-bold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" />Documento NIF Empresa</p>
          <img src={docUrls.nif} alt="NIF Empresa" className="w-full rounded-xl border border-border object-contain max-h-80" />
          <a href={docUrls.nif} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="w-3.5 h-3.5" />Abrir em nova aba</Button>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Frente do Documento', url: docUrls.front },
            { label: 'Verso do Documento', url: docUrls.back },
          ].map(({ label, url }) => (
            <div key={label} className="space-y-2">
              <p className="text-sm font-bold">{label}</p>
              {url ? (
                <>
                  <img src={url} alt={label} className="w-full rounded-xl border border-border object-contain max-h-60" />
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1 w-full"><ExternalLink className="w-3.5 h-3.5" />Abrir</Button>
                  </a>
                </>
              ) : (
                <div className="w-full h-36 rounded-xl border border-dashed border-border flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Não enviado</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {docUrls.nif && user.seller_subtype !== 'empresa' && (
        <div className="space-y-2">
          <p className="text-sm font-bold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" />Documento NIF</p>
          <img src={docUrls.nif} alt="NIF" className="w-full rounded-xl border border-border object-contain max-h-60" />
          <a href={docUrls.nif} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="w-3.5 h-3.5" />Abrir em nova aba</Button>
          </a>
        </div>
      )}
    </div>
  );
}

function AllPaymentsTable() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('pagamentos')
        .select('*, profiles(nome, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      setPagamentos(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = pagamentos.filter(p => filterEstado === 'all' || p.estado === filterEstado);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'pendente', 'pago', 'falhado'].map(s => (
          <Button key={s} size="sm" variant={filterEstado === s ? 'default' : 'outline'} onClick={() => setFilterEstado(s)} className="capitalize">
            {s === 'all' ? 'Todos' : s}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{p.profiles?.nome || 'Utilizador'}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.metodo} · {new Date(p.created_at).toLocaleString('pt-AO')}
                    {p.referencia && ` · Ref: ${p.referencia}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px]">{p.metodo}</Badge>
                {p.estado === 'pago' || p.estado === 'completo'
                  ? <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Pago</Badge>
                  : p.estado === 'pendente'
                  ? <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">Pendente</Badge>
                  : <Badge variant="destructive" className="text-[10px]">{p.estado}</Badge>
                }
                <p className="text-sm font-bold">{formatCurrency(Number(p.valor))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}