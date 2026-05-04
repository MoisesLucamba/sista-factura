import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, UserPlus, Trash2, Loader2, Crown, Mail, Shield, ShieldCheck, Eye, Calculator } from 'lucide-react';

interface Membro {
  id: string;
  empresa_user_id: string;
  membro_user_id: string | null;
  membro_email: string;
  membro_nome: string | null;
  role: 'gestor' | 'operador' | 'contador' | 'visualizador';
  status: 'pending' | 'active' | 'removed';
  invited_at: string;
  accepted_at: string | null;
}

const ROLE_META = {
  gestor:        { label: 'Gestor',        desc: 'Acesso total exceto eliminar empresa', icon: ShieldCheck, color: 'text-primary' },
  operador:      { label: 'Operador',      desc: 'Emite faturas e gere clientes',        icon: Shield,      color: 'text-blue-500' },
  contador:      { label: 'Contador',      desc: 'Vê relatórios e exporta SAF-T',        icon: Calculator,  color: 'text-emerald-500' },
  visualizador:  { label: 'Visualizador',  desc: 'Apenas leitura',                       icon: Eye,         color: 'text-muted-foreground' },
};

export default function EmpresaMembros() {
  const { user } = useAuth();
  const { activeAccount } = useActiveAccount();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  // form
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<Membro['role']>('operador');

  const empresaUserId = activeAccount?.empresa_user_id || user?.id;
  const isOwner = activeAccount?.is_owner ?? true;

  const load = async () => {
    if (!empresaUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('empresa_membros')
      .select('*')
      .eq('empresa_user_id', empresaUserId)
      .neq('status', 'removed')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar membros');
    } else {
      setMembros((data || []) as Membro[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [empresaUserId]);

  const invite = async () => {
    if (!email.trim()) { toast.error('Email obrigatório'); return; }
    if (!user || !empresaUserId) return;
    setInviting(true);
    const token = crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase.from('empresa_membros').insert({
      empresa_user_id: empresaUserId,
      membro_email: email.trim().toLowerCase(),
      membro_nome: nome.trim() || null,
      role,
      status: 'pending',
      invite_token: token,
      created_by: user.id,
    });
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      // Tentar vincular se já existir uma conta com esse email
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (existing?.user_id) {
        await supabase
          .from('empresa_membros')
          .update({ membro_user_id: existing.user_id, status: 'active', accepted_at: new Date().toISOString() })
          .eq('invite_token', token);
        toast.success('Membro adicionado e ativado (já tinha conta).');
      } else {
        toast.success('Convite criado. Quando o membro registar com este email, terá acesso.');
      }
      setEmail(''); setNome(''); setRole('operador');
      load();
    }
    setInviting(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este membro?')) return;
    const { error } = await supabase
      .from('empresa_membros')
      .update({ status: 'removed' })
      .eq('id', id);
    if (error) toast.error('Erro ao remover');
    else { toast.success('Membro removido'); load(); }
  };

  const updateRole = async (id: string, newRole: Membro['role']) => {
    const { error } = await supabase
      .from('empresa_membros')
      .update({ role: newRole })
      .eq('id', id);
    if (error) toast.error('Erro ao atualizar papel');
    else { toast.success('Papel atualizado'); load(); }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Membros da empresa</h1>
            <p className="text-sm text-muted-foreground">
              Convida colegas para emitir faturas em nome de <span className="font-bold">{activeAccount?.nome || 'esta empresa'}</span>.
            </p>
          </div>
        </div>

        {!isOwner && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4 pb-4 text-sm">
              Só o proprietário da empresa pode gerir membros. Estás a ver esta página em modo leitura.
            </CardContent>
          </Card>
        )}

        {/* Invite form */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" /> Convidar novo membro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colega@empresa.ao" className="h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome (opcional)</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João Silva" className="h-10 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Papel</Label>
                <Select value={role} onValueChange={v => setRole(v as Membro['role'])}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_META).map(([k, m]) => (
                      <SelectItem key={k} value={k}>
                        <div>
                          <p className="font-bold text-sm">{m.label}</p>
                          <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={invite} disabled={inviting || !email.trim()} className="w-full gap-2 font-bold">
                {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> A convidar…</> : <><Mail className="w-4 h-4" /> Enviar convite</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membros atuais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Owner row */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{activeAccount?.nome || 'Tu'} <Badge variant="outline" className="ml-2 text-[10px]">Proprietário</Badge></p>
                <p className="text-xs text-muted-foreground truncate">{activeAccount?.email || user?.email}</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : membros.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Ainda sem membros adicionais.</p>
            ) : membros.map(m => {
              const meta = ROLE_META[m.role];
              const Icon = meta.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {m.membro_nome || m.membro_email}
                      {m.status === 'pending' && <Badge variant="outline" className="ml-2 text-[10px] border-amber-500 text-amber-600">Pendente</Badge>}
                      {m.status === 'active' && <Badge variant="outline" className="ml-2 text-[10px] border-emerald-500 text-emerald-600">Ativo</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.membro_email}</p>
                  </div>
                  {isOwner && (
                    <>
                      <Select value={m.role} onValueChange={v => updateRole(m.id, v as Membro['role'])}>
                        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_META).map(([k, mm]) => (
                            <SelectItem key={k} value={k} className="text-xs">{mm.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
