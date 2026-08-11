import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoPapel from '@/assets/faktura-logo.png';

export default function TermosDeUso() {
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
        <h1 className="text-4xl font-black tracking-tight mb-2">Termos de Uso e Política da Plataforma</h1>
        <p className="text-muted-foreground mb-10">Última actualização: {new Date().toLocaleDateString('pt-AO')}</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Aceitação</h2>
            <p>Ao aceder à plataforma Papel ("Plataforma"), operada pela Faktura Angola, Lda (NIF 5002964031), o utilizador aceita os presentes Termos. Caso não concorde, deve cessar a utilização.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Natureza do serviço</h2>
            <p>
              A Papel é uma plataforma de <strong>originação de crédito</strong>: valida ficheiros SAF-T (AO),
              calcula o Papel Score e apresenta dossiers a instituições financeiras parceiras. A Papel
              <strong> não é uma instituição financeira</strong>, não capta depósitos, não concede crédito e não
              garante a aprovação de qualquer pedido. A decisão é exclusiva do banco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. Perfis de utilizador</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Particular</strong> — simulação e acompanhamento do perfil financeiro;</li>
              <li><strong>Pessoa colectiva (PME)</strong> — envio de SAF-T, score e pedidos de capital;</li>
              <li><strong>Banco / financiador</strong> — análise de dossiers e decisões de crédito;</li>
              <li><strong>Seguradora</strong> — distribuição de produtos de seguro às PMEs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Obrigações do utilizador</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestar informação verdadeira, completa e actualizada;</li>
              <li>Enviar apenas ficheiros SAF-T e documentos de que é titular legítimo;</li>
              <li>Manter a confidencialidade das credenciais de acesso;</li>
              <li>Não utilizar a Plataforma para fins ilícitos, fraudulentos ou de branqueamento de capitais;</li>
              <li>Cumprir as suas obrigações fiscais junto da AGT.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Papel Score</h2>
            <p>
              O Papel Score é um indicador informativo, calculado a partir do histórico de facturação declarado no
              SAF-T. Não constitui aconselhamento financeiro nem promessa de financiamento, e pode variar sempre que
              novos ficheiros forem submetidos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Consentimento para partilha</h2>
            <p>Ao submeter um pedido de crédito, o utilizador autoriza expressamente a partilha do seu dossier (dados da empresa, SAF-T, score e documentos adicionais) com a instituição financeira escolhida. O consentimento pode ser retirado antes da decisão.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Obrigações do banco parceiro</h2>
            <p>As instituições parceiras comprometem-se a usar os dados exclusivamente para avaliação do pedido, a manter sigilo bancário e a registar cada decisão e desembolso no trilho de auditoria da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Modo visitante</h2>
            <p>O modo visitante permite explorar a Plataforma sem conta. Os dados ficam apenas no dispositivo e são apagados ao fim de 2 horas. Não gera pedidos reais de crédito.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Propriedade intelectual</h2>
            <p>O software, marca, design e metodologia de scoring pertencem à Faktura Angola, Lda. É proibida a cópia, engenharia inversa ou redistribuição sem autorização escrita.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">10. Limitação de responsabilidade</h2>
            <p>A Papel não responde por decisões de crédito das instituições parceiras, por dados incorrectos fornecidos pelo utilizador, nem por prejuízos indirectos resultantes de indisponibilidade temporária do serviço.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">11. Suspensão de contas</h2>
            <p>Podemos suspender ou encerrar contas que violem estes Termos, apresentem indícios de fraude documental ou incumpram a legislação aplicável.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">12. Alterações e lei aplicável</h2>
            <p>Os Termos podem ser alterados, com aviso na Plataforma e entrada em vigor 30 dias após a publicação. Aplica-se a lei da República de Angola, sendo competentes os tribunais de Luanda.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
