import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, Upload, MapPin, Phone, Mail, Globe, FileText, Loader2, Trash2 } from 'lucide-react';
import { useAgtConfig, useCreateOrUpdateAgtConfig } from '@/hooks/useAgtConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EmpresaForm {
  nome_empresa: string;
  nif_produtor: string;
  actividade_comercial: string;
  alvara_comercial: string;
  telefone: string;
  email: string;
  website: string;
  morada: string;
  endereco_empresa: string;
  cidade: string;
  provincia: string;
  logo_url: string;
}

const emptyForm: EmpresaForm = {
  nome_empresa: '', nif_produtor: '', actividade_comercial: '', alvara_comercial: '',
  telefone: '', email: '', website: '', morada: '', endereco_empresa: '', cidade: '', provincia: '', logo_url: '',
};

export default function Empresa() {
  const { data: config, isLoading } = useAgtConfig();
  const mutation = useCreateOrUpdateAgtConfig();
  const { user } = useAuth();
  const [form, setForm] = useState<EmpresaForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setForm({
        nome_empresa: config.nome_empresa || '',
        nif_produtor: config.nif_produtor || '',
        actividade_comercial: config.actividade_comercial || '',
        alvara_comercial: config.alvara_comercial || '',
        telefone: config.telefone || '',
        email: config.email || '',
        website: config.website || '',
        morada: config.morada || '',
        endereco_empresa: config.endereco_empresa || '',
        cidade: config.cidade || '',
        provincia: config.provincia || '',
        logo_url: config.logo_url || '',
      });
    }
  }, [config]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O ficheiro deve ter no máximo 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato não suportado. Use PNG, JPG ou SVG.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logótipo carregado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao carregar logótipo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logo_url: '' }));
  };

  const handleSave = () => {
    mutation.mutate({
      nome_empresa: form.nome_empresa,
      nif_produtor: form.nif_produtor,
      endereco_empresa: form.endereco_empresa,
      actividade_comercial: form.actividade_comercial,
      alvara_comercial: form.alvara_comercial,
      telefone: form.telefone,
      email: form.email,
      website: form.website,
      morada: form.morada,
      cidade: form.cidade,
      provincia: form.provincia,
      logo_url: form.logo_url,
    });
  };

  const set = (key: keyof EmpresaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (isLoading) {
    return (
      <MainLayout title="Dados da Empresa" description="Configurar informações da empresa">
        <div className="space-y-6 max-w-3xl">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dados da Empresa" description="Configurar informações da empresa">
      <div className="space-y-6 max-w-3xl">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Logotipo</CardTitle>
            <CardDescription>O logotipo aparece nas facturas e documentos emitidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30 overflow-hidden">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo da empresa" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'A carregar...' : 'Carregar Logo'}
                  </Button>
                  {form.logo_url && (
                    <Button variant="outline" size="icon" onClick={handleRemoveLogo}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx 2MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={form.nome_empresa} onChange={set('nome_empresa')} placeholder="Minha Empresa, Lda" />
              </div>
              <div className="space-y-2">
                <Label>NIF</Label>
                <Input value={form.nif_produtor} onChange={set('nif_produtor')} placeholder="5000000000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Actividade Comercial</Label>
              <Input value={form.actividade_comercial} onChange={set('actividade_comercial')} placeholder="Comércio geral, prestação de serviços..." />
            </div>
            <div className="space-y-2">
              <Label>Alvará Comercial</Label>
              <Input value={form.alvara_comercial} onChange={set('alvara_comercial')} placeholder="Nº do alvará" />
            </div>
          </CardContent>
        </Card>

        {/* Contactos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" /> Contactos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
                <Input value={form.telefone} onChange={set('telefone')} placeholder="+244 923 000 000" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                <Input value={form.email} onChange={set('email')} placeholder="geral@empresa.ao" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</Label>
              <Input value={form.website} onChange={set('website')} placeholder="https://www.empresa.ao" />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Morada</Label>
              <Textarea value={form.morada} onChange={set('morada')} placeholder="Rua, número, bairro..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={set('cidade')} placeholder="Luanda" />
              </div>
              <div className="space-y-2">
                <Label>Província</Label>
                <Input value={form.provincia} onChange={set('provincia')} placeholder="Luanda" />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input defaultValue="Angola" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
