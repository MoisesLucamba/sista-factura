import { LegalLayout } from '@/components/legal/LegalLayout';
import { privacidade } from '@/lib/legal/privacidade';

export default function PoliticaPrivacidade() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      sections={privacidade}
      otherPath="/termos"
      otherLabel="Termos e Condições"
    />
  );
}
