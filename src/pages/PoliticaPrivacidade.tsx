import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoFaktura from '@/assets/faktura-logo.png';

export default function PoliticaPrivacidade() {
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
        <h1 className="text-4xl font-black tracking-tight mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-10">Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Introdução</h2>
            <p>A Faktura Angola compromete-se a proteger a privacidade e os dados pessoais dos seus utilizadores, em conformidade com a legislação angolana sobre protecção de dados pessoais (Lei n.º 22/11, de 17 de Junho).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Dados Recolhidos</h2>
            <p>Recolhemos os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de identificação:</strong> nome, email, telefone, NIF da empresa;</li>
              <li><strong>Dados fiscais:</strong> informações da empresa, endereço, actividade comercial;</li>
              <li><strong>Dados de faturação:</strong> faturas emitidas, valores, clientes e produtos;</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, logs de acesso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. Finalidade do Tratamento</h2>
            <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestação do serviço de faturação electrónica;</li>
              <li>Cumprimento de obrigações legais e fiscais;</li>
              <li>Comunicações sobre o serviço e actualizações;</li>
              <li>Melhoria contínua da Plataforma;</li>
              <li>Prevenção de fraude e segurança.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Partilha de Dados</h2>
            <p>Os dados pessoais não são vendidos a terceiros. Poderão ser partilhados com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Autoridades fiscais (AGT) quando legalmente exigido;</li>
              <li>Prestadores de serviços essenciais (alojamento, envio de emails);</li>
              <li>Autoridades judiciais mediante ordem do tribunal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Segurança dos Dados</h2>
            <p>Implementamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda ou destruição, incluindo encriptação, controlo de acesso e monitorização contínua.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Retenção de Dados</h2>
            <p>Os dados fiscais são conservados durante o período mínimo exigido pela legislação angolana (10 anos para documentos fiscais). Os dados da conta são mantidos enquanto a conta estiver activa e durante 1 ano após o encerramento.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Direitos do Utilizador</h2>
            <p>O Utilizador tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aceder aos seus dados pessoais;</li>
              <li>Rectificar dados incorrectos ou desactualizados;</li>
              <li>Solicitar a eliminação dos dados (sujeito a obrigações legais);</li>
              <li>Opor-se ao tratamento para fins de marketing;</li>
              <li>Portabilidade dos dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Cookies</h2>
            <p>A Plataforma utiliza cookies essenciais para o funcionamento do serviço e cookies analíticos para melhorar a experiência do utilizador. Os cookies podem ser geridos nas definições do navegador.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Contacto</h2>
            <p>Para questões relacionadas com a privacidade dos seus dados, contacte-nos através do email: <a href="mailto:privacidade@faktura.ao" className="text-primary font-medium hover:underline">privacidade@faktura.ao</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
