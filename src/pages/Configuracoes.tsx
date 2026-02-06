import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAgtConfig, useCreateOrUpdateAgtConfig } from '@/hooks/useAgtConfig';
import { SendHistoryList } from '@/components/faturas/SendHistoryList';
import {
  Settings,
  Building2,
  Shield,
  MessageCircle,
  FileText,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function Configuracoes() {
  const { data: config, isLoading } = useAgtConfig();
  const updateConfig = useCreateOrUpdateAgtConfig();

  // Form state
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [enderecoEmpresa, setEnderecoEmpresa] = useState('');
  const [nifProdutor, setNifProdutor] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [modelo8Reference, setModelo8Reference] = useState('');
  const [memoriaDescritiva, setMemoriaDescritiva] = useState('');
  const [declaracaoConformidade, setDeclaracaoConformidade] = useState('');
  const [defaultSendChannel, setDefaultSendChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [autoSendInvoice, setAutoSendInvoice] = useState(false);
  const [invoiceLanguage, setInvoiceLanguage] = useState('pt-AO');

  // Load config into form
  useEffect(() => {
    if (config) {
      setNomeEmpresa(config.nome_empresa || '');
      setEnderecoEmpresa(config.endereco_empresa || '');
      setNifProdutor(config.nif_produtor || '');
      setCertificateNumber(config.certificate_number || '');
      setPublicKey(config.public_key || '');
      setModelo8Reference(config.modelo_8_reference || '');
      setMemoriaDescritiva(config.memoria_descritiva_reference || '');
      setDeclaracaoConformidade(config.declaracao_conformidade_reference || '');
      setDefaultSendChannel(config.default_send_channel || 'whatsapp');
      setAutoSendInvoice(config.auto_send_invoice || false);
      setInvoiceLanguage(config.invoice_language || 'pt-AO');
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      nome_empresa: nomeEmpresa,
      endereco_empresa: enderecoEmpresa,
      nif_produtor: nifProdutor,
      certificate_number: certificateNumber || undefined,
      public_key: publicKey || undefined,
      modelo_8_reference: modelo8Reference || undefined,
      memoria_descritiva_reference: memoriaDescritiva || undefined,
      declaracao_conformidade_reference: declaracaoConformidade || undefined,
      default_send_channel: defaultSendChannel,
      auto_send_invoice: autoSendInvoice,
      invoice_language: invoiceLanguage,
    });
  };

  const getCertificateStatusBadge = () => {
    const status = config?.certificate_status || 'pending';
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Activo
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurações da empresa e conformidade AGT
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
          className="gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow"
        >
          {updateConfig.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Alterações
        </Button>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="agt" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">AGT</span>
          </TabsTrigger>
          <TabsTrigger value="envios" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Envios</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Empresa Tab */}
        <TabsContent value="empresa" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações que aparecem nas faturas emitidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <Input
                    id="nomeEmpresa"
                    placeholder="Sua Empresa, Lda"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nifProdutor">NIF do Produtor</Label>
                  <Input
                    id="nifProdutor"
                    placeholder="5000000000"
                    value={nifProdutor}
                    onChange={(e) => setNifProdutor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoEmpresa">Endereço</Label>
                <Textarea
                  id="enderecoEmpresa"
                  placeholder="Rua Principal, 123, Luanda, Angola"
                  value={enderecoEmpresa}
                  onChange={(e) => setEnderecoEmpresa(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceLanguage">Idioma das Faturas</Label>
                <Select value={invoiceLanguage} onValueChange={setInvoiceLanguage}>
                  <SelectTrigger id="invoiceLanguage" className="w-full sm:w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                    <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGT Tab */}
        <TabsContent value="agt" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Certificação AGT
                  </CardTitle>
                  <CardDescription>
                    Dados de certificação junto à Administração Geral Tributária
                  </CardDescription>
                </div>
                {getCertificateStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Certificação Pendente</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Para certificar o software junto à AGT, é necessário submeter o Modelo 8, 
                      Memória Descritiva, Declaração de Conformidade e Chave Pública. 
                      Após aprovação, receberá o número de certificado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificateNumber">Número do Certificado AGT</Label>
                  <Input
                    id="certificateNumber"
                    placeholder="AGT-2025-XXXXX"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fornecido pela AGT após aprovação
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo8">Referência Modelo 8</Label>
                  <Input
                    id="modelo8"
                    placeholder="M8-2025-XXXXX"
                    value={modelo8Reference}
                    onChange={(e) => setModelo8Reference(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicKey">Chave Pública RSA</Label>
                <Textarea
                  id="publicKey"
                  placeholder="-----BEGIN PUBLIC KEY-----..."
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Chave pública usada para verificação das assinaturas digitais
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memoriaDescritiva">Ref. Memória Descritiva</Label>
                  <Input
                    id="memoriaDescritiva"
                    placeholder="MD-2025-XXXXX"
                    value={memoriaDescritiva}
                    onChange={(e) => setMemoriaDescritiva(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="declaracaoConformidade">Ref. Declaração de Conformidade</Label>
                  <Input
                    id="declaracaoConformidade"
                    placeholder="DC-2025-XXXXX"
                    value={declaracaoConformidade}
                    onChange={(e) => setDeclaracaoConformidade(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Envios Tab */}
        <TabsContent value="envios" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Configurações de Envio
              </CardTitle>
              <CardDescription>
                Defina como as faturas são enviadas aos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Canal de Envio Padrão</Label>
                  <Select 
                    value={defaultSendChannel} 
                    onValueChange={(v) => setDefaultSendChannel(v as 'whatsapp' | 'sms' | 'email')}
                  >
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Envio Automático</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar fatura automaticamente ao cliente após emissão
                    </p>
                  </div>
                  <Switch
                    checked={autoSendInvoice}
                    onCheckedChange={setAutoSendInvoice}
                  />
                </div>

                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Modo de Simulação</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Os envios estão em modo de simulação. Para envio real via WhatsApp/SMS, 
                        configure a chave API do MessageBird nas configurações do projeto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Histórico de Envios</CardTitle>
              <CardDescription>
                Últimos envios de faturas aos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendHistoryList limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documentos Legais
              </CardTitle>
              <CardDescription>
                Legislação e documentação de referência para conformidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <p className="font-medium">Decreto Presidencial n.º 71/25</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Regulamento de faturação eletrónica em Angola
                  </p>
                </div>
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <p className="font-medium">Decreto Executivo n.º 312/18</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Requisitos técnicos para programas de faturação
                  </p>
                </div>
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <p className="font-medium">Norma SAF-T (AO)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Standard Audit File for Tax - versão Angola
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  O software está preparado para exportação SAF-T e conformidade com toda a 
                  legislação fiscal angolana em vigor. A funcionalidade de assinatura digital 
                  será activada automaticamente após configuração do certificado AGT.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
