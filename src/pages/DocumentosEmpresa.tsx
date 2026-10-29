import { MainLayout } from '@/components/layout/MainLayout';
import { DocumentosAdicionais } from '@/components/saft/DocumentosAdicionais';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Landmark, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentosEmpresa() {
  return (
    <MainLayout
      title="Documentos da empresa"
      description="Reúne os documentos complementares necessários para a avaliação do pedido de crédito."
    >
      <div className="space-y-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">A certidão de não dívida da AGT é obrigatória para submeter um pedido de crédito.</p>
            </div>
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">O IBAN da empresa também é necessário para preparar o pedido.</p>
            </div>
            <Link to="/empresa" className="flex items-start gap-3 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Adicionar ou actualizar os dados da empresa</span>
            </Link>
          </CardContent>
        </Card>
        <DocumentosAdicionais />
      </div>
    </MainLayout>
  );
}
