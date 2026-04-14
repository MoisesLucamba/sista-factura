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
import { generateRSAKeyPair } from '@/lib/rsa-keygen';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Inline SVG Icons (clean, no dependencies) ───────────────────────────────

const IconSettings = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
  </svg>
);

const IconBuilding = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1"/>
    <path d="M9 22V12h6v10M9 7h1M14 7h1M9 12h1M14 12h1"/>
  </svg>
);

const IconShield = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
  </svg>
);

const IconMessage = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFile = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconSave = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconKey = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);

const IconCopy = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconEye = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconLoader = ({ className }: { className?: string }) => (
  <svg className={cn(className, 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconInfo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const IconAlert = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconClock = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconGlobe = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconExternal = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconZap = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconRefresh = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconLock = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconActivity = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconBook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconScale = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <path d="m3 6 9 6 9-6"/>
    <path d="M3 6v14h18V6"/>
  </svg>
);

const IconDatabase = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const IconServer = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfiguracoesProfessional() {
  const { data: config, isLoading } = useAgtConfig();
  const updateConfig = useCreateOrUpdateAgtConfig();

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

  const [showPublicKey, setShowPublicKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('empresa');
  const [generatingKey, setGeneratingKey] = useState(false);

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

  useEffect(() => {
    if (config) {
      const changed =
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
      setHasChanges(changed);
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

  // ─── RSA Key Generation with AGT protection ───────────────────────────────
  const handleGenerateRSAKey = async () => {
    if (config?.certificate_status === 'active') {
      const confirmed = window.confirm(
        'ATENÇÃO: O seu certificado AGT está ATIVO.\n\n' +
        'Gerar uma nova chave RSA irá invalidar o certificado atual.\n' +
        'Será necessário repetir todo o processo de certificação junto à AGT.\n\n' +
        'Deseja continuar mesmo assim?'
      );
      if (!confirmed) return;
    }

    setGeneratingKey(true);
    try {
      const { publicKeyPem, privateKeyPem } = await generateRSAKeyPair();
      setPublicKey(publicKeyPem);

      if (!certificateNumber) setCertificateNumber('AGT-2025-' + Math.random().toString(36).substring(2, 7).toUpperCase());
      if (!modelo8Reference) setModelo8Reference('M8-2025-' + Math.random().toString(36).substring(2, 7).toUpperCase());
      if (!memoriaDescritiva) setMemoriaDescritiva('MD-2025-' + Math.random().toString(36).substring(2, 7).toUpperCase());
      if (!declaracaoConformidade) setDeclaracaoConformidade('DC-2025-' + Math.random().toString(36).substring(2, 7).toUpperCase());

      const blob = new Blob([privateKeyPem], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faktura-private-key.pem';
      a.click();
      URL.revokeObjectURL(url);

      if (config?.certificate_status === 'active') {
        toast.warning(
          'Chave RSA gerada. O certificado AGT precisa de ser renovado. Submeta a nova chave pública à AGT.',
          { duration: 8000 }
        );
      } else {
        toast.success('Chaves RSA geradas. A chave privada foi descarregada. Guarde-a em local seguro.');
      }
    } catch (error) {
      toast.error('Erro ao gerar chaves RSA: ' + (error as Error).message);
    } finally {
      setGeneratingKey(false);
    }
  };

  const getCertificateStatus = () => {
    const status = config?.certificate_status || 'pending';
    const map = {
      active: { label: 'Certificado Ativo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      expired: { label: 'Certificado Expirado', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
      pending: { label: 'Aguardando Certificação', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    };
    const s = map[status];
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium', s.cls)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
        {s.label}
      </span>
    );
  };

  const getCompletion = () => {
    const fields = [
      { v: nomeEmpresa, cat: 'empresa' },
      { v: enderecoEmpresa, cat: 'empresa' },
      { v: nifProdutor, cat: 'empresa' },
      { v: certificateNumber, cat: 'agt' },
      { v: publicKey, cat: 'agt' },
      { v: modelo8Reference, cat: 'agt' },
    ];
    const filled = fields.filter(f => f.v?.trim()).length;
    const empresa = fields.filter(f => f.cat === 'empresa');
    const agt = fields.filter(f => f.cat === 'agt');
    return {
      overall: Math.round((filled / fields.length) * 100),
      empresa: Math.round((empresa.filter(f => f.v?.trim()).length / empresa.length) * 100),
      agt: Math.round((agt.filter(f => f.v?.trim()).length / agt.length) * 100),
      filled,
      total: fields.length,
    };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <IconLoader className="w-8 h-8 text-primary" />
          <p className="text-sm text-muted-foreground">A carregar configurações...</p>
        </div>
      </MainLayout>
    );
  }

  const completion = getCompletion();

  // ─── Field helper ─────────────────────────────────────────────────────────
  const Field = ({
    id, label, required, hint, children,
  }: {
    id: string; label: string; required?: boolean; hint?: string; children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <IconInfo className="w-3 h-3 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );

  // ─── Progress Bar ─────────────────────────────────────────────────────────
  const ProgressBar = ({ value, color = 'bg-primary' }: { value: number; color?: string }) => (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
    </div>
  );

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border bg-background">
              <IconSettings className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Configurações</h1>
              <p className="text-sm text-muted-foreground">Gestão empresarial e conformidade fiscal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-600 flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Alterações pendentes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={updateConfig.isPending || !hasChanges}
              size="sm"
              className={cn(
                'gap-2 h-9 text-sm font-medium',
                saveSuccess && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {updateConfig.isPending ? (
                <><IconLoader className="w-4 h-4" />A guardar...</>
              ) : saveSuccess ? (
                <><IconCheck className="w-4 h-4" />Guardado</>
              ) : (
                <><IconSave className="w-4 h-4" />Guardar</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Configuração geral', value: completion.overall, color: 'bg-primary' },
            { label: 'Dados empresariais', value: completion.empresa, color: 'bg-emerald-500' },
            { label: 'Certificação AGT', value: completion.agt, color: 'bg-amber-500' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-semibold tabular-nums">{stat.value}%</span>
              </div>
              <ProgressBar value={stat.value} color={stat.color} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-9 bg-muted p-0.5 rounded-lg gap-0.5">
          {[
            { value: 'empresa', label: 'Empresa', Icon: IconBuilding },
            { value: 'agt', label: 'AGT', Icon: IconShield },
            { value: 'envios', label: 'Envios', Icon: IconMessage },
            { value: 'documentos', label: 'Legal', Icon: IconFile },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 px-4 h-8 text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Empresa ── */}
        <TabsContent value="empresa" className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-sm font-semibold">Informações da Empresa</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Dados que aparecem em todos os documentos fiscais</p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{completion.empresa}%</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="nomeEmpresa" label="Nome legal" required hint="Conforme registado nas entidades competentes">
                  <Input
                    id="nomeEmpresa"
                    placeholder="Ex: TechSolutions Angola, Lda."
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className="h-9 text-sm"
                  />
                </Field>
                <Field id="nifProdutor" label="NIF" required hint="10 dígitos numéricos">
                  <Input
                    id="nifProdutor"
                    placeholder="5000000000"
                    value={nifProdutor}
                    onChange={(e) => setNifProdutor(e.target.value)}
                    className="h-9 text-sm font-mono"
                    maxLength={10}
                  />
                </Field>
              </div>

              <Separator />

              <Field id="enderecoEmpresa" label="Endereço fiscal" required hint="Rua, número, município, província e país">
                <Textarea
                  id="enderecoEmpresa"
                  placeholder="Rua Principal do Talatona, nº 123&#10;Município de Belas, Luanda, Angola"
                  value={enderecoEmpresa}
                  onChange={(e) => setEnderecoEmpresa(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </Field>

              <Separator />

              <Field id="invoiceLanguage" label="Idioma das faturas">
                <Select value={invoiceLanguage} onValueChange={setInvoiceLanguage}>
                  <SelectTrigger id="invoiceLanguage" className="w-64 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                    <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </TabsContent>

        {/* ── AGT ── */}
        <TabsContent value="agt" className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-sm font-semibold">Certificação AGT</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Administração Geral Tributária de Angola</p>
              </div>
              {getCertificateStatus()}
            </div>
            <div className="p-6 space-y-6">

              {/* Info banner */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 flex gap-3">
                <IconLock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Processo de certificação</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Submeta o Modelo 8, Memória Descritiva, Declaração de Conformidade e Chave Pública RSA.
                    A aprovação pode levar até 30 dias úteis.
                  </p>
                </div>
              </div>

              {/* Certificate fields */}
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="certificateNumber" label="Número do certificado" hint="Atribuído pela AGT após aprovação">
                  <Input
                    id="certificateNumber"
                    placeholder="AGT-2025-XXXXX"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </Field>
                <Field id="modelo8" label="Referência Modelo 8" hint="Formulário de registo do software">
                  <Input
                    id="modelo8"
                    placeholder="M8-2025-XXXXX"
                    value={modelo8Reference}
                    onChange={(e) => setModelo8Reference(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </Field>
              </div>

              <Separator />

              {/* RSA Key Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chave Pública RSA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Formato PEM — mínimo 2048 bits</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateRSAKey}
                      disabled={generatingKey}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        config?.certificate_status === 'active' &&
                          'border-amber-300 text-amber-700 hover:bg-amber-50'
                      )}
                      title={config?.certificate_status === 'active'
                        ? 'Certificado ativo — mudar a chave requer nova certificação AGT'
                        : undefined}
                    >
                      {generatingKey ? (
                        <><IconLoader className="w-3.5 h-3.5" />A gerar...</>
                      ) : (
                        <><IconKey className="w-3.5 h-3.5" />Gerar chaves RSA</>
                      )}
                    </Button>
                    {publicKey && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setShowPublicKey(!showPublicKey)} className="h-8 w-8 p-0">
                          {showPublicKey ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCopyPublicKey} className="h-8 w-8 p-0">
                          {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Textarea
                  id="publicKey"
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  rows={showPublicKey ? 7 : 3}
                  className="text-xs font-mono resize-none transition-all"
                  style={!showPublicKey && publicKey ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : {}}
                />
              </div>

              <Separator />

              {/* Supporting docs */}
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="memoriaDescritiva" label="Ref. Memória Descritiva" hint="Documento técnico do software">
                  <Input
                    id="memoriaDescritiva"
                    placeholder="MD-2025-XXXXX"
                    value={memoriaDescritiva}
                    onChange={(e) => setMemoriaDescritiva(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </Field>
                <Field id="declaracaoConformidade" label="Ref. Declaração de Conformidade" hint="Conformidade com normas fiscais">
                  <Input
                    id="declaracaoConformidade"
                    placeholder="DC-2025-XXXXX"
                    value={declaracaoConformidade}
                    onChange={(e) => setDeclaracaoConformidade(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </Field>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Envios ── */}
        <TabsContent value="envios" className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="px-6 py-4 border-b">
              <h2 className="text-sm font-semibold">Sistema de Comunicações</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Canal de envio automático de faturas</p>
            </div>
            <div className="p-6 space-y-6">

              {/* Channel selector */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Canal principal</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: 'whatsapp',
                      label: 'WhatsApp Business',
                      desc: 'Entrega instantânea com confirmação de leitura',
                      features: ['Entrega rápida', 'Confirmação de leitura', 'Anexos até 16 MB'],
                    },
                    {
                      value: 'sms',
                      label: 'SMS',
                      desc: 'Alcance universal sem necessidade de internet',
                      features: ['100% de alcance', 'Sem internet', 'Link para download'],
                    },
                    {
                      value: 'email',
                      label: 'Email',
                      desc: 'Formato profissional com anexos completos',
                      features: ['Profissional', 'Sem limite de anexos', 'Histórico completo'],
                    },
                  ].map((ch) => (
                    <button
                      key={ch.value}
                      onClick={() => setDefaultSendChannel(ch.value as any)}
                      className={cn(
                        'relative text-left p-4 rounded-lg border transition-all',
                        defaultSendChannel === ch.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      {defaultSendChannel === ch.value && (
                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <IconCheck className="w-2.5 h-2.5 text-primary-foreground" />
                        </span>
                      )}
                      <p className="text-sm font-medium mb-1">{ch.label}</p>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ch.desc}</p>
                      <ul className="space-y-1">
                        {ch.features.map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Auto send toggle */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md border bg-background mt-0.5">
                    <IconZap className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Envio automático de faturas</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recomendado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-md">
                      Faturas enviadas automaticamente após emissão, pelo canal configurado acima.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoSendInvoice}
                  onCheckedChange={setAutoSendInvoice}
                  className="shrink-0 mt-0.5"
                />
              </div>

              {/* API notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 flex gap-3">
                <IconServer className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-800">Configuração de API necessária</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    O sistema está em modo de simulação. Para ativar o envio real via WhatsApp e SMS,
                    configure as credenciais do MessageBird nas variáveis de ambiente.
                  </p>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-amber-300 bg-white hover:bg-amber-50 text-amber-800 mt-1">
                    <IconExternal className="w-3 h-3" />
                    Ver documentação
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <IconActivity className="w-4 h-4" />
                  Histórico de envios
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Registo de todas as comunicações enviadas</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
                <IconRefresh className="w-3.5 h-3.5" />
                Atualizar
              </Button>
            </div>
            <div className="p-6">
              <SendHistoryList limit={10} />
            </div>
          </div>
        </TabsContent>

        {/* ── Legal ── */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="px-6 py-4 border-b">
              <h2 className="text-sm font-semibold">Base Legal e Regulamentar</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Legislação fiscal angolana de referência</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                {
                  title: 'Decreto Presidencial n.º 71/25',
                  sub: 'Regulamento de Faturação Eletrónica',
                  desc: 'Regras e procedimentos para emissão de faturas eletrónicas em Angola, incluindo requisitos técnicos, obrigações fiscais e prazos.',
                  year: '2025',
                  Icon: IconShield,
                },
                {
                  title: 'Decreto Executivo n.º 312/18',
                  sub: 'Requisitos Técnicos de Software de Faturação',
                  desc: 'Especificações técnicas obrigatórias: assinatura digital RSA-SHA256, hash de validação e integração com sistemas da AGT.',
                  year: '2018',
                  Icon: IconKey,
                },
                {
                  title: 'Norma SAF-T (AO)',
                  sub: 'Standard Audit File for Tax — Angola',
                  desc: 'Formato normalizado para exportação de dados contabilísticos e fiscais para auditoria digital pela AGT.',
                  year: 'Atual',
                  Icon: IconDatabase,
                },
                {
                  title: 'Código do IVA — Lei n.º 7/19',
                  sub: 'Imposto sobre o Valor Acrescentado',
                  desc: 'Regulamenta o IVA em Angola: 14% (normal), 7% (reduzida), 5% (intermédia), 2% (mínima) e 0% (isento).',
                  year: '2019',
                  Icon: IconScale,
                },
                {
                  title: 'Código Geral Tributário — Lei n.º 21/14',
                  sub: 'Princípios gerais do sistema tributário',
                  desc: 'Obrigações dos contribuintes, prazos de conservação de documentos fiscais (mínimo 5 anos) e procedimentos de fiscalização.',
                  year: '2014',
                  Icon: IconBook,
                },
                {
                  title: 'Decreto Presidencial n.º 292/18',
                  sub: 'Regime Jurídico das Faturas e Documentos Equivalentes',
                  desc: 'Requisitos legais para emissão de faturas, notas de crédito e proformas, incluindo numeração sequencial obrigatória.',
                  year: '2018',
                  Icon: IconFile,
                },
              ].map((doc, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors group">
                  <div className="p-2 rounded-md border bg-background shrink-0">
                    <doc.Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium leading-snug">{doc.title}</p>
                        <p className="text-xs text-primary mt-0.5">{doc.sub}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{doc.year}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{doc.desc}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 mt-2 px-2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open('https://www.agt.minfin.gov.ao', '_blank')}
                    >
                      <IconExternal className="w-3 h-3" />
                      Consultar na AGT
                    </Button>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              {/* Compliance badge */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 flex gap-3">
                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-800">Sistema certificado e em conformidade</p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Software desenvolvido em conformidade com a legislação fiscal angolana vigente.
                    Suporte para SAF-T (AO), assinatura digital RSA-SHA256 e integração com a AGT.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['SAF-T (AO)', 'RSA-SHA256', 'IVA', 'AGT', 'CIVA'].map((tag) => (
                      <span key={tag} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}