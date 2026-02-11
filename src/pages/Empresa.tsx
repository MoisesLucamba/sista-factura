import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, Save, Upload, MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Empresa() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Dados da empresa guardados com sucesso');
    }, 1000);
  };

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
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <Building2 className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Carregar Logo</Button>
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
                <Input placeholder="Minha Empresa, Lda" />
              </div>
              <div className="space-y-2">
                <Label>NIF</Label>
                <Input placeholder="5000000000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Actividade Comercial</Label>
              <Input placeholder="Comércio geral, prestação de serviços..." />
            </div>
            <div className="space-y-2">
              <Label>Alvará Comercial</Label>
              <Input placeholder="Nº do alvará" />
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
                <Input placeholder="+244 923 000 000" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                <Input placeholder="geral@empresa.ao" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</Label>
              <Input placeholder="https://www.empresa.ao" />
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
              <Textarea placeholder="Rua, número, bairro..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input placeholder="Luanda" />
              </div>
              <div className="space-y-2">
                <Label>Província</Label>
                <Input placeholder="Luanda" />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input defaultValue="Angola" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
