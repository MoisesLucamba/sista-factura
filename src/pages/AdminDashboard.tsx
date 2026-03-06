import { useState, useEffect, useMemo } from 'react';
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
import { toast } from 'sonner';
import {
  Users, FileText, ShieldCheck, ShieldX, Eye, CheckCircle, XCircle,
  Loader2, UserCheck, UserX, Clock, TrendingUp, Banknote, BarChart3,
  AlertTriangle, Search, ChevronRight, Activity, RefreshCw, History,
  Building2, UserCog, Shield, Download, Mail, Phone, MapPin, CreditCard,
  FileCheck, Hash, CalendarDays, ArrowUpRight, ArrowDownRight, MoreVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface PendingUser {
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
  recentSignups: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
}

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[140px]">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: e.color }}>{e.name}: {formatCurrency(e.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeSection, setActiveSection] = useState('overview');
  const [docUrls, setDocUrls] = useState<{ front: string | null; back: string | null; nif: string | null }>({ front: null, back: null, nif: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profiles) setUsers(profiles as unknown as PendingUser[]);

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

      const buyers = profiles?.filter(p => p.tipo === 'comprador') || [];
      const sellers = profiles?.filter(p => p.tipo !== 'comprador') || [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const recentSignups = profiles?.filter(p => p.created_at >= sevenDaysAgo).length || 0;

      setStats({
        totalUsers: profiles?.length || 0,
        pendingApprovals: profiles?.filter(p => (p as any).approval_status === 'pending').length || 0,
        totalFaturas: totalFaturas || 0,
        totalRevenue,
        totalBuyers: buyers.length,
        totalSellers: sellers.length,
        approvedUsers: profiles?.filter(p => (p as any).approval_status === 'approved').length || 0,
        rejectedUsers: profiles?.filter(p => (p as any).approval_status === 'rejected').length || 0,
        recentSignups,
        monthlyRevenue,
        prevMonthRevenue,
      });

      // Audit logs
      const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (logs) setAuditLogs(logs as unknown as AuditEntry[]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  };

  const viewDocuments = async (u: PendingUser) => {
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

  const approveUser = async (u: PendingUser) => {
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id } as any)
      .eq('user_id', u.user_id);
    if (error) toast.error('Erro ao aprovar utilizador');
    else { toast.success(`${u.nome} foi aprovado com sucesso!`); loadData(); setShowDocDialog(false); }
    setProcessing(false);
  };

  const openRejectDialog = (u: PendingUser) => {
    setSelectedUser(u);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const rejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) { toast.error('Indique o motivo da rejeição'); return; }
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'rejected', rejection_reason: rejectionReason, approved_at: new Date().toISOString(), approved_by: user?.id } as any)
      .eq('user_id', selectedUser.user_id);
    if (error) toast.error('Erro ao rejeitar utilizador');
    else { toast.success(`${selectedUser.nome} foi rejeitado.`); loadData(); setShowRejectDialog(false); setShowDocDialog(false); }
    setProcessing(false);
  };

  const reactivateUser = async (u: PendingUser) => {
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: 'pending', rejection_reason: null, approved_at: null, approved_by: null } as any)
      .eq('user_id', u.user_id);
    if (error) toast.error('Erro ao reactivar');
    else { toast.success(`${u.nome} reactivado para revisão.`); loadData(); }
    setProcessing(false);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.nif && u.nif.includes(searchQuery));
    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'pending') return matchSearch && u.approval_status === 'pending';
    if (filterStatus === 'approved') return matchSearch && u.approval_status === 'approved';
    if (filterStatus === 'rejected') return matchSearch && u.approval_status === 'rejected';
    if (filterStatus === 'buyers') return matchSearch && u.tipo === 'comprador';
    if (filterStatus === 'sellers') return matchSearch && u.tipo !== 'comprador';
    return matchSearch;
  });

  // Monthly registrations chart
  const registrationChart = useMemo(() => {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const year = new Date().getFullYear().toString();
    return months.map((mes, i) => {
      const m = String(i + 1).padStart(2, '0');
      const count = users.filter(u => u.created_at?.startsWith(`${year}-${m}`)).length;
      return { mes, registos: count };
    });
  }, [users]);

  const statusDistribution = useMemo(() => [
    { name: 'Aprovados', value: stats?.approvedUsers || 0, color: '#22c55e' },
    { name: 'Pendentes', value: stats?.pendingApprovals || 0, color: '#f59e0b' },
    { name: 'Rejeitados', value: stats?.rejectedUsers || 0, color: '#ef4444' },
  ].filter(e => e.value > 0), [stats]);

  const revenueGrowth = stats && stats.prevMonthRevenue > 0
    ? ((stats.monthlyRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue * 100)
    : 0;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
      default: return <Badge variant="outline" className="border-amber-500/40 text-amber-600 gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
    }
  };

  const typeBadge = (u: PendingUser) => {
    if (u.tipo === 'comprador') return <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">Comprador</Badge>;
    if (u.seller_subtype === 'empresa') return <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">Vendedor Empresa</Badge>;
    return <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">Vendedor Pessoal</Badge>;
  };

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center h-72"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .afu { animation: fade-up .45s ease both; }
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
              <p className="text-sm text-muted-foreground mt-1">Gestão completa do sistema, utilizadores e conformidade</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* ═══ NAVIGATION TABS ═══ */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />Utilizadores
            {(stats?.pendingApprovals || 0) > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">{stats?.pendingApprovals}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><History className="w-3.5 h-3.5" />Auditoria</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW ═══ */}
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
                    <div><p className="text-xs text-muted-foreground font-medium">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <div><p className="text-xs text-muted-foreground">Aprovados</p><p className="font-bold">{stats?.approvedUsers || 0}</p></div>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3">
              <UserX className="w-5 h-5 text-destructive" />
              <div><p className="text-xs text-muted-foreground">Rejeitados</p><p className="font-bold">{stats?.rejectedUsers || 0}</p></div>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-purple-500" />
              <div><p className="text-xs text-muted-foreground">Vendedores</p><p className="font-bold">{stats?.totalSellers || 0}</p></div>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className={`w-5 h-5 ${revenueGrowth >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Crescimento Mensal</p>
                <p className="font-bold flex items-center gap-1">
                  {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </p>
              </div>
            </CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Registos Mensais</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={registrationChart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="registos" name="Registos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#regFill)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" />Estado Utilizadores</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false}>
                        {statusDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} utilizador(es)`]} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={v => <span className="text-xs text-muted-foreground">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">Sem dados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent signups */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Registos Recentes (7 dias)</CardTitle>
                <Badge variant="secondary">{stats?.recentSignups || 0} novos</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {users.filter(u => u.created_at >= new Date(Date.now() - 7 * 86400000).toISOString()).slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-all">
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
                      {statusBadge(u.approval_status)}
                    </div>
                  </div>
                ))}
                {(stats?.recentSignups || 0) === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum registo nos últimos 7 dias</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ USERS MANAGEMENT ═══ */}
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
                  <Input placeholder="Pesquisar por nome, email ou NIF..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-72" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    <Clock className="w-3.5 h-3.5" />Pendentes
                    {(stats?.pendingApprovals || 0) > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{stats?.pendingApprovals}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Aprovados</TabsTrigger>
                  <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
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
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/25 hover:bg-muted/30 transition-all">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">{u.nome.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{u.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {typeBadge(u)}
                              {u.nif && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />NIF: {u.nif}</span>}
                              {u.faktura_id && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" />{u.faktura_id}</span>}
                              <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pt-AO')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {statusBadge(u.approval_status)}
                          {(u.id_doc_front_url || u.id_doc_back_url || u.id_doc_nif_url) && (
                            <Button variant="outline" size="sm" onClick={() => viewDocuments(u)} className="gap-1">
                              <Eye className="w-3.5 h-3.5" />Docs
                            </Button>
                          )}
                          {u.approval_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => approveUser(u)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle className="w-3.5 h-3.5" />Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openRejectDialog(u)} disabled={processing} className="gap-1">
                                <XCircle className="w-3.5 h-3.5" />Rejeitar
                              </Button>
                            </>
                          )}
                          {u.approval_status === 'rejected' && (
                            <Button size="sm" variant="outline" onClick={() => reactivateUser(u)} disabled={processing} className="gap-1">
                              <RefreshCw className="w-3.5 h-3.5" />Reactivar
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

        {/* ═══ AUDIT LOGS ═══ */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-2"><History className="w-5 h-5 text-primary" />Registos de Auditoria</CardTitle>
                <Badge variant="secondary">{auditLogs.length} registos</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum registo de auditoria</p>
                  <p className="text-xs mt-1">As ações no sistema serão registadas aqui</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-all">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.action} — <span className="text-muted-foreground">{log.entity_type}</span></p>
                        <p className="text-[11px] text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-AO')}</p>
                      </div>
                      {log.entity_id && <span className="text-[10px] text-muted-foreground font-mono truncate max-w-24">{log.entity_id.slice(0, 8)}...</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ DOCUMENT PREVIEW DIALOG ═══ */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />Documentos — {selectedUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User info card */}
            <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-bold">Nome:</span> {selectedUser?.nome}</p>
                <p className="text-sm"><span className="font-bold">Email:</span> {selectedUser?.email}</p>
                <p className="text-sm"><span className="font-bold">NIF:</span> {selectedUser?.nif || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-bold">Tipo:</span> {selectedUser?.tipo === 'comprador' ? 'Comprador' : `Vendedor ${selectedUser?.seller_subtype === 'empresa' ? 'Empresa' : 'Pessoal'}`}</p>
                <p className="text-sm"><span className="font-bold">Telefone:</span> {selectedUser?.telefone || 'N/A'}</p>
                <p className="text-sm flex items-center gap-2"><span className="font-bold">Estado:</span> {statusBadge(selectedUser?.approval_status || 'pending')}</p>
              </div>
              {selectedUser?.rejection_reason && (
                <div className="col-span-2 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive"><span className="font-bold">Motivo rejeição:</span> {selectedUser.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            {selectedUser?.seller_subtype === 'empresa' && docUrls.nif ? (
              <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" />Documento NIF Empresa</p>
                <img src={docUrls.nif} alt="NIF Empresa" className="w-full rounded-xl border border-border object-contain max-h-80" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold">Frente do Documento</p>
                  {docUrls.front ? (
                    <img src={docUrls.front} alt="Frente do BI" className="w-full rounded-xl border border-border object-contain max-h-64" />
                  ) : (
                    <div className="w-full h-40 rounded-xl border border-dashed border-border flex items-center justify-center"><p className="text-xs text-muted-foreground">Não enviado</p></div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Verso do Documento</p>
                  {docUrls.back ? (
                    <img src={docUrls.back} alt="Verso do BI" className="w-full rounded-xl border border-border object-contain max-h-64" />
                  ) : (
                    <div className="w-full h-40 rounded-xl border border-dashed border-border flex items-center justify-center"><p className="text-xs text-muted-foreground">Não enviado</p></div>
                  )}
                </div>
              </div>
            )}

            {docUrls.nif && selectedUser?.seller_subtype !== 'empresa' && (
              <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" />Documento NIF</p>
                <img src={docUrls.nif} alt="Doc NIF" className="w-full rounded-xl border border-border object-contain max-h-64" />
              </div>
            )}
          </div>
          <DialogFooter>
            {selectedUser?.approval_status === 'pending' && (
              <div className="flex gap-2">
                <Button onClick={() => selectedUser && approveUser(selectedUser)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Aprovar
                </Button>
                <Button variant="destructive" onClick={() => selectedUser && openRejectDialog(selectedUser)} disabled={processing} className="gap-1">
                  <XCircle className="w-4 h-4" />Rejeitar
                </Button>
              </div>
            )}
            {selectedUser?.approval_status === 'rejected' && (
              <Button variant="outline" onClick={() => selectedUser && reactivateUser(selectedUser)} disabled={processing} className="gap-1">
                <RefreshCw className="w-4 h-4" />Reactivar para Revisão
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ REJECT DIALOG ═══ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />Rejeitar — {selectedUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Indique o motivo da rejeição. O utilizador será notificado.</p>
            <Textarea placeholder="Ex: Documento ilegível, NIF inválido, dados inconsistentes..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={rejectUser} disabled={processing || !rejectionReason.trim()} className="gap-1">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
