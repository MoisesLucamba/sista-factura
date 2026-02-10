import { useInvoiceSends, type InvoiceSend } from '@/hooks/useInvoiceSends';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SendHistoryListProps {
  faturaId?: string;
  limit?: number;
}

const channelIcons = {
  whatsapp: MessageCircle,
  sms: Phone,
  email: Mail,
};

const statusConfig: Record<InvoiceSend['status'], { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviado', icon: CheckCircle, className: 'bg-primary/10 text-primary' },
  delivered: { label: 'Entregue', icon: CheckCircle, className: 'bg-accent text-accent-foreground' },
  failed: { label: 'Falhou', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  read: { label: 'Lido', icon: Eye, className: 'bg-accent text-accent-foreground' },
};

export function SendHistoryList({ faturaId, limit }: SendHistoryListProps) {
  const { data: sends = [], isLoading } = useInvoiceSends(faturaId);

  const displayedSends = limit ? sends.slice(0, limit) : sends;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (displayedSends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhum envio registado
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {displayedSends.map((send) => {
        const ChannelIcon = channelIcons[send.channel];
        const status = statusConfig[send.status];
        const StatusIcon = status.icon;

        return (
          <div
            key={send.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ChannelIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{send.recipient}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(send.created_at).toLocaleString('pt-AO')}
                  {send.retry_count > 0 && ` · ${send.retry_count} tentativa(s)`}
                  {send.fallback_used && ' · Fallback email'}
                  {send.pdf_url && ' · PDF anexo'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={cn('text-xs', status.className)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
