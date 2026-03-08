import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Info; label: string; color: string; bg: string }> = {
  success: { icon: CheckCircle, label: 'Sucesso', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  warning: { icon: AlertCircle, label: 'Aviso', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  error: { icon: AlertCircle, label: 'Erro', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  info: { icon: Info, label: 'Info', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

function Notificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const deleteAllRead = async () => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    if (readIds.length === 0) return;
    setNotifications(prev => prev.filter(n => !n.read));
    await supabase.from('notifications').delete().in('id', readIds);
  };

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'Agora mesmo';
    if (diffH < 24) return `Há ${diffH}h`;
    if (diffD === 1) return 'Ontem';
    if (diffD < 7) return `Há ${diffD} dias`;
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{notifications.length} notificações no total</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Marcar todas como lidas
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button variant="outline" size="sm" onClick={deleteAllRead} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Limpar lidas
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Não lidas
              {unreadCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="success" className="text-xs">✅ Sucesso</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">ℹ️ Info</TabsTrigger>
            <TabsTrigger value="warning" className="text-xs">⚠️ Avisos</TabsTrigger>
            <TabsTrigger value="error" className="text-xs">❌ Erros</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação nesta categoria'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Você está em dia!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const config = typeConfig[n.type] || typeConfig.info;
              const Icon = config.icon;
              return (
                <Card
                  key={n.id}
                  className={cn(
                    'group transition-all hover:shadow-md cursor-pointer border',
                    !n.read && 'border-primary/30 bg-primary/5'
                  )}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg border shrink-0', config.bg)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground">{n.title}</p>
                            {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">{config.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Notificacoes;
