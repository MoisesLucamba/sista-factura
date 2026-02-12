import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF, type CompanyInfo } from '@/lib/pdf-generator';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { supabase } from '@/integrations/supabase/client';
import type { Fatura } from '@/hooks/useFaturas';

interface SendInvoiceDialogProps {
  fatura: Fatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper functions outside component to avoid hoisting issues
const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure it has country code (244 for Angola)
  if (!cleaned.startsWith('244')) {
    return '244' + cleaned;
  }
  return cleaned;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-AO');
};

const getEmpresaName = (): string => {
  // You can fetch this from your company settings
  const settings = localStorage.getItem('invoiceSettings');
  if (settings) {
    const parsed = JSON.parse(settings);
    return parsed.companyName || 'Sua Empresa';
  }
  return 'Sua Empresa';
};

const getDefaultMessage = (fatura: Fatura | null): string => {
  if (!fatura) return '';
  
  return `Olá ${fatura.cliente?.nome || 'Cliente'},

Segue em anexo a ${fatura.tipo === 'fatura' ? 'fatura' : 'fatura-recibo'} ${fatura.numero}.

Valor total: ${formatCurrency(Number(fatura.total))}
Data de vencimento: ${formatDate(fatura.data_vencimento)}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
${getEmpresaName()}`;
};

export function SendInvoiceDialog({ fatura, open, onOpenChange }: SendInvoiceDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [includePDF, setIncludePDF] = useState(true);
  const [useClientPhone, setUseClientPhone] = useState(true);
  const { data: agtConfig } = useAgtConfig();

  // Initialize with default message and client phone when fatura changes
  useEffect(() => {
    if (fatura) {
      setMessage(getDefaultMessage(fatura));
      if (fatura.cliente?.telefone) {
        setPhoneNumber(formatPhoneForWhatsApp(fatura.cliente.telefone));
      }
    }
  }, [fatura]);

  const handleSend = async () => {
    if (!fatura) return;

    // Validate phone number
    const finalPhone = useClientPhone && fatura.cliente?.telefone
      ? formatPhoneForWhatsApp(fatura.cliente.telefone)
      : phoneNumber;

    if (!finalPhone) {
      toast.error('Por favor, insira um número de telefone');
      return;
    }

    setIsSending(true);

    try {
      let pdfBlob: Blob | null = null;
      let pdfUrl = '';

      // Generate PDF if requested
      if (includePDF) {
        // Fetch full fatura with items
        const { data: fullFatura, error: fetchError } = await supabase
          .from('faturas')
          .select(`*, cliente:clientes(*)`)
          .eq('id', fatura.id)
          .single();

        if (fetchError) throw fetchError;

        const { data: itens, error: itensError } = await supabase
          .from('itens_fatura')
          .select(`*, produto:produtos(*)`)
          .eq('fatura_id', fatura.id);

        if (itensError) throw itensError;

        // Generate PDF
        const companyInfo: CompanyInfo = agtConfig ? {
          nome_empresa: agtConfig.nome_empresa || undefined,
          nif_produtor: agtConfig.nif_produtor || undefined,
          endereco_empresa: agtConfig.endereco_empresa || undefined,
          telefone: agtConfig.telefone || undefined,
          email: agtConfig.email || undefined,
          morada: agtConfig.morada || undefined,
          cidade: agtConfig.cidade || undefined,
          provincia: agtConfig.provincia || undefined,
          alvara_comercial: agtConfig.alvara_comercial || undefined,
        } : undefined;

        pdfBlob = await generateInvoicePDF({ ...fullFatura, itens } as Fatura, companyInfo);

        // Upload PDF to storage (optional, for sharing link)
        const fileName = `${fatura.numero.replace(/\//g, '-')}_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Failed to upload PDF to storage:', uploadError);
          // Continue without uploaded file - we'll use direct PDF
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('invoices')
            .getPublicUrl(uploadData.path);
          
          pdfUrl = urlData.publicUrl;
        }
      }

      // Format WhatsApp message
      let whatsappMessage = encodeURIComponent(message);
      let whatsappUrl = '';

      if (includePDF && pdfUrl) {
        // If we have a PDF URL, include it in the message
        whatsappMessage = encodeURIComponent(`${message}\n\nPDF: ${pdfUrl}`);
        whatsappUrl = `https://wa.me/${finalPhone}?text=${whatsappMessage}`;
      } else if (includePDF && pdfBlob) {
        // For direct PDF sending, we'll use WhatsApp Web API
        // Note: WhatsApp Web doesn't support direct file upload via URL
        // We need to use the business API or manual sharing
        toast.info('PDF gerado. Por favor, anexe manualmente no WhatsApp.');
        
        // Download PDF for user to send manually
        const downloadUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${fatura.numero.replace(/\//g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        whatsappUrl = `https://wa.me/${finalPhone}?text=${whatsappMessage}`;
      } else {
        // Just message, no PDF
        whatsappUrl = `https://wa.me/${finalPhone}?text=${whatsappMessage}`;
      }

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      // Update fatura status to 'emitida' if it was 'rascunho'
      if (fatura.estado === 'rascunho') {
        await supabase
          .from('faturas')
          .update({ estado: 'emitida' })
          .eq('id', fatura.id);
      }

      toast.success('WhatsApp aberto com sucesso!', {
        description: includePDF 
          ? 'Mensagem preparada. Anexe o PDF baixado e envie.'
          : 'Mensagem preparada para envio.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Erro ao preparar envio');
    } finally {
      setIsSending(false);
    }
  };

  if (!fatura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Enviar Fatura via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie a fatura {fatura.numero} para o cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{fatura.numero}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente: {fatura.cliente?.nome || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(Number(fatura.total))}
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-client-phone"
                checked={useClientPhone}
                onCheckedChange={(checked) => setUseClientPhone(checked as boolean)}
              />
              <Label htmlFor="use-client-phone" className="text-sm cursor-pointer">
                Usar telefone do cliente
                {fatura.cliente?.telefone && (
                  <span className="text-muted-foreground ml-1">
                    ({fatura.cliente.telefone})
                  </span>
                )}
              </Label>
            </div>

            {!useClientPhone && (
              <div className="space-y-1">
                <Label htmlFor="phone">Número de WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="244 900 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Incluir código do país (ex: 244 para Angola)
                </p>
              </div>
            )}
          </div>

          {/* Include PDF */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-pdf"
              checked={includePDF}
              onCheckedChange={(checked) => setIncludePDF(checked as boolean)}
            />
            <Label htmlFor="include-pdf" className="text-sm cursor-pointer">
              Incluir PDF da fatura
            </Label>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Personalize a mensagem antes de enviar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="gradient-primary border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Abrir WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}