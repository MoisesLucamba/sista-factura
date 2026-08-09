import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpresa, useSaveEmpresa } from '@/hooks/useCredito';
import { Building2, Loader2, Save } from 'lucide-react';

export default function MinhaEmpresa() {
  const { data: empresa, isLoading } = useEmpresa();
  const save = useSaveEmpresa();

  const [form, setForm] = useState({
    nome: '', nif: '', email: '', telefone: '', endereco: '',
    software_certificado: '', software_cert_number: '',
    iban: '', banco: '',
  });

  useEffect(() => {
    if (empresa) {
      setForm({
        nome: empresa.nome ?? '',
        nif: empresa.nif ?? '',
        email: empresa.email ?? '',
        telefone: empresa.telefone ?? '',
        endereco: empresa.endereco ?? '',
        software_certificado: empresa.software_certificado ?? '',
        software_cert_number: empresa.software_cert_number ?? '',
        iban: empresa.iban ?? '',
        banco: empresa.banco ?? '',
      });
    }
  }, [empresa]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !/^\d{9,14}$/.test(form.nif.replace(/\D/g, ''))) return;
    save.mutate(form);
  };

  return (
    <MainLayout
      title="A minha empresa"
      description="Os dados que validam os teus ficheiros SAF-T e acompanham cada pedido de crédito."
      loading={isLoading}
      maxWidth="xl"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Dados da empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome da empresa *</Label>
                <Input value={form.nome} onChange={set('nome')} required />
              </div>
              <div className="space-y-2">
                <Label>NIF *</Label>
                <Input value={form.nif} onChange={set('nif')} inputMode="numeric" required
                       placeholder="5000000000" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={set('telefone')} placeholder="+244 9XX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={set('endereco')} />
              </div>
              <div className="space-y-2">
                <Label>Software de faturação</Label>
                <Input value={form.software_certificado} onChange={set('software_certificado')}
                       placeholder="Ex.: PHC, Primavera, SAGE" />
              </div>
              <div className="space-y-2">
                <Label>Nº certificado AGT do software</Label>
                <Input value={form.software_cert_number} onChange={set('software_cert_number')}
                       placeholder="n31.1/AGT20" />
              </div>
              <div className="space-y-2">
                <Label>Banco da empresa</Label>
                <Input value={form.banco} onChange={set('banco')}
                       placeholder="Ex.: BAI, BFA, BIC, Standard Bank" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={set('iban')}
                       placeholder="AO06 0000 0000 0000 0000 0000 0" />
              </div>
            </div>

            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
