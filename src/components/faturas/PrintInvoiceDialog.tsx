import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Printer, Download, Share2, FileText,
  Receipt, Loader2, Smartphone, Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Fatura } from '@/hooks/useFaturas';
import type { CompanyInfo } from '@/lib/pdf-generator';
import { generateInvoicePDF, downloadInvoicePDF } from '@/lib/pdf-generator';
import { generateThermalReceiptPDF, generateMediumFormatPDF } from '@/lib/receipt-pdf-generator';

type PrintFormat = 'thermal-58' | 'thermal-80' | 'medium-76' | 'a4';

interface PrintFormatOption {
  id: PrintFormat;
  label: string;
  description: string;
  icon: any;
  badge?: string;
}

const FORMATS: PrintFormatOption[] = [
  {
    id: 'thermal-58',
    label: 'Recibo Térmico 58mm',
    description: 'Para impressoras portáteis Bluetooth — papel estreito',
    icon: Receipt,
    badge: 'Portátil',
  },
  {
    id: 'thermal-80',
    label: 'Recibo Térmico 80mm',
    description: 'Para impressoras de POS — papel standard com mais detalhes',
    icon: Receipt,
    badge: 'POS',
  },
  {
    id: 'medium-76',
    label: 'Formato Médio 76mm',
    description: 'Para impressoras de etiquetas 3" — informações completas',
    icon: Smartphone,
    badge: 'Médio',
  },
  {
    id: 'a4',
    label: 'Fatura Completa A4',
    description: 'Para impressoras standard — documento fiscal completo com todos os detalhes',
    icon: Monitor,
    badge: 'Profissional',
  },
];

interface PrintInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura | null;
  companyInfo?: CompanyInfo;
}

export function PrintInvoiceDialog({
  open, onOpenChange, fatura, companyInfo,
}: PrintInvoiceDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('a4');
  const [generating, setGenerating] = useState(false);

  if (!fatura) return null;

  const generatePDF = async (format: PrintFormat): Promise<Blob> => {
    switch (format) {
      case 'thermal-58':
        return generateThermalReceiptPDF(fatura, companyInfo, '58mm');
      case 'thermal-80':
        return generateThermalReceiptPDF(fatura, companyInfo, '80mm');
      case 'medium-76':
        return generateMediumFormatPDF(fatura, companyInfo);
      case 'a4':
      default:
        return generateInvoicePDF(fatura, companyInfo);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF(selectedFormat);
      const suffix = selectedFormat === 'a4' ? '' : `-${selectedFormat}`;
      const filename = `${fatura.numero.replace(/\//g, '-')}${suffix}.pdf`;
      downloadInvoicePDF(blob, filename);
      toast.success('PDF descarregado com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF(selectedFormat);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('A preparar impressão...');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao preparar impressão');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF(selectedFormat);
      const file = new File([blob], `${fatura.numero.replace(/\//g, '-')}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Fatura ${fatura.numero}`,
          text: `Fatura ${fatura.numero} — ${new Intl.NumberFormat('pt-AO', {
            style: 'currency', currency: 'AOA',
          }).format(Number(fatura.total)).replace('AOA', 'Kz')}`,
          files: [file],
        });
        toast.success('Partilhado com sucesso');
      } else {
        // Fallback: WhatsApp
        downloadInvoicePDF(blob, `${fatura.numero.replace(/\//g, '-')}.pdf`);
        const phone = fatura.cliente?.telefone
          ? fatura.cliente.telefone.replace(/\D/g, '')
          : '';
        const msg = encodeURIComponent(
          `Segue a fatura ${fatura.numero} no valor de ${new Intl.NumberFormat('pt-AO', {
            style: 'currency', currency: 'AOA',
          }).format(Number(fatura.total)).replace('AOA', 'Kz')}`
        );
        const waUrl = phone
          ? `https://wa.me/244${phone}?text=${msg}`
          : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank');
        toast.success('PDF descarregado. Anexe ao WhatsApp.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao partilhar');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Imprimir Fatura
          </DialogTitle>
          <DialogDescription>
            {fatura.numero} — Escolha o formato de impressão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Format selection */}
          <div className="space-y-2">
            {FORMATS.map(fmt => {
              const Icon = fmt.icon;
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-md ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{fmt.label}</span>
                      {fmt.badge && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {fmt.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmt.description}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleDownload}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descarregar PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handlePrint}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Imprimir
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={handleShare}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Partilhar via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
