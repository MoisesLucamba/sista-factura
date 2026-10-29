import { LegalLayout } from '@/components/legal/LegalLayout';
import { termos } from '@/lib/legal/termos';

export default function TermosDeUso() {
  return (
    <LegalLayout title="Termos e Condições" sections={termos} otherPath="/privacidade" otherLabel="Política de Privacidade" />
  );
}
