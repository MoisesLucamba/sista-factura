import type { LegalSection } from './types';

export const TERMOS_VERSION = '2026-10-29-v1';

export const termos: LegalSection[] = [
  {
    id: 'quem-somos',
    title: 'Quem somos e aceitação',
    blocks: [
      { kind: 'paragraph', text: 'O Giro é uma plataforma operada pela Faktura Angola, Lda, NIF 5002964031, com sede em Luanda, Angola. Contacta-nos através de geral@faktura.ao.' },
      { kind: 'paragraph', text: 'Ao criares uma conta ou usares o Giro, confirmas que leste e aceitas estes Termos e a Política de Privacidade. Se não concordares, não uses as funcionalidades que exigem conta.' },
    ],
  },
  {
    id: 'definicoes',
    title: 'Definições',
    blocks: [{ kind: 'list', items: [
      'Giro: plataforma de análise de dados de faturação e preparação de dossiers de crédito.',
      'Utilizador: pessoa singular que usa o Giro, por conta própria ou em representação de uma Empresa.',
      'Empresa: PME ou outra entidade cujos dados são submetidos por um representante autorizado.',
      'Banco parceiro: instituição financeira autorizada pelo BNA que recebe um dossier escolhido pelo Utilizador.',
      'SAF-T (AO): ficheiro de auditoria fiscal exportado pelo software de faturação da Empresa.',
      'Score: indicador informativo de 0 a 1000 calculado a partir dos dados disponíveis.',
      'Dossier: resumo dos dados, validações e resultados de análise preparado para avaliação por um Banco parceiro.',
    ] }],
  },
  {
    id: 'natureza-servico',
    title: 'O que o Giro é e o que não é',
    blocks: [
      { kind: 'paragraph', text: 'O Giro analisa o histórico de faturação, gera um Score e prepara um Dossier que podes escolher apresentar a bancos parceiros.' },
      { kind: 'paragraph', text: 'O Giro não é uma instituição financeira e não concede crédito. A concessão de crédito é reservada a instituições autorizadas pelo BNA, nos termos da Lei n.º 14/21, Regime Geral das Instituições Financeiras. O dinheiro do crédito não passa pelo Giro.' },
      { kind: 'paragraph', text: 'O Giro não garante aprovação, montante, prazo ou taxa. O simulador apresenta valores meramente indicativos.' },
    ],
  },
  {
    id: 'conta-elegibilidade',
    title: 'Conta e elegibilidade',
    blocks: [
      { kind: 'paragraph', text: 'Para criares uma conta tens de ter pelo menos 18 anos. Se registares uma Empresa, tens de poder representá-la legalmente. O acesso é feito com email ou telefone e palavra-passe.' },
      { kind: 'list', items: [
        'Mantém os teus dados verdadeiros, completos e actualizados.',
        'Guarda as tuas credenciais e avisa-nos se suspeitares de acesso não autorizado.',
        'És responsável pelas actividades feitas com a tua conta até comunicares uma suspeita de acesso indevido.',
      ] },
    ],
  },
  {
    id: 'saft-e-consentimento',
    title: 'Envio do SAF-T e consentimento',
    blocks: [
      { kind: 'paragraph', text: 'Ao enviares um ficheiro SAF-T (AO), pedimos o teu consentimento expresso para ler e analisar os dados necessários à validação e preparação do Score e do Dossier. O fluxo actual lê o XML no teu dispositivo e envia ao Giro campos extraídos e resultados da validação.' },
      { kind: 'paragraph', text: '[CONFIRMAR: com a equipa técnica, que dados extraídos são enviados aos servidores e que dados ficam apenas no dispositivo antes de publicar estes Termos.]' },
      { kind: 'paragraph', text: 'A autorização para analisar o ficheiro não autoriza a partilha do Dossier. Pedimos uma autorização separada, expressa e identificada para cada Banco parceiro antes de qualquer partilha.' },
      { kind: 'paragraph', text: 'O tratamento de dados de clientes e fornecedores que apareçam no SAF-T depende de teres legitimidade para os enviar. Consulta a Política de Privacidade.' },
    ],
  },
  {
    id: 'score-dossier',
    title: 'Score e Dossier',
    blocks: [
      { kind: 'paragraph', text: 'O Giro valida a estrutura do SAF-T, o hash, as assinaturas digitais e a correspondência do NIF segundo as regras aplicáveis da AGT. A análise considera volume, consistência, crescimento e conformidade fiscal.' },
      { kind: 'paragraph', text: 'O Score é gerado de forma automatizada, pode mudar quando os dados mudam e é apenas informativo. Não é uma decisão de crédito nem uma recomendação de aprovação.' },
      { kind: 'paragraph', text: 'Podes pedir a revisão do Score ou dos dados usados escrevendo para geral@faktura.ao. Prazo de resposta: [A PREENCHER: prazo de resposta a pedidos de revisão].' },
    ],
  },
  {
    id: 'bancos-e-pedidos',
    title: 'Bancos parceiros e pedidos de crédito',
    blocks: [
      { kind: 'paragraph', text: 'Só partilhamos o Dossier com o Banco parceiro que escolheres e depois de confirmares essa partilha. Podes desistir antes de autorizar o envio.' },
      { kind: 'paragraph', text: 'O Banco avalia o pedido, decide, celebra o contrato e, se aprovar, desembolsa o crédito. As condições, taxas, prazos e garantias são definidos pelo Banco. Qualquer decisão de crédito é do Banco e tem intervenção humana do Banco.' },
      { kind: 'paragraph', text: 'Podes retirar o consentimento para partilhas futuras. A retirada não desfaz um envio já feito nem elimina cópias que o Banco tenha de conservar por obrigação própria.' },
    ],
  },
  {
    id: 'garantia-publica',
    title: 'Garantia pública (FGC)',
    blocks: [{ kind: 'paragraph', text: 'O Giro pode apoiar a preparação de um pedido de garantia pública ao Fundo de Garantia de Crédito (FGC). Quem apresenta o pedido é o Banco; a decisão cabe ao Banco e ao FGC. O Giro não garante a emissão da garantia.' }],
  },
  {
    id: 'comissoes',
    title: 'Comissões e preços',
    blocks: [
      { kind: 'paragraph', text: 'O Giro pode receber comissões de um Banco parceiro e, em certos casos, uma comissão paga pela Empresa quando o crédito é desembolsado. Os valores, quem paga e quando paga serão apresentados antes de assumires qualquer compromisso.' },
      { kind: 'paragraph', text: 'Consulta a Tabela de comissões: [A PREENCHER: publicar link e valores da Tabela de comissões]. Não assumas qualquer comissão que não esteja indicada nessa tabela e no resumo apresentado antes do pedido.' },
      { kind: 'paragraph', text: '[CONFIRMAR: percentagens, pagador, momento de cobrança e tratamento da comissão no custo total do crédito, incluindo validação jurídica e do BNA face ao Aviso n.º 10/2022.]' },
    ],
  },
  {
    id: 'obrigacoes',
    title: 'Obrigações do Utilizador',
    blocks: [{ kind: 'list', items: [
      'Fornece dados verdadeiros e actualizados e corrige erros quando os detectares.',
      'Envia apenas ficheiros que tens direito de usar e partilhar.',
      'Não carregues dados de terceiros sem a autorização ou outro fundamento legítimo necessário.',
      'Protege as tuas credenciais e usa o Giro apenas para fins legais.',
    ] }],
  },
  {
    id: 'uso-aceitavel',
    title: 'Uso aceitável e proibições',
    blocks: [{ kind: 'list', items: [
      'Não uses o Giro para fraude, falsificação, branqueamento ou para prejudicar terceiros.',
      'Não manipules, falsifiques ou apresentes como autêntico um SAF-T alterado.',
      'Não faças engenharia inversa, não contornes controlos de acesso e não explores falhas.',
      'Não uses a API de forma abusiva, automatizada ou fora das integrações autorizadas.',
    ] }],
  },
  {
    id: 'propriedade-intelectual',
    title: 'Propriedade intelectual',
    blocks: [{ kind: 'paragraph', text: 'A marca Giro, o logótipo, o software e os materiais da plataforma pertencem à Faktura Angola, Lda ou são usados com autorização. Damos-te uma licença limitada, pessoal, não exclusiva e revogável para usar o Giro conforme estes Termos. Não podes copiar, distribuir ou explorar os materiais sem autorização.' }],
  },
  {
    id: 'disponibilidade-responsabilidade',
    title: 'Disponibilidade, simulador e responsabilidade',
    blocks: [
      { kind: 'paragraph', text: 'Podem ocorrer interrupções, erros ou atrasos. O simulador é indicativo e o Score depende dos dados submetidos; o Giro não garante resultados nem disponibilidade sem interrupção.' },
      { kind: 'paragraph', text: 'O Giro não responde pelas decisões, condições, contratos ou desembolsos dos Bancos parceiros. Os limites de responsabilidade serão aplicados nos termos da lei.' },
      { kind: 'paragraph', text: '[CONFIRMAR: limites de responsabilidade e redacção final com advogado antes da publicação.]' },
      { kind: 'paragraph', text: 'O SAF-T e a facturação electrónica são tratados no contexto do Decreto Presidencial n.º 71/25, Regime Jurídico das Facturas. O apoio às PME enquadra-se, como contexto, na Lei n.º 30/11, Lei das MPME, e no Aviso n.º 10/2022 do BNA, relativo ao crédito ao sector real.' },
    ],
  },
  {
    id: 'suspensao-encerramento',
    title: 'Suspensão e encerramento da conta',
    blocks: [
      { kind: 'paragraph', text: 'Podemos suspender o acesso se houver incumprimento destes Termos, suspeita de fraude ou risco para a segurança. Sempre que possível, informamos-te e explicamos como contestar.' },
      { kind: 'paragraph', text: 'Podes pedir o encerramento da conta a qualquer momento através de geral@faktura.ao. O destino e os prazos de conservação dos dados após o encerramento seguem a Política de Privacidade: [CONFIRMAR: prazos e procedimento de eliminação].' },
    ],
  },
  {
    id: 'alteracoes',
    title: 'Alterações aos Termos',
    blocks: [{ kind: 'paragraph', text: 'Podemos actualizar estes Termos. Avisamos por email e no site, com a data de entrada em vigor. Se a alteração exigir novo consentimento, voltamos a pedi-lo antes de continuar o tratamento correspondente.' }],
  },
  {
    id: 'lei-e-litigios',
    title: 'Lei aplicável e resolução de litígios',
    blocks: [
      { kind: 'paragraph', text: 'Estes Termos são regidos pela lei da República de Angola. Antes de recorrer a tribunal, contacta-nos para tentarmos resolver a questão.' },
      { kind: 'paragraph', text: '[CONFIRMAR: foro de Luanda e redacção desta cláusula com advogado.]' },
    ],
  },
  {
    id: 'contactos',
    title: 'Contactos',
    blocks: [{ kind: 'paragraph', text: 'Faktura Angola, Lda · NIF 5002964031 · Luanda, Angola · geral@faktura.ao' }],
  },
];
