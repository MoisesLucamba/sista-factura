import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useClientes, useCreateCliente, useUpdateCliente,
  useDeleteCliente, type Cliente, type ClienteInput,
} from '@/hooks/useClientes';
import { formatNIF } from '@/lib/format';
import { exportToCSV } from '@/lib/csv-export';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Search, MoreVertical, Edit, Trash2, FileText,
  Building2, User, Loader2, MessageCircle, ArrowUpRight,
  Users, X, Mail, Phone, MapPin, Calendar, AlertCircle,
  ChevronRight, Sparkles, Activity,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── FadeIn wrapper ─────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity .55s cubic-bezier(.4,0,.2,1), transform .55s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [searchTerm, setSearchTerm]     = useState('');
  const [tipoFilter, setTipoFilter]     = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente]   = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete]   = useState<Cliente | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClienteInput>({
    nome: '', nif: '', endereco: '', telefone: '', email: '',
    tipo: 'empresa', whatsapp_consent: false, whatsapp_enabled: true,
  });

  const filteredClientes = clientes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.nome.toLowerCase().includes(q) || c.nif.includes(q) || c.email?.toLowerCase().includes(q)) &&
      (tipoFilter === 'all' || c.tipo === tipoFilter)
    );
  });

  const empresasCount    = clientes.filter(c => c.tipo === 'empresa').length;
  const particularesCount = clientes.filter(c => c.tipo === 'particular').length;
  const whatsappCount    = clientes.filter(c => c.whatsapp_consent).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await updateCliente.mutateAsync({ id: editingCliente.id, ...formData });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createCliente.mutateAsync(formData);
        toast.success('Cliente criado com sucesso!');
      }
      setIsDialogOpen(false);
      setEditingCliente(null);
      resetForm();
    } catch { toast.error('Erro ao salvar cliente'); }
  };

  const resetForm = () => setFormData({ nome: '', nif: '', endereco: '', telefone: '', email: '', tipo: 'empresa', whatsapp_consent: false, whatsapp_enabled: true });

  const handleEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormData({ nome: c.nome, nif: c.nif, endereco: c.endereco, telefone: c.telefone || '', email: c.email || '', tipo: c.tipo, whatsapp_consent: c.whatsapp_consent, whatsapp_enabled: c.whatsapp_enabled });
    setIsDialogOpen(true);
  };

  const handleDeleteClick   = (c: Cliente) => { setClienteToDelete(c); setDeleteDialogOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    try {
      await deleteCliente.mutateAsync(clienteToDelete.id);
      toast.success('Cliente eliminado com sucesso!');
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    } catch { toast.error('Erro ao eliminar cliente'); }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-AO');
  const clearFilters = () => { setTipoFilter('all'); setSearchTerm(''); };
  const hasFilters = searchTerm || tipoFilter !== 'all';

  /* ── Loading ── */
  if (isLoading) return (
    <MainLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .loader{animation:spin 1.1s linear infinite;transform-origin:center}`}</style>
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary loader" />
          <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">A carregar clientes</p>
          <p className="text-xs text-muted-foreground mt-1">Por favor aguarde…</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
        @keyframes row-in  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .shimmer-text {
          background: linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 45%,hsl(var(--primary)) 90%);
          background-size:200% auto; -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite;
        }
        .stat-pill { transition: all .3s cubic-bezier(.4,0,.2,1); }
        .stat-pill:hover { transform: translateY(-4px); box-shadow: 0 10px 28px hsl(var(--primary)/.12); }

        .client-row { transition: background .2s ease; animation: row-in .35s ease both; }
        .client-row:hover .row-avatar { transform: scale(1.1); }
        .row-avatar { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }

        .search-bar:focus-within { box-shadow: 0 0 0 3px hsl(var(--primary)/.15); border-color: hsl(var(--primary)/.5); }
        .search-bar { transition: box-shadow .2s ease, border-color .2s ease; }

        .btn-primary { transition: all .25s ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px hsl(var(--primary)/.3); }

        .filter-pill-active { animation: slide-down .2s ease both; }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .live-dot  { animation: pulse-dot 1.8s ease-in-out infinite; }

        .form-input { transition: border-color .2s ease, box-shadow .2s ease; }
        .form-input:focus { box-shadow: 0 0 0 3px hsl(var(--primary)/.12); }

        .empty-state { animation: row-in .5s ease both .1s; }
      `}</style>

      {/* ── Hero Header ── */}
      <FadeUp delay={0}>
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-7">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-primary/8 rounded-full blur-3xl anim-float" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-48 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <Users className="w-7 h-7 text-white" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background live-dot" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  <span className="shimmer-text">Clientes</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-sm text-muted-foreground">Gestão de clientes e dados fiscais</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/12 text-primary font-bold border border-primary/20">
                    {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToCSV(
                    clientes.map(c => ({ nome: c.nome, nif: c.nif, tipo: c.tipo, email: c.email || '', telefone: c.telefone || '', endereco: c.endereco })),
                    [{ key: 'nome', label: 'Nome' }, { key: 'nif', label: 'NIF' }, { key: 'tipo', label: 'Tipo' }, { key: 'email', label: 'Email' }, { key: 'telefone', label: 'Telefone' }, { key: 'endereco', label: 'Endereço' }],
                    'clientes'
                  );
                  toast.success('CSV exportado!');
                }}
                className="border-border/60"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingCliente(null); resetForm(); } }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="btn-primary font-bold shadow-xl shadow-primary/20 group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Novo Cliente
                    <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Button>
                </DialogTrigger>

              {/* ── Dialog ── */}
              <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Preencha os dados do cliente. O NIF é obrigatório para emissão de faturas.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-5 py-5">
                    {/* Tipo */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Tipo de Cliente
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['empresa','particular'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo: t })}
                            className={cn(
                              'flex items-center gap-2.5 rounded-xl border-2 p-3.5 text-sm font-semibold transition-all duration-200',
                              formData.tipo === t
                                ? 'border-primary bg-primary/8 text-primary'
                                : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                            )}
                          >
                            {t === 'empresa' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            {t === 'empresa' ? 'Empresa' : 'Particular'}
                            {formData.tipo === t && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nome */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Nome / Razão Social *
                      </Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome completo ou razão social"
                        className="form-input h-11 border-border/60 focus:border-primary/40"
                        required
                      />
                    </div>

                    {/* NIF + Endereço */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> NIF *
                        </Label>
                         <Input
                          value={formData.nif}
                          onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g,'').slice(0,14) })}
                          placeholder="123456789"
                          maxLength={14}
                          className="form-input h-11 border-border/60 font-mono tracking-widest"
                          required
                        />
                        {formData.nif && formData.nif.length < 9 && (
                          <p className="text-xs text-destructive mt-1">NIF deve ter pelo menos 9 dígitos</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" /> Endereço *
                        </Label>
                        <Input
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Rua, número, cidade"
                          className="form-input h-11 border-border/60"
                          required
                        />
                      </div>
                    </div>

                    {/* Telefone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" /> Telefone
                        </Label>
                        <Input
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="+244 9XX XXX XXX"
                          className="form-input h-11 border-border/60"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" /> Email
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemplo.ao"
                          className="form-input h-11 border-border/60"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/30 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <Label className="font-bold text-sm">Configurações WhatsApp</Label>
                      </div>
                      <div className="space-y-3 pl-12">
                        {[
                          { key: 'whatsapp_consent', label: 'Cliente autoriza receber faturas via WhatsApp', desc: 'Permissão para envio de documentos fiscais' },
                          { key: 'whatsapp_enabled', label: 'Envio automático de faturas ativo', desc: 'Faturas enviadas automaticamente após emissão' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-start gap-3 group">
                            <Checkbox
                              id={key}
                              checked={formData[key as keyof ClienteInput] as boolean}
                              onCheckedChange={(v) => setFormData({ ...formData, [key]: v === true })}
                              className="mt-0.5"
                            />
                            <div>
                              <Label htmlFor={key} className="text-sm font-medium cursor-pointer leading-snug">{label}</Label>
                              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-muted/60">
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="btn-primary font-bold min-w-[140px]"
                      disabled={createCliente.isPending || updateCliente.isPending}
                    >
                      {(createCliente.isPending || updateCliente.isPending)
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A guardar…</>
                        : <><Sparkles className="w-4 h-4 mr-2" />{editingCliente ? 'Guardar Alterações' : 'Criar Cliente'}</>}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Stat Pills ── */}
      <FadeUp delay={80}>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Empresas', value: empresasCount, icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
            { label: 'Particulares', value: particularesCount, icon: User, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
            { label: 'WhatsApp Ativo', value: whatsappCount, icon: MessageCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
          ].map(({ label, value, icon: Icon, color, bg, border, dot }, i) => (
            <div
              key={i}
              className={cn('stat-pill bg-card rounded-2xl border p-5 flex items-center justify-between cursor-default', border)}
            >
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-black">{value}</p>
              </div>
              <div className={cn('relative w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
                <span className={cn('absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background', dot)} />
              </div>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* ── Search + Filters ── */}
      <FadeUp delay={150}>
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="search-bar relative flex-1 rounded-xl border border-border/60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, NIF ou email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-11 border-border/60 bg-muted/30">
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="empresa">
                  <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" />Empresas</div>
                </SelectItem>
                <SelectItem value="particular">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-purple-500" />Particulares</div>
                </SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="filter-pill-active h-11 px-4 text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0">
                <X className="w-4 h-4 mr-1.5" /> Limpar
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Filtros:</span>
              {searchTerm && (
                <span className="filter-pill-active inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold">
                  "{searchTerm}" <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {tipoFilter !== 'all' && (
                <span className="filter-pill-active inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold">
                  {tipoFilter === 'empresa' ? 'Empresas' : 'Particulares'} <button onClick={() => setTipoFilter('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      </FadeUp>

      {/* ── Table ── */}
      <FadeUp delay={220}>
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Lista de Clientes
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-1">
                  {filteredClientes.length}
                </span>
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredClientes.length === 0 ? (
              <div className="empty-state flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
                <div className="relative w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-9 h-9 text-muted-foreground/40" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center">
                    {hasFilters ? <Search className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-primary" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {hasFilters ? 'Nenhum resultado encontrado' : 'Sem clientes ainda'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {hasFilters ? 'Tente ajustar os filtros ou a pesquisa.' : 'Adicione o seu primeiro cliente para começar a emitir faturas.'}
                  </p>
                </div>
                {hasFilters
                  ? <Button variant="outline" onClick={clearFilters} className="mt-1"><X className="w-4 h-4 mr-2" />Limpar filtros</Button>
                  : <Button onClick={() => setIsDialogOpen(true)} className="btn-primary mt-1"><Plus className="w-4 h-4 mr-2" />Criar Cliente</Button>
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">Cliente</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">NIF</TableHead>
                      <TableHead className="hidden md:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Contacto</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Registo</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente, i) => (
                      <TableRow
                        key={cliente.id}
                        className="client-row border-border/30 hover:bg-muted/40 group"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onMouseEnter={() => setHoveredRow(cliente.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* Cliente */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              'row-avatar w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all',
                              cliente.tipo === 'empresa'
                                ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900'
                                : 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900'
                            )}>
                              {cliente.tipo === 'empresa'
                                ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                : <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate max-w-[200px]">{cliente.nome}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                                <MapPin className="w-3 h-3 flex-shrink-0" /> {cliente.endereco}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* NIF */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs tracking-widest border-border/60 bg-muted/40">
                            {formatNIF(cliente.nif)}
                          </Badge>
                        </TableCell>

                        {/* Contacto */}
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {cliente.telefone && (
                              <p className="flex items-center gap-1.5 text-xs text-foreground">
                                <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" /> {cliente.telefone}
                              </p>
                            )}
                            {cliente.email && (
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[180px]">
                                <Mail className="w-3 h-3 flex-shrink-0" /> {cliente.email}
                              </p>
                            )}
                            {cliente.whatsapp_consent && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5 font-semibold">
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Data */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(cliente.created_at)}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8 rounded-lg transition-all duration-200',
                                  hoveredRow === cliente.id ? 'opacity-100 bg-muted' : 'opacity-0'
                                )}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/60">
                              <DropdownMenuItem onClick={() => handleEdit(cliente)} className="rounded-lg gap-2 cursor-pointer">
                                <Edit className="w-4 h-4 text-primary" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                <FileText className="w-4 h-4 text-muted-foreground" /> Ver Faturas
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => handleDeleteClick(cliente)}
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUp>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              Eliminar cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Tem a certeza que deseja eliminar <strong className="text-foreground">{clienteToDelete?.nome}</strong>?
              Esta ação é permanente e não pode ser desfeita. As faturas associadas poderão ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-destructive hover:bg-destructive/90 min-w-[120px]"
            >
              {deleteCliente.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A eliminar…</>
                : <><Trash2 className="w-4 h-4 mr-2" />Eliminar</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}