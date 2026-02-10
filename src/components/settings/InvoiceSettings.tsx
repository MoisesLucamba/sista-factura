import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceSettings {
  autoSendWhatsApp: boolean;
  defaultMessage: string;
  companyName: string;
  defaultPaymentTerms: number;
}

export function InvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettings>({
    autoSendWhatsApp: false,
    defaultMessage: `Olá [CLIENTE],

Segue em anexo a [TIPO_DOC] [NUMERO].

Valor total: [TOTAL]
Data de vencimento: [VENCIMENTO]

Qualquer dúvida, estamos à disposição.

Atenciosamente,
[EMPRESA]`,
    companyName: 'Sua Empresa',
    defaultPaymentTerms: 30,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    toast.success('Configurações salvas com sucesso!');
  };

  const handleToggleAutoSend = (checked: boolean) => {
    setSettings({ ...settings, autoSendWhatsApp: checked });
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Integration */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Integração WhatsApp
          </CardTitle>
          <CardDescription>
            Configure o envio automático de faturas via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-send">Envio Automático</Label>
              <p className="text-sm text-muted-foreground">
                Abrir WhatsApp automaticamente ao emitir fatura
              </p>
            </div>
            <Switch
              id="auto-send"
              checked={settings.autoSendWhatsApp}
              onCheckedChange={handleToggleAutoSend}
            />
          </div>

          {settings.autoSendWhatsApp && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Envio automático ativado</p>
                  <p className="text-muted-foreground mt-1">
                    Ao emitir uma nova fatura, o WhatsApp será aberto automaticamente com a mensagem
                    preparada e o PDF será baixado para você anexar manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="default-message">Mensagem Padrão</Label>
            <Textarea
              id="default-message"
              rows={10}
              value={settings.defaultMessage}
              onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Variáveis disponíveis:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li><code>[CLIENTE]</code> - Nome do cliente</li>
                <li><code>[TIPO_DOC]</code> - Tipo de documento (Fatura, Fatura-Recibo, etc)</li>
                <li><code>[NUMERO]</code> - Número da fatura</li>
                <li><code>[TOTAL]</code> - Valor total</li>
                <li><code>[VENCIMENTO]</code> - Data de vencimento</li>
                <li><code>[EMPRESA]</code> - Nome da empresa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Configurações de Faturação
          </CardTitle>
          <CardDescription>
            Configurações gerais para emissão de faturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input
              id="company-name"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-terms">Prazo de Pagamento Padrão (dias)</Label>
            <Input
              id="payment-terms"
              type="number"
              min="0"
              value={settings.defaultPaymentTerms}
              onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: parseInt(e.target.value) || 30 })}
            />
            <p className="text-xs text-muted-foreground">
              Prazo padrão para vencimento de faturas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary border-0">
          <Save className="w-4 h-4 mr-2" />
          Guardar Configurações
        </Button>
      </div>
    </div>
  );
}