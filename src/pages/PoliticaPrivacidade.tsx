import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoPapel from '@/assets/faktura-logo.png';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPapel} alt="Papel" className="h-9 object-contain" />
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
        <p className="text-muted-foreground mb-10">
          Última actualização: {new Date().toLocaleDateString('pt-AO')} · Lei n.º 22/11, de 17 de Junho
          (Protecção de Dados Pessoais)
        </p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Responsável pelo tratamento</h2>
            <p>
              A Papel é um serviço operado pela <strong>Faktura Angola, Lda</strong>, NIF 5002964031, com sede em
              Luanda, Angola. Para qualquer questão relativa a dados pessoais, contacta{' '}
              <a href="mailto:privacidade@faktura.ao" className="text-primary font-medium hover:underline">privacidade@faktura.ao</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. O que é a Papel</h2>
            <p>
              A Papel é uma plataforma de <strong>originação de crédito</strong>. Recolhe e valida dados fiscais
              da empresa (SAF-T (AO) e documentos de suporte), calcula um indicador de risco — o Papel Score — e,
              com autorização expressa do utilizador, apresenta o dossier a instituições financeiras parceiras.
              A Papel <strong>não é uma instituição financeira</strong> e não concede crédito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. Dados recolhidos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identificação:</strong> nome, BI/NIF, email, telemóvel, morada, cargo do responsável;</li>
              <li><strong>Dados da empresa:</strong> denominação, NIF, sector, sede, IBAN e banco;</li>
              <li><strong>Dados fiscais e financeiros:</strong> ficheiros SAF-T (AO), volume de facturação, produtos, Modelo 7, Modelo 1, certidão fiscal, extractos bancários, alvará e facturas de fornecedores;</li>
              <li><strong>Dados de crédito:</strong> pedidos submetidos, Papel Score, decisões dos bancos e desembolsos;</li>
              <li><strong>Dados técnicos:</strong> endereço IP, dispositivo, navegador e registos de acesso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Finalidades e fundamento legal</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Execução do serviço solicitado — validação do SAF-T e cálculo do Papel Score (execução de contrato);</li>
              <li>Envio do dossier a bancos e seguradoras parceiras (consentimento expresso, dado no momento do pedido);</li>
              <li>Prevenção de fraude, segurança e auditoria (interesse legítimo);</li>
              <li>Cumprimento de obrigações legais, fiscais e de supervisão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Partilha de dados</h2>
            <p>Os dados não são vendidos. Podem ser partilhados com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bancos e financiadores parceiros escolhidos pelo utilizador ao submeter um pedido de crédito;</li>
              <li>Seguradoras parceiras, apenas quando é pedido um seguro;</li>
              <li>Autoridades (AGT, BNA, tribunais) quando legalmente exigido;</li>
              <li>Prestadores de infra-estrutura (alojamento, envio de email), sujeitos a dever de confidencialidade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Segurança</h2>
            <p>
              Os ficheiros SAF-T e documentos adicionais são guardados em armazenamento privado, com políticas de
              acesso ao nível da linha: cada utilizador só acede aos seus próprios ficheiros; os bancos acedem apenas
              aos dossiers que lhes foram submetidos. Todas as ligações são cifradas (TLS) e as decisões e
              desembolsos ficam registados num trilho de auditoria imutável.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Conservação</h2>
            <p>
              Os dados fiscais são conservados pelo prazo legal aplicável em Angola (até 10 anos). Os registos de
              crédito e auditoria são mantidos durante 10 anos após a última operação. Os dados de conta são
              eliminados até 1 ano após o encerramento, salvo obrigação legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Direitos do titular</h2>
            <p>Nos termos da Lei n.º 22/11, tens direito a aceder, rectificar, apagar, limitar ou opor-te ao tratamento dos teus dados, bem como à portabilidade e à retirada do consentimento a qualquer momento (sem efeito retroactivo sobre pedidos já submetidos a bancos). Podes ainda apresentar reclamação à Agência de Protecção de Dados (APD).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Decisões automatizadas</h2>
            <p>
              O Papel Score é calculado automaticamente a partir do histórico de facturação. Não constitui, por si só,
              uma decisão de crédito: a decisão final é sempre tomada por um analista da instituição financeira. Podes
              pedir a revisão humana do teu dossier em qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">10. Cookies</h2>
            <p>Utilizamos cookies essenciais à sessão e cookies analíticos para medir a utilização da plataforma. Podes geri-los nas definições do navegador. O modo visitante guarda dados apenas no teu dispositivo e é apagado ao fim de 2 horas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">11. Contacto</h2>
            <p>
              Faktura Angola, Lda · NIF 5002964031 · Luanda, Angola ·{' '}
              <a href="mailto:privacidade@faktura.ao" className="text-primary font-medium hover:underline">privacidade@faktura.ao</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
