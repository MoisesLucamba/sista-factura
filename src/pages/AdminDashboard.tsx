import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users, FileText, ShieldCheck, ShieldX, Eye, CheckCircle, XCircle,
  Loader2, UserCheck, UserX, Clock, TrendingUp, Banknote, BarChart3,
  AlertTriangle, Search, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

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
  created_at: string;
  rejection_reason: string | null;
}

interface SystemStats {
  totalUsers: number;
  pendingApprovals: number;
  totalFaturas: number;
  totalRevenue: number;
  totalBuyers: number;
  totalSellers: number;
  approvedBuyers: number;
  rejectedBuyers: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [docUrls, setDocUrls] = useState<{ front: string | null; back: string | null }>({ front: null, back: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles (admin can see all)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setUsers(profiles as unknown as PendingUser[]);
      }

      // Stats
      const { count: totalFaturas } = await supabase.from('faturas').select('*', { count: 'exact', head: true });
      const { data: revenueData } = await supabase.from('faturas').select('total').eq('estado', 'emitida');
      const totalRevenue = revenueData?.reduce((sum, f) => sum + Number(f.total), 0) || 0;

      const buyers = profiles?.filter(p => p.tipo === 'comprador') || [];
      const sellers = profiles?.filter(p => p.tipo !== 'comprador') || [];

      setStats({
        totalUsers: profiles?.length || 0,
        pendingApprovals: buyers.filter(b => (b as any).approval_status === 'pending').length,
        totalFaturas: totalFaturas || 0,
        totalRevenue,
        totalBuyers: buyers.length,
        totalSellers: sellers.length,
        approvedBuyers: buyers.filter(b => (b as any).approval_status === 'approved').length,
        rejectedBuyers: buyers.filter(b => (b as any).approval_status === 'rejected').length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  };

  const viewDocuments = async (u: PendingUser) => {
    setSelectedUser(u);
    setDocUrls({ front: null, back: null });

    if (u.id_doc_front_url) {
      const { data: frontData } = await supabase.storage.from('id-documents').createSignedUrl(u.id_doc_front_url, 300);
      if (frontData) setDocUrls(prev => ({ ...prev, front: frontData.signedUrl }));
    }
    if (u.id_doc_back_url) {
      const { data: backData } = await supabase.storage.from('id-documents').createSignedUrl(u.id_doc_back_url, 300);
      if (backData) setDocUrls(prev => ({ ...prev, back: backData.signedUrl }));
    }

    setShowDocDialog(true);
  };

  const approveUser = async (u: PendingUser) => {
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      } as any)
      .eq('user_id', u.user_id);

    if (error) {
      toast.error('Erro ao aprovar utilizador');
    } else {
      toast.success(`${u.nome} foi aprovado com sucesso!`);
      loadData();
      setShowDocDialog(false);
    }
    setProcessing(false);
  };

  const openRejectDialog = (u: PendingUser) => {
    setSelectedUser(u);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const rejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error('Indique o motivo da rejeição');
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      } as any)
      .eq('user_id', selectedUser.user_id);

    if (error) {
      toast.error('Erro ao rejeitar utilizador');
    } else {
      toast.success(`${selectedUser.nome} foi rejeitado.`);
      loadData();
      setShowRejectDialog(false);
      setShowDocDialog(false);
    }
    setProcessing(false);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchQuery || 
      u.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nif && u.nif.includes(searchQuery));
    
    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'pending') return matchSearch && u.approval_status === 'pending' && u.tipo === 'comprador';
    if (filterStatus === 'approved') return matchSearch && u.approval_status === 'approved';
    if (filterStatus === 'rejected') return matchSearch && u.approval_status === 'rejected';
    if (filterStatus === 'buyers') return matchSearch && u.tipo === 'comprador';
    if (filterStatus === 'sellers') return matchSearch && u.tipo !== 'comprador';
    return matchSearch;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
      default: return <Badge variant="outline" className="border-amber-500/40 text-amber-600 gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
    }
  };

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
        @keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .afu { animation: fade-up .5s ease both; }
        .shimmer-text { background:linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="afu mb-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-7">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight"><span className="shimmer-text">Admin Dashboard</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão de utilizadores, aprovações e sistema</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="afu grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" style={{ animationDelay: '100ms' }}>
        {[
          { label: 'Total Utilizadores', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary' },
          { label: 'Pendentes', value: stats?.pendingApprovals || 0, icon: Clock, color: 'text-amber-500' },
          { label: 'Faturas Emitidas', value: stats?.totalFaturas || 0, icon: FileText, color: 'text-emerald-500' },
          { label: 'Receita Total', value: formatCurrency(stats?.totalRevenue || 0), icon: Banknote, color: 'text-primary' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <Card key={i} className="border-border/50 hover:border-primary/25 transition-all hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-black">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buyer stats */}
      <div className="afu grid grid-cols-3 gap-3 mb-6" style={{ animationDelay: '150ms' }}>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <div><p className="text-xs text-muted-foreground">Compradores Aprovados</p><p className="font-bold">{stats?.approvedBuyers || 0}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <UserX className="w-5 h-5 text-destructive" />
            <div><p className="text-xs text-muted-foreground">Rejeitados</p><p className="font-bold">{stats?.rejectedBuyers || 0}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Vendedores</p><p className="font-bold">{stats?.totalSellers || 0}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card className="afu border-border/50" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gestão de Utilizadores
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email ou NIF..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{u.tipo === 'comprador' ? 'Comprador' : 'Vendedor'}</Badge>
                          {u.nif && <span className="text-[10px] text-muted-foreground">NIF: {u.nif}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {statusBadge(u.approval_status)}
                      {u.tipo === 'comprador' && (
                        <div className="flex items-center gap-2">
                          {(u.id_doc_front_url || u.id_doc_back_url) && (
                            <Button variant="outline" size="sm" onClick={() => viewDocuments(u)} className="gap-1">
                              <Eye className="w-3.5 h-3.5" />Ver Docs
                            </Button>
                          )}
                          {u.approval_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => approveUser(u)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5" />Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openRejectDialog(u)} disabled={processing} className="gap-1">
                                <XCircle className="w-3.5 h-3.5" />Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Documentos de Identificação — {selectedUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-bold">Frente do Documento</p>
                {docUrls.front ? (
                  <img src={docUrls.front} alt="Frente do BI" className="w-full rounded-xl border border-border object-contain max-h-64" />
                ) : (
                  <div className="w-full h-40 rounded-xl border border-dashed border-border flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Não enviado</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold">Verso do Documento</p>
                {docUrls.back ? (
                  <img src={docUrls.back} alt="Verso do BI" className="w-full rounded-xl border border-border object-contain max-h-64" />
                ) : (
                  <div className="w-full h-40 rounded-xl border border-dashed border-border flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Não enviado</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm"><span className="font-bold">Nome:</span> {selectedUser?.nome}</p>
              <p className="text-sm"><span className="font-bold">Email:</span> {selectedUser?.email}</p>
              <p className="text-sm"><span className="font-bold">NIF:</span> {selectedUser?.nif || 'N/A'}</p>
              <p className="text-sm"><span className="font-bold">Telefone:</span> {selectedUser?.telefone || 'N/A'}</p>
              <p className="text-sm"><span className="font-bold">Estado:</span> {selectedUser?.approval_status}</p>
              {selectedUser?.rejection_reason && (
                <p className="text-sm text-destructive"><span className="font-bold">Motivo rejeição:</span> {selectedUser.rejection_reason}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            {selectedUser?.approval_status === 'pending' && (
              <div className="flex gap-2">
                <Button onClick={() => selectedUser && approveUser(selectedUser)} disabled={processing} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Aprovar Comprador
                </Button>
                <Button variant="destructive" onClick={() => selectedUser && openRejectDialog(selectedUser)} disabled={processing} className="gap-1">
                  <XCircle className="w-4 h-4" />Rejeitar
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Rejeitar Comprador — {selectedUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Indique o motivo da rejeição. O utilizador não poderá aceder ao sistema de cashback.
            </p>
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
    </MainLayout>
  );
}
