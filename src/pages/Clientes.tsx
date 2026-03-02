import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, type Cliente, type ClienteInput } from '@/hooks/useClientes';
import { formatNIF } from '@/lib/format';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText,
  Building2,
  User,
  Loader2,
  MessageCircle,
  ArrowUpRight,
  Users,
  Filter,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState<ClienteInput>({
    nome: '',
    nif: '',
    endereco: '',
    telefone: '',
    email: '',
    tipo: 'empresa',
    whatsapp_consent: false,
    whatsapp_enabled: true,
  });

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nif.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'all' || cliente.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const empresasCount = clientes.filter(c => c.tipo === 'empresa').length;
  const particularesCount = clientes.filter(c => c.tipo === 'particular').length;
  const whatsappCount = clientes.filter(c => c.whatsapp_consent).length;

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
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      nif: '',
      endereco: '',
      telefone: '',
      email: '',
      tipo: 'empresa',
      whatsapp_consent: false,
      whatsapp_enabled: true,
    });
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      nif: cliente.nif,
      endereco: cliente.endereco,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      tipo: cliente.tipo,
      whatsapp_consent: cliente.whatsapp_consent,
      whatsapp_enabled: cliente.whatsapp_enabled,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    
    try {
      await deleteCliente.mutateAsync(clienteToDelete.id);
      toast.success('Cliente eliminado com sucesso!');
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    } catch (error) {
      toast.error('Erro ao eliminar cliente');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  const clearFilters = () => {
    setTipoFilter('all');
    setSearchTerm('');
  };

  if (isLoading) {
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Clientes
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Gestão de clientes e dados fiscais
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCliente(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              >
                <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                Novo Cliente
                <ArrowUpRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do cliente. O NIF é obrigatório para emissão de faturas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  {/* Tipo de Cliente */}
                  <div className="grid gap-2">
                    <Label htmlFor="tipo" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Tipo de Cliente
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: 'particular' | 'empresa') =>
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresa">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Empresa
                          </div>
                        </SelectItem>
                        <SelectItem value="particular">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Particular
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nome */}
                  <div className="grid gap-2">
                    <Label htmlFor="nome" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome / Razão Social *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome completo ou razão social"
                      className="h-11 border-primary/20"
                      required
                    />
                  </div>

                  {/* NIF */}
                  <div className="grid gap-2">
                    <Label htmlFor="nif" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      NIF (Número de Identificação Fiscal) *
                    </Label>
                    <Input
                      id="nif"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                      placeholder="123456789"
                      maxLength={9}
                      className="h-11 border-primary/20 font-mono"
                      required
                    />
                  </div>

                  {/* Endereço */}
                  <div className="grid gap-2">
                    <Label htmlFor="endereco" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço *
                    </Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, cidade"
                      className="h-11 border-primary/20"
                      required
                    />
                  </div>

                  {/* Telefone e Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="+244 9XX XXX XXX"
                        className="h-11 border-primary/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.ao"
                        className="h-11 border-primary/20"
                      />
                    </div>
                  </div>
                
                  {/* WhatsApp Settings */}
                  <div className="p-5 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <Label className="font-semibold text-base">Configurações WhatsApp</Label>
                    </div>
                    <div className="space-y-3 pl-10">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="whatsapp_consent"
                          checked={formData.whatsapp_consent}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, whatsapp_consent: checked === true })
                          }
                          className="mt-1"
                        />
                        <div className="grid gap-1">
                          <Label htmlFor="whatsapp_consent" className="text-sm font-medium cursor-pointer">
                            Cliente autoriza receber faturas via WhatsApp
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Permissão para envio de documentos fiscais
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="whatsapp_enabled"
                          checked={formData.whatsapp_enabled}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, whatsapp_enabled: checked === true })
                          }
                          className="mt-1"
                        />
                        <div className="grid gap-1">
                          <Label htmlFor="whatsapp_enabled" className="text-sm font-medium cursor-pointer">
                            Envio automático de faturas ativo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Faturas serão enviadas automaticamente após emissão
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="gradient-primary border-0"
                    disabled={createCliente.isPending || updateCliente.isPending}
                  >
                    {(createCliente.isPending || updateCliente.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingCliente ? 'Guardar Alterações' : 'Criar Cliente'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-blue-500 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Empresas</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {empresasCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-purple-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Particulares</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {particularesCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-green-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">WhatsApp Ativo</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {whatsappCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Search and Filters */}
      <Card className="card-shadow mb-6 border-primary/10 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, NIF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 border-primary/20 focus:border-primary/40"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 border-primary/20">
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="empresa">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresas
                  </div>
                </SelectItem>
                <SelectItem value="particular">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Particulares
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || tipoFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Clients Table */}
      <Card className="card-shadow animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Lista de Clientes ({filteredClientes.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">NIF</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Data Registo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {searchTerm || tipoFilter !== 'all'
                              ? 'Nenhum cliente encontrado.' 
                              : 'Ainda não tem clientes.'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm || tipoFilter !== 'all'
                              ? 'Tente ajustar os filtros de pesquisa.'
                              : 'Comece criando o seu primeiro cliente!'}
                          </p>
                        </div>
                        {!searchTerm && tipoFilter === 'all' && (
                          <Button onClick={() => setIsDialogOpen(true)} className="mt-2">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Cliente
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente, index) => (
                    <TableRow 
                      key={cliente.id} 
                      className="cursor-pointer hover:bg-muted/50 group transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform',
                            cliente.tipo === 'empresa' 
                              ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900' 
                              : 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900'
                          )}>
                            {cliente.tipo === 'empresa' ? (
                              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{cliente.nome}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[250px] flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {cliente.endereco}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {formatNIF(cliente.nif)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1 text-sm">
                          {cliente.telefone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              {cliente.telefone}
                            </p>
                          )}
                          {cliente.email && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" />
                              {cliente.email}
                            </p>
                          )}
                          {cliente.whatsapp_consent && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(cliente.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Faturas
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(cliente)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirmar Eliminação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar o cliente <strong>{clienteToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita e todas as faturas associadas poderão ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCliente.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}