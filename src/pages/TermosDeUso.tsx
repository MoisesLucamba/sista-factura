import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFaktura} alt="Faktura" className="h-9 object-contain" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-10">Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Aceitação dos Termos</h2>
            <p>Ao aceder e utilizar a plataforma Faktura Angola ("Plataforma"), o utilizador ("Utilizador") concorda com os presentes Termos de Uso. Caso não concorde, deverá cessar imediatamente a utilização da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Descrição do Serviço</h2>
            <p>A Faktura Angola é uma plataforma de faturação electrónica destinada a empresas e profissionais em Angola. O serviço permite a emissão de faturas, faturas-recibo, notas de crédito, recibos e faturas proforma em conformidade com a legislação angolana e as normas da Administração Geral Tributária (AGT).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. Registo e Conta</h2>
            <p>O Utilizador compromete-se a fornecer informações verdadeiras, completas e actualizadas aquando do registo. É responsável pela confidencialidade das suas credenciais de acesso e por todas as actividades realizadas na sua conta.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Obrigações do Utilizador</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilizar a Plataforma de acordo com a legislação angolana em vigor;</li>
              <li>Manter actualizados os dados fiscais da empresa (NIF, endereço, etc.);</li>
              <li>Não utilizar o serviço para fins ilícitos ou fraudulentos;</li>
              <li>Garantir a veracidade dos dados inseridos nas faturas emitidas;</li>
              <li>Cumprir as obrigações fiscais junto da AGT.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Conformidade Fiscal</h2>
            <p>A Plataforma gera documentos fiscais com numeração sequencial, assinatura digital e códigos QR conforme exigido pela AGT. O Utilizador é o único responsável pela correcta utilização dos documentos emitidos e pelo cumprimento das suas obrigações fiscais.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Propriedade Intelectual</h2>
            <p>Todos os direitos de propriedade intelectual relativos à Plataforma, incluindo software, design, logótipos e conteúdos, pertencem à Faktura Angola. O Utilizador não pode copiar, modificar ou distribuir qualquer parte da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Planos e Pagamentos</h2>
            <p>A Plataforma oferece diferentes planos de subscrição. Os pagamentos são processados mensalmente em Kwanzas (AOA). O não pagamento pode resultar na suspensão do acesso às funcionalidades premium.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>A Faktura Angola não se responsabiliza por danos directos ou indirectos resultantes da utilização da Plataforma, incluindo perda de dados, interrupções de serviço ou erros nos documentos emitidos pelo Utilizador.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Modificações dos Termos</h2>
            <p>A Faktura Angola reserva-se o direito de modificar estes Termos a qualquer momento. As alterações serão comunicadas através da Plataforma e entrarão em vigor 30 dias após a publicação.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">10. Lei Aplicável</h2>
            <p>Os presentes Termos são regidos pela legislação da República de Angola. Qualquer litígio será submetido aos tribunais competentes de Luanda.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
