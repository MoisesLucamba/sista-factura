import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

interface BuyerQRCodeProps {
  fakturaId: string;
  buyerName: string;
}

export function BuyerQRCode({ fakturaId, buyerName }: BuyerQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const scanUrl = `${window.location.origin}/scan/${fakturaId}`;

  useEffect(() => {
    generateQR();
  }, [fakturaId]);

  const generateQR = async () => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(scanUrl, {
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

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-faktura-${fakturaId}.png`;
    a.click();
    toast.success('QR Code descarregado!');
  };

  const copyId = () => {
    navigator.clipboard.writeText(fakturaId);
    toast.success('ID Faktura copiado!');
  };

  if (!qrDataUrl) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Meu QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border">
          <img src={qrDataUrl} alt="QR Code do Comprador" className="w-48 h-48" />
        </div>
        <div>
          <p className="font-bold text-primary text-lg tracking-wider">{fakturaId}</p>
          <p className="text-xs text-muted-foreground">Mostre ao vendedor para identificação rápida</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={copyId} className="gap-1">
            <Copy className="w-3 h-3" /> Copiar ID
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQR} className="gap-1">
            <Download className="w-3 h-3" /> Descarregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
