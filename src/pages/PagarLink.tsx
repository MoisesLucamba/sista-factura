import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, Clock, CreditCard, Shield,
  XCircle, Loader2, ArrowLeft,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoFaktura from '@/assets/logo-faktura.png';

export default function PagarLink() {
  const { code } = useParams<{ code: string }>();
  const [qrDataUrl, setQrDataUrl] = useState('');

  const { data: link, isLoading, error } = useQuery({
    queryKey: ['public-payment-link', code],
    queryFn: async () => {
      if (!code) throw new Error('Código inválido');
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('code', code)
        .eq('status', 'active')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (code) {
      const url = `${window.location.origin}/pagar/${code}`;
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [code]);

  const isExpired = link?.expires_at && new Date(link.expires_at) < new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link || isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8 px-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {isExpired ? 'Link Expirado' : 'Link Inválido'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isExpired
                ? 'Este link de pagamento expirou. Contacte o vendedor para um novo link.'
                : 'Este link de pagamento não existe ou já foi utilizado.'}
            </p>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src={logoFaktura} alt="Faktura" className="w-8 h-8" />
            <span className="font-display font-black text-xl">Faktura</span>
          </div>
          <p className="text-xs text-muted-foreground">Pagamento seguro via Faktura</p>
        </div>

        {/* Payment Card */}
        <Card className="overflow-hidden border-2 shadow-xl">
          {/* Gradient header */}
          <div className="gradient-fintech px-6 py-8 text-primary-foreground text-center">
            <p className="text-sm text-primary-foreground/60 mb-2">Valor a pagar</p>
            <h1 className="text-4xl font-black font-mono tracking-tight">
              {formatCurrency(Number(link.amount))}
            </h1>
            {link.description && (
              <p className="text-sm text-primary-foreground/70 mt-3 max-w-xs mx-auto">
                {link.description}
              </p>
            )}
          </div>

          <CardContent className="p-6 space-y-5">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              {qrDataUrl ? (
                <div className="p-3 bg-card border-2 border-dashed rounded-2xl">
                  <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-lg" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-muted animate-pulse rounded-xl" />
              )}
              <p className="text-xs text-muted-foreground mt-2">Digitalize o QR Code para pagar</p>
            </div>

            {/* Payment details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Referência</span>
                <span className="text-sm font-mono font-semibold">{link.code}</span>
              </div>
              {link.expires_at && (
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Válido até</span>
                  <span className="text-sm font-medium">{formatDate(link.expires_at)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-1" /> Activo
                </Badge>
              </div>
            </div>

            {/* Payment options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Métodos de pagamento
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
                  <CreditCard className="w-6 h-6 text-warning" />
                  <span className="text-xs font-medium">Multicaixa</span>
                  <Badge variant="secondary" className="text-[9px]">Em breve</Badge>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
                  <CreditCard className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium">Transferência</span>
                  <Badge variant="secondary" className="text-[9px]">Em breve</Badge>
                </Button>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Pagamento protegido e encriptado pela plataforma Faktura
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-semibold">Faktura</span> — Fintech Angola
        </p>
      </div>
    </div>
  );
}
