import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle, Clock, Copy, ExternalLink, Link2,
  MessageCircle, QrCode, Share2, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { useEffect } from 'react';

interface PaymentLinkDetailsProps {
  linkCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentLinkDetails({ linkCode, open, onOpenChange }: PaymentLinkDetailsProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const { data: link, isLoading } = useQuery({
    queryKey: ['payment-link', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('code', linkCode)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!linkCode && open,
  });

  const paymentUrl = linkCode ? `${window.location.origin}/pagar/${linkCode}` : '';

  useEffect(() => {
    if (paymentUrl) {
      QRCode.toDataURL(paymentUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [paymentUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast.success('Link copiado!');
  };

  const shareWhatsApp = () => {
    const message = `Olá! Segue o link para pagamento de ${link ? formatCurrency(Number(link.amount)) : ''}:\n\n${paymentUrl}\n\n${link?.description || 'Pagamento via Faktura'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Link de Pagamento - Faktura',
          text: `Pagamento de ${link ? formatCurrency(Number(link.amount)) : ''}`,
          url: paymentUrl,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const statusConfig = {
    active: { label: 'Activo', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
    paid: { label: 'Pago', className: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle },
    expired: { label: 'Expirado', className: 'bg-muted text-muted-foreground', icon: Clock },
    cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive', icon: XCircle },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="gradient-fintech px-6 pt-6 pb-8 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5" /> Link de Pagamento
            </DialogTitle>
          </DialogHeader>
          {link && (
            <div className="mt-4 text-center">
              <p className="text-sm text-primary-foreground/60 mb-1">Valor</p>
              <p className="text-3xl font-black font-mono">
                {formatCurrency(Number(link.amount))}
              </p>
              {link.description && (
                <p className="text-sm text-primary-foreground/70 mt-2">{link.description}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 -mt-4 space-y-4">
          {/* QR Code Card */}
          <Card className="border-2 border-dashed">
            <CardContent className="p-4 flex flex-col items-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
              ) : (
                <div className="w-48 h-48 bg-muted animate-pulse rounded-xl" />
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Digitalize para pagar
              </p>
            </CardContent>
          </Card>

          {/* Link display */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border">
            <code className="text-xs font-mono flex-1 truncate text-muted-foreground">
              {paymentUrl}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Status & expiry */}
          {link && (
            <div className="flex items-center justify-between text-sm">
              <Badge variant="secondary" className={statusConfig[link.status as keyof typeof statusConfig]?.className}>
                {statusConfig[link.status as keyof typeof statusConfig]?.label || link.status}
              </Badge>
              {link.expires_at && (
                <span className="text-xs text-muted-foreground">
                  Expira: {formatDate(link.expires_at)}
                </span>
              )}
            </div>
          )}

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="flex-col h-auto py-3 gap-1.5 hover:border-success/40 hover:bg-success/5"
              onClick={shareWhatsApp}
            >
              <MessageCircle className="w-5 h-5 text-success" />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 gap-1.5 hover:border-primary/40 hover:bg-primary/5"
              onClick={copyLink}
            >
              <Copy className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-medium">Copiar Link</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 gap-1.5 hover:border-primary/40 hover:bg-primary/5"
              onClick={shareNative}
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-medium">Partilhar</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
