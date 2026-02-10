import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSendInvoice, useUploadInvoicePDF } from '@/hooks/useInvoiceSends';
import { useAgtConfig } from '@/hooks/useAgtConfig';
import { useAuth } from '@/contexts/AuthContext';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Phone, Mail, Loader2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Fatura } from '@/hooks/useFaturas';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface SendInvoiceDialogProps {
  fatura: Fatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const channelIcons = {
  whatsapp: MessageCircle,
  sms: Phone,
  email: Mail,
};

const channelLabels = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
};

export function SendInvoiceDialog({ fatura, open, onOpenChange }: SendInvoiceDialogProps) {
  const { user } = useAuth();
  const { data: agtConfig } = useAgtConfig();
  const sendInvoice = useSendInvoice();
  const uploadPDF = useUploadInvoicePDF();
  
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>(
    agtConfig?.default_send_channel || 'whatsapp'
  );
  const [recipient, setRecipient] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleOpen = () => {
    if (fatura?.cliente) {
      if (channel === 'email' && fatura.cliente.email) {
        setRecipient(fatura.cliente.email);
      } else if ((channel === 'whatsapp' || channel === 'sms') && fatura.cliente.telefone) {
        let phone = fatura.cliente.telefone.replace(/\s+/g, '');
        if (!phone.startsWith('+') && !phone.startsWith('244')) {
          phone = '244' + phone;
        }
        setRecipient(phone);
      }
    }
  };

  const handleChannelChange = (newChannel: 'whatsapp' | 'sms' | 'email') => {
    setChannel(newChannel);
    if (fatura?.cliente) {
      if (newChannel === 'email' && fatura.cliente.email) {
        setRecipient(fatura.cliente.email);
      } else if ((newChannel === 'whatsapp' || newChannel === 'sms') && fatura.cliente.telefone) {
        let phone = fatura.cliente.telefone.replace(/\s+/g, '');
        if (!phone.startsWith('+') && !phone.startsWith('244')) {
          phone = '244' + phone;
        }
        setRecipient(phone);
      } else {
        setRecipient('');
      }
    }
  };

  const handleSend = async () => {
    if (!fatura || !user) return;
    setIsSending(true);

    try {
      // Step 1: Fetch full invoice data for PDF
      const { data: fullFaturaData, error: fetchError } = await supabase
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

      const fullFatura = { ...fullFaturaData, itens: itens || [] } as Fatura;

      // Step 2: Generate PDF
      const pdfBlob = await generateInvoicePDF(fullFatura);

      // Step 3: Upload PDF to storage
      const fileName = `${fatura.numero.replace(/\//g, '-')}.pdf`;
      const pdfUrl = await uploadPDF.mutateAsync({
        blob: pdfBlob,
        fileName,
        userId: user.id,
      });

      // Step 4: Send invoice with PDF URL
      await sendInvoice.mutateAsync({
        fatura_id: fatura.id,
        channel,
        recipient,
        message: customMessage || undefined,
        pdf_url: pdfUrl,
      });

      onOpenChange(false);
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Erro ao processar envio da fatura');
    } finally {
      setIsSending(false);
    }
  };

  const defaultMessage = fatura ? 
    `Olá ${fatura.cliente?.nome || 'Cliente'},\n\nSegue em anexo a sua fatura nº ${fatura.numero} no valor de ${formatCurrency(Number(fatura.total))}.\n\nData de vencimento: ${new Date(fatura.data_vencimento).toLocaleDateString('pt-AO')}\n\nObrigado pela preferência.\n${agtConfig?.nome_empresa || 'Empresa'}` 
    : '';

  const ChannelIcon = channelIcons[channel];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon className="w-5 h-5 text-primary" />
            Enviar Fatura via {channelLabels[channel]}
          </DialogTitle>
          <DialogDescription>
            A fatura será gerada em PDF e enviada como anexo ao cliente
          </DialogDescription>
        </DialogHeader>

        {fatura && (
          <div className="space-y-4">
            {/* Invoice Summary */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fatura</span>
                <span className="font-mono font-medium">{fatura.numero}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Cliente</span>
                <span className="font-medium truncate max-w-[200px]">{fatura.cliente?.nome}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold text-primary">{formatCurrency(Number(fatura.total))}</span>
              </div>
            </div>

            {/* PDF Attachment Info */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                O PDF da fatura será gerado automaticamente e enviado como anexo
              </p>
            </div>

            {/* Channel Selection */}
            <div className="space-y-2">
              <Label>Canal de Envio</Label>
              <div className="flex gap-2">
                {(['whatsapp', 'sms', 'email'] as const).map((ch) => {
                  const Icon = channelIcons[ch];
                  return (
                    <Button
                      key={ch}
                      type="button"
                      variant={channel === ch ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'flex-1',
                        channel === ch && 'gradient-primary border-0'
                      )}
                      onClick={() => handleChannelChange(ch)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {channelLabels[ch]}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">
                {channel === 'email' ? 'Email do Destinatário' : 'Número de Telefone (formato internacional)'}
              </Label>
              <Input
                id="recipient"
                type={channel === 'email' ? 'email' : 'tel'}
                placeholder={channel === 'email' ? 'cliente@email.com' : '+244 9XX XXX XXX'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              {(channel === 'whatsapp' || channel === 'sms') && (
                <p className="text-xs text-muted-foreground">
                  O número deve estar no formato internacional (+244...)
                </p>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                placeholder={defaultMessage}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usar a mensagem padrão com template
              </p>
            </div>

            {/* Simulation Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-warning">Modo de Simulação</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure a chave API do WhatsApp Business nas configurações para envio real. 
                  Caso o WhatsApp falhe, o sistema tentará reenviar até 3 vezes e usará email como alternativa.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!recipient || isSending}
            className="gradient-primary border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A gerar PDF e enviar...
              </>
            ) : (
              <>
                <ChannelIcon className="w-4 h-4 mr-2" />
                Enviar via {channelLabels[channel]}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
