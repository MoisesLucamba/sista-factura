import { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  Building2, 
  LogOut, 
  Shield, 
  Settings,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Package,
  UserPlus,
  Clock,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function Header() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Fatura Vencida',
      message: 'FT/2024/000003 - Comercial Benguela',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: '2',
      type: 'error',
      title: 'Stock Crítico',
      message: 'Monitor LED 24" - Apenas 3 unidades restantes',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'Novo Cliente Registado',
      message: 'Tech Solutions Angola adicionado ao sistema',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
    },
    {
      id: '4',
      type: 'info',
      title: 'Atualização do Sistema',
      message: 'Nova versão disponível com melhorias de performance',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      read: true,
    },
  ]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          variant: 'default' as const,
          className: 'bg-primary text-primary-foreground',
        };
      case 'contador':
        return {
          label: 'Contador',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'vendedor':
        return {
          label: 'Vendedor',
          variant: 'outline' as const,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          label: 'Utilizador',
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'error':
        return 'bg-red-50 border-red-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours}h`;
    if (days === 1) return 'Ontem';
    return `Há ${days} dias`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const roleConfig = getRoleConfig(role || '');

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/90 border-b border-primary/80 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              searchFocused ? "text-primary-foreground" : "text-primary-foreground/60"
            )} />
            <Input
              id="global-search"
              type="search"
              placeholder="Pesquisar faturas, clientes, produtos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "pl-10 pr-20 h-10 bg-primary-foreground/10 border-2 transition-all text-primary-foreground placeholder:text-primary-foreground/50",
                searchFocused 
                  ? "border-primary-foreground/30 bg-primary-foreground/20 shadow-md" 
                  : "border-transparent hover:bg-primary-foreground/15"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                  onClick={() => setSearchValue('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary-foreground/10 text-primary-foreground/70 rounded border border-primary-foreground/20">
                <Command className="w-3 h-3" />
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-4">
          {/* Company indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-primary-foreground/10 rounded-lg border border-primary-foreground/20">
            <div className="p-1.5 rounded-md bg-primary-foreground/15">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary-foreground leading-tight">
                Minha Empresa, Lda
              </span>
              <span className="text-xs text-primary-foreground/60 leading-tight">
                NIF: 5000000000
              </span>
            </div>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0">
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div>
                  <h3 className="font-semibold text-base">Notificações</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount > 0 
                      ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
                      : 'Todas as notificações lidas'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-8"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 rounded-full bg-muted mb-3">
                      <Bell className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhuma notificação
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você está em dia!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                          !notification.read && "bg-blue-50/30"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg border",
                            getNotificationBgColor(notification.type)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-sm leading-tight">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="absolute top-3 right-3 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t bg-muted/20">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center text-sm font-medium hover:bg-primary hover:text-primary-foreground"
                    onClick={() => navigate('/notificacoes')}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 h-10 px-2 hover:bg-primary-foreground/20 transition-colors"
              >
                <Avatar className="w-8 h-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold">
                    {profile ? getInitials(profile.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-primary-foreground/60 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-2 py-3 mb-2">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                      {profile ? getInitials(profile.nome) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {profile?.nome || 'Utilizador'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email}
                    </p>
                  </div>
                </div>
                {role && (
                  <Badge 
                    variant={roleConfig.variant}
                    className={cn('w-full justify-center font-medium', roleConfig.className)}
                  >
                    <Shield className="w-3 h-3 mr-1.5" />
                    {roleConfig.label}
                  </Badge>
                )}
              </div>
              
              <Separator className="my-2" />
              
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-md"
                onClick={() => navigate('/perfil')}
              >
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-medium">Meu Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-md"
                onClick={() => navigate('/configuracoes')}
              >
                <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-medium">Configurações</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-md"
                onClick={() => navigate('/empresa')}
              >
                <Building2 className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-medium">Dados da Empresa</span>
              </DropdownMenuItem>
              
              <Separator className="my-2" />
              
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="font-medium">Terminar Sessão</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}