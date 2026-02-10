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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

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

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nif.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCliente) {
      await updateCliente.mutateAsync({ id: editingCliente.id, ...formData });
    } else {
      await createCliente.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingCliente(null);
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

  const handleDelete = async (id: string) => {
    await deleteCliente.mutateAsync(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  if (isLoading) {
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
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de clientes e dados fiscais
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente. O NIF é obrigatório para emissão de faturas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de Cliente</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'particular' | 'empresa') =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
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
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome / Razão Social *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo ou razão social"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nif">NIF (Número de Identificação Fiscal) *</Label>
                  <Input
                    id="nif"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    placeholder="123456789"
                    maxLength={9}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, cidade"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="+244 9XX XXX XXX"
                    />
                </div>
                
                {/* WhatsApp Consent */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <Label className="font-medium">WhatsApp</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp_consent"
                      checked={formData.whatsapp_consent}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, whatsapp_consent: checked === true })
                      }
                    />
                    <Label htmlFor="whatsapp_consent" className="text-sm font-normal">
                      Cliente autoriza receber faturas via WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp_enabled"
                      checked={formData.whatsapp_enabled}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, whatsapp_enabled: checked === true })
                      }
                    />
                    <Label htmlFor="whatsapp_enabled" className="text-sm font-normal">
                      Envio automático de faturas activo
                    </Label>
                  </div>
                </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.ao"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                  {editingCliente ? 'Guardar' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="card-shadow mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, NIF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="empresa">Empresas</SelectItem>
                <SelectItem value="particular">Particulares</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">
            Lista de Clientes ({filteredClientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell">Data Registo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum cliente encontrado.' : 'Ainda não tem clientes. Crie o primeiro!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            cliente.tipo === 'empresa' ? 'bg-primary/10' : 'bg-secondary'
                          )}>
                            {cliente.tipo === 'empresa' ? (
                              <Building2 className="w-5 h-5 text-primary" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {cliente.endereco}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {formatNIF(cliente.nif)}
                        </Badge>
                      </TableCell>
                        <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {cliente.telefone && <p>{cliente.telefone}</p>}
                          {cliente.email && (
                            <p className="text-muted-foreground">{cliente.email}</p>
                          )}
                          {cliente.whatsapp_consent && (
                            <Badge variant="secondary" className="mt-1 text-xs bg-accent/10 text-accent-foreground">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(cliente.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Faturas
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(cliente.id)}
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
    </MainLayout>
  );
}
