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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Upload,
  Download,
  Copy,
  Check,
  Info,
  Lock,
  Globe,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  FileCheck,
  TrendingUp,
  Activity,
  Database,
  Server,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfiguracoesProfessional() {
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
  
  // UI State
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('empresa');

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

  // Track changes
  useEffect(() => {
    if (config) {
      const hasChanged = 
        nomeEmpresa !== (config.nome_empresa || '') ||
        enderecoEmpresa !== (config.endereco_empresa || '') ||
        nifProdutor !== (config.nif_produtor || '') ||
        certificateNumber !== (config.certificate_number || '') ||
        publicKey !== (config.public_key || '') ||
        modelo8Reference !== (config.modelo_8_reference || '') ||
        memoriaDescritiva !== (config.memoria_descritiva_reference || '') ||
        declaracaoConformidade !== (config.declaracao_conformidade_reference || '') ||
        defaultSendChannel !== (config.default_send_channel || 'whatsapp') ||
        autoSendInvoice !== (config.auto_send_invoice || false) ||
        invoiceLanguage !== (config.invoice_language || 'pt-AO');
      
      setHasChanges(hasChanged);
    }
  }, [config, nomeEmpresa, enderecoEmpresa, nifProdutor, certificateNumber, publicKey, 
      modelo8Reference, memoriaDescritiva, declaracaoConformidade, defaultSendChannel, 
      autoSendInvoice, invoiceLanguage]);

  const handleSave = async () => {
    try {
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
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao guardar configurações:', error);
    }
  };

  const handleCopyPublicKey = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCertificateStatus = () => {
    const status = config?.certificate_status || 'pending';
    const statusConfig = {
      active: {
        icon: CheckCircle,
        label: 'Certificado Ativo',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      },
      expired: {
        icon: AlertCircle,
        label: 'Certificado Expirado',
        className: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-500',
      },
      pending: {
        icon: Clock,
        label: 'Aguardando Certificação',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      },
    };
    
    const current = statusConfig[status];
    const Icon = current.icon;
    
    return (
      <Badge variant="outline" className={cn('gap-2 px-4 py-1.5 font-medium', current.className)}>
        <span className={cn('h-2 w-2 rounded-full', current.dotColor)} />
        <Icon className="w-3.5 h-3.5" />
        {current.label}
      </Badge>
    );
  };

  const getCompletionData = () => {
    const requiredFields = [
      { name: 'Nome da Empresa', value: nomeEmpresa, category: 'empresa' },
      { name: 'Endereço', value: enderecoEmpresa, category: 'empresa' },
      { name: 'NIF', value: nifProdutor, category: 'empresa' },
      { name: 'Certificado AGT', value: certificateNumber, category: 'agt' },
      { name: 'Chave Pública', value: publicKey, category: 'agt' },
      { name: 'Modelo 8', value: modelo8Reference, category: 'agt' },
    ];
    
    const filled = requiredFields.filter(f => f.value && f.value.trim() !== '').length;
    const percentage = Math.round((filled / requiredFields.length) * 100);
    
    const empresaFields = requiredFields.filter(f => f.category === 'empresa');
    const empresaFilled = empresaFields.filter(f => f.value && f.value.trim() !== '').length;
    const empresaPercentage = Math.round((empresaFilled / empresaFields.length) * 100);
    
    const agtFields = requiredFields.filter(f => f.category === 'agt');
    const agtFilled = agtFields.filter(f => f.value && f.value.trim() !== '').length;
    const agtPercentage = Math.round((agtFilled / agtFields.length) * 100);
    
    return {
      overall: percentage,
      empresa: empresaPercentage,
      agt: agtPercentage,
      filled,
      total: requiredFields.length,
    };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">A carregar configurações</p>
            <p className="text-sm text-muted-foreground">Por favor aguarde...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const completion = getCompletionData();

  return (
    <MainLayout>
      {/* Professional Header */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Settings className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Configurações do Sistema
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestão centralizada de configurações empresariais e conformidade fiscal
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {hasChanges && (
              <Alert className="py-2 px-4 bg-blue-50 border-blue-200">
                <AlertDescription className="flex items-center gap-2 text-blue-700 font-medium m-0">
                  <Activity className="w-4 h-4" />
                  Alterações pendentes
                </AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={handleSave} 
              disabled={updateConfig.isPending || !hasChanges}
              size="lg"
              className={cn(
                "font-semibold shadow-lg hover:shadow-xl transition-all",
                saveSuccess 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              )}
            >
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A processar...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Configurações Guardadas
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Configurações
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Configuração Geral</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{completion.overall}%</p>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/30" />
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                  style={{ width: `${completion.overall}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {completion.filled} de {completion.total} campos obrigatórios preenchidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500/10 bg-gradient-to-br from-emerald-50/50 to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dados Empresariais</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{completion.empresa}%</p>
                  </div>
                </div>
                {completion.empresa === 100 && <CheckCircle className="w-6 h-6 text-emerald-600" />}
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                  style={{ width: `${completion.empresa}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Informações básicas da empresa
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500/10 bg-gradient-to-br from-amber-50/50 to-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Certificação AGT</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{completion.agt}%</p>
                  </div>
                </div>
                {completion.agt === 100 && <CheckCircle className="w-6 h-6 text-amber-600" />}
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out"
                  style={{ width: `${completion.agt}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Conformidade fiscal e certificação
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground w-full lg:w-auto">
          <TabsTrigger 
            value="empresa" 
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Dados Empresariais
          </TabsTrigger>
          <TabsTrigger 
            value="agt"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Certificação AGT
          </TabsTrigger>
          <TabsTrigger 
            value="envios"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Comunicações
          </TabsTrigger>
          <TabsTrigger 
            value="documentos"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Documentação Legal
          </TabsTrigger>
        </TabsList>

        {/* Empresa Tab */}
        <TabsContent value="empresa" className="space-y-6 mt-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl flex items-center gap-2.5">
                    <Building2 className="w-6 h-6 text-primary" />
                    Informações da Empresa
                  </CardTitle>
                  <CardDescription>
                    Dados oficiais da empresa que aparecem em todas as faturas e documentos fiscais emitidos
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-background font-mono">
                  {completion.empresa}% completo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Primary Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Identificação Principal
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="nomeEmpresa" className="text-sm font-medium flex items-center gap-1.5">
                        Nome Legal da Empresa
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nomeEmpresa"
                        placeholder="Ex: TechSolutions Angola, Limitada"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Nome oficial conforme registado
                      </p>
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label htmlFor="nifProdutor" className="text-sm font-medium flex items-center gap-1.5">
                        Número de Identificação Fiscal (NIF)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nifProdutor"
                        placeholder="5000000000"
                        value={nifProdutor}
                        onChange={(e) => setNifProdutor(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors font-mono"
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Formato: 10 dígitos numéricos
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Localização
                  </h3>
                  <div className="space-y-2.5">
                    <Label htmlFor="enderecoEmpresa" className="text-sm font-medium flex items-center gap-1.5">
                      Endereço Fiscal Completo
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="enderecoEmpresa"
                      placeholder="Ex: Rua Principal do Talatona, nº 123, Edifício Empresarial, 3º Andar&#10;Município de Belas, Luanda, Angola"
                      value={enderecoEmpresa}
                      onChange={(e) => setEnderecoEmpresa(e.target.value)}
                      rows={4}
                      className="border-2 focus:border-primary transition-colors resize-none"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Inclua rua, número, município, província e país
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Language Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Preferências Regionais
                  </h3>
                  <div className="space-y-2.5">
                    <Label htmlFor="invoiceLanguage" className="text-sm font-medium flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-primary" />
                      Idioma Padrão das Faturas
                    </Label>
                    <Select value={invoiceLanguage} onValueChange={setInvoiceLanguage}>
                      <SelectTrigger id="invoiceLanguage" className="w-full md:w-80 h-11 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-AO">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🇦🇴</span>
                            <div>
                              <p className="font-medium">Português (Angola)</p>
                              <p className="text-xs text-muted-foreground">Padrão angolano</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="pt-PT">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🇵🇹</span>
                            <div>
                              <p className="font-medium">Português (Portugal)</p>
                              <p className="text-xs text-muted-foreground">Padrão europeu</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🇬🇧</span>
                            <div>
                              <p className="font-medium">English</p>
                              <p className="text-xs text-muted-foreground">International</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Este idioma será utilizado em todas as faturas geradas pelo sistema
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGT Tab */}
        <TabsContent value="agt" className="space-y-6 mt-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl flex items-center gap-2.5">
                    <Shield className="w-6 h-6 text-primary" />
                    Certificação AGT
                  </CardTitle>
                  <CardDescription>
                    Configuração e gestão da certificação junto à Administração Geral Tributária de Angola
                  </CardDescription>
                </div>
                {getCertificateStatus()}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Status Alert */}
              <Alert className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex gap-4">
                  <div className="shrink-0 p-3 rounded-xl bg-amber-100">
                    <Lock className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <AlertDescription className="text-amber-900 font-semibold text-base m-0">
                      Processo de Certificação
                    </AlertDescription>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Para obter a certificação AGT é necessário submeter a documentação completa incluindo 
                      Modelo 8, Memória Descritiva, Declaração de Conformidade e Chave Pública RSA. 
                      O processo de aprovação pode levar até 30 dias úteis.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="secondary" className="bg-white border-amber-300 text-amber-900">
                        <FileText className="w-3 h-3 mr-1.5" />
                        Documentação
                      </Badge>
                      <Badge variant="secondary" className="bg-white border-amber-300 text-amber-900">
                        <Upload className="w-3 h-3 mr-1.5" />
                        Submissão
                      </Badge>
                      <Badge variant="secondary" className="bg-white border-amber-300 text-amber-900">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Aprovação
                      </Badge>
                    </div>
                  </div>
                </div>
              </Alert>

              {/* Certificate Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Dados do Certificado
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="certificateNumber" className="text-sm font-medium flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-primary" />
                        Número do Certificado AGT
                      </Label>
                      <Input
                        id="certificateNumber"
                        placeholder="AGT-2025-XXXXX"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors font-mono"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Atribuído pela AGT após aprovação do processo
                      </p>
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label htmlFor="modelo8" className="text-sm font-medium flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        Referência do Modelo 8
                      </Label>
                      <Input
                        id="modelo8"
                        placeholder="M8-2025-XXXXX"
                        value={modelo8Reference}
                        onChange={(e) => setModelo8Reference(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors font-mono"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Formulário de registo do software
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Public Key Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      Chave Criptográfica
                    </h3>
                    {publicKey && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPublicKey(!showPublicKey)}
                          className="h-9 gap-2"
                        >
                          {showPublicKey ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Visualizar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPublicKey}
                          className="h-9 gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              Copiada
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="publicKey" className="text-sm font-medium flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-primary" />
                      Chave Pública RSA (formato PEM)
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="publicKey"
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      rows={showPublicKey ? 8 : 4}
                      className={cn(
                        "font-mono text-xs border-2 focus:border-primary transition-all resize-none",
                        !showPublicKey && "text-security-disc"
                      )}
                      style={!showPublicKey ? { WebkitTextSecurity: 'disc' } : {}}
                    />
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Chave pública do par RSA utilizada para verificação criptográfica das assinaturas digitais. 
                        Deve estar no formato PEM e ter no mínimo 2048 bits.
                      </span>
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Supporting Documents */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Documentação Complementar
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="memoriaDescritiva" className="text-sm font-medium">
                        Ref. Memória Descritiva
                      </Label>
                      <Input
                        id="memoriaDescritiva"
                        placeholder="MD-2025-XXXXX"
                        value={memoriaDescritiva}
                        onChange={(e) => setMemoriaDescritiva(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Documento técnico descritivo do software
                      </p>
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label htmlFor="declaracaoConformidade" className="text-sm font-medium">
                        Ref. Declaração de Conformidade
                      </Label>
                      <Input
                        id="declaracaoConformidade"
                        placeholder="DC-2025-XXXXX"
                        value={declaracaoConformidade}
                        onChange={(e) => setDeclaracaoConformidade(e.target.value)}
                        className="h-11 border-2 focus:border-primary transition-colors font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Declaração de conformidade com normas fiscais
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Envios Tab */}
        <TabsContent value="envios" className="space-y-6 mt-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2.5">
                <MessageCircle className="w-6 h-6 text-primary" />
                Sistema de Comunicações
              </CardTitle>
              <CardDescription>
                Configuração de envio automático de faturas e notificações aos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Channel Selection */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Canal de Comunicação Principal
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione o método preferencial para envio de documentos fiscais
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      value: 'whatsapp', 
                      label: 'WhatsApp Business', 
                      icon: '💬', 
                      description: 'Entrega instantânea e confirmação de leitura',
                      color: 'emerald',
                      features: ['Entrega rápida', 'Confirmação de leitura', 'Anexos até 16MB']
                    },
                    { 
                      value: 'sms', 
                      label: 'SMS', 
                      icon: '📱', 
                      description: 'Alcance universal sem necessidade de internet',
                      color: 'blue',
                      features: ['100% de alcance', 'Sem internet', 'Link para download']
                    },
                    { 
                      value: 'email', 
                      label: 'Email', 
                      icon: '✉️', 
                      description: 'Formato profissional com anexos completos',
                      color: 'purple',
                      features: ['Profissional', 'Anexos ilimitados', 'Histórico completo']
                    },
                  ].map((channel) => (
                    <button
                      key={channel.value}
                      onClick={() => setDefaultSendChannel(channel.value as any)}
                      className={cn(
                        'relative p-5 rounded-xl border-2 transition-all text-left group',
                        'hover:shadow-lg hover:scale-[1.02]',
                        defaultSendChannel === channel.value
                          ? `border-${channel.color}-500 bg-${channel.color}-50/50 shadow-md`
                          : 'border-border hover:border-primary/30 bg-background'
                      )}
                    >
                      {defaultSendChannel === channel.value && (
                        <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-emerald-500 shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-4xl mb-3">{channel.icon}</div>
                      <p className="font-semibold text-base mb-1">{channel.label}</p>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {channel.description}
                      </p>
                      <div className="space-y-1">
                        {channel.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Automation Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  Automação de Envios
                </h3>
                
                <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-background to-muted/20 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base">Envio Automático de Faturas</p>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Recomendado
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quando ativado, as faturas são enviadas automaticamente para o cliente 
                          imediatamente após a emissão, utilizando o canal configurado acima. 
                          Isto melhora a eficiência e reduz atrasos na comunicação.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Maior satisfação do cliente
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Reduz trabalho manual
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Histórico automático
                          </div>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={autoSendInvoice}
                      onCheckedChange={setAutoSendInvoice}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Configuration Notice */}
              <Alert className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex gap-3">
                  <Server className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <AlertDescription className="text-amber-900 font-semibold m-0">
                      Configuração de API Externa Necessária
                    </AlertDescription>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Atualmente o sistema está em modo de simulação. Para ativar o envio real de mensagens 
                      via WhatsApp e SMS, é necessário configurar as credenciais da API do MessageBird 
                      nas variáveis de ambiente do projeto.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-amber-300 bg-white hover:bg-amber-50 text-amber-900"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Documentação de Integração
                    </Button>
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>

          {/* Send History */}
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Histórico de Comunicações
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Registo detalhado de todas as faturas enviadas
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SendHistoryList limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos" className="space-y-6 mt-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-primary" />
                Base Legal e Regulamentar
              </CardTitle>
              <CardDescription>
                Legislação fiscal angolana e documentação técnica de referência
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                {
                  title: 'Decreto Presidencial n.º 71/25',
                  subtitle: 'Regulamento de Faturação Eletrónica',
                  description: 'Estabelece as regras e procedimentos para emissão de faturas eletrónicas em Angola, incluindo requisitos técnicos, obrigações fiscais e prazos de conformidade.',
                  icon: Shield,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200',
                  date: '2025',
                },
                {
                  title: 'Decreto Executivo n.º 312/18',
                  subtitle: 'Requisitos Técnicos de Software de Faturação',
                  description: 'Define as especificações técnicas obrigatórias para programas de faturação, incluindo assinatura digital, hash de validação e integração com sistemas da AGT.',
                  icon: FileCheck,
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-50',
                  borderColor: 'border-emerald-200',
                  date: '2018',
                },
                {
                  title: 'Norma SAF-T (AO)',
                  subtitle: 'Standard Audit File for Tax - Angola',
                  description: 'Formato normalizado para exportação de dados contabilísticos e fiscais, permitindo auditoria digital completa pela Administração Geral Tributária.',
                  icon: Database,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-50',
                  borderColor: 'border-purple-200',
                  date: 'Atual',
                },
              ].map((doc, index) => (
                <div 
                  key={index}
                  className={cn(
                    "group p-6 rounded-xl border-2 transition-all cursor-pointer",
                    "hover:shadow-xl hover:scale-[1.01]",
                    doc.borderColor
                  )}
                >
                  <div className="flex items-start gap-5">
                    <div className={cn('p-4 rounded-xl shrink-0', doc.bgColor)}>
                      <doc.icon className={cn('w-7 h-7', doc.color)} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0 font-mono text-xs">
                            {doc.date}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-primary mb-2">
                          {doc.subtitle}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {doc.description}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descarregar PDF
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver Online
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Separator className="my-6" />

              {/* Compliance Status */}
              <Alert className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex gap-4">
                  <div className="shrink-0 p-3 rounded-xl bg-emerald-100">
                    <CheckCircle className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="space-y-3">
                    <AlertDescription className="text-emerald-900 font-semibold text-base m-0">
                      Sistema Certificado e em Conformidade
                    </AlertDescription>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      Este software está desenvolvido em total conformidade com toda a legislação fiscal 
                      angolana vigente. Inclui suporte completo para exportação SAF-T (AO), assinatura 
                      digital de documentos, e integração com os sistemas da AGT. A funcionalidade de 
                      assinatura digital será ativada automaticamente após a configuração do certificado AGT.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary" className="bg-white border-emerald-300 text-emerald-900">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        SAF-T (AO) Ready
                      </Badge>
                      <Badge variant="secondary" className="bg-white border-emerald-300 text-emerald-900">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Assinatura Digital
                      </Badge>
                      <Badge variant="secondary" className="bg-white border-emerald-300 text-emerald-900">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Hash Validation
                      </Badge>
                      <Badge variant="secondary" className="bg-white border-emerald-300 text-emerald-900">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Integração AGT
                      </Badge>
                    </div>
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}