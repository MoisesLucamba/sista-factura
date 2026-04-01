import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Copy, Download, Share2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

export function MerchantQRCode() {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [merchantName, setMerchantName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    generateQR();
  }, [user]);

  const generateQR = async () => {
    if (!user) return;

    const { data: config } = await supabase
      .from('agt_config')
      .select('nome_empresa')
      .eq('user_id', user.id)
      .single();

    setMerchantName(config?.nome_empresa || 'Minha Loja');

    const url = `${window.location.origin}/loja/${user.id}`;
    setStoreUrl(url);

    try {
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success('Link da loja copiado!');
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-loja-${merchantName.replace(/\s+/g, '-')}.png`;
    a.click();
    toast.success('QR Code descarregado!');
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Loja ${merchantName} - Faktura`,
        text: `Veja os produtos de ${merchantName} e pague com Faktura!`,
        url: storeUrl,
      });
    } else {
      copyLink();
    }
  };

  if (!qrDataUrl) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          QR Code da Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border">
          <img src={qrDataUrl} alt="QR Code da Loja" className="w-48 h-48" />
        </div>
        <div>
          <p className="font-bold">{merchantName}</p>
          <p className="text-xs text-muted-foreground">Clientes podem digitalizar para ver os seus produtos e pagar</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1">
            <Copy className="w-3 h-3" /> Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQR} className="gap-1">
            <Download className="w-3 h-3" /> Descarregar
          </Button>
          <Button variant="outline" size="sm" onClick={shareLink} className="gap-1">
            <Share2 className="w-3 h-3" /> Partilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
