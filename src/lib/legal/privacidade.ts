import type { LegalSection } from './types';

export const PRIVACIDADE_VERSION = '2026-10-29-v1';

export const privacidade: LegalSection[] = [
  {
    id: 'responsavel',
    title: 'Responsável pelo tratamento',
    blocks: [
      { kind: 'paragraph', text: 'A responsável pelo tratamento é a Faktura Angola, Lda, NIF 5002964031, com sede em Luanda, Angola. Para questões sobre dados pessoais, escreve para geral@faktura.ao.' },
      { kind: 'paragraph', text: '[A PREENCHER: nome e contacto do encarregado de protecção de dados, se aplicável.]' },
      { kind: 'paragraph', text: '[CONFIRMAR: estado da autorização/notificação junto da APD antes do lançamento.]' },
    ],
  },
  {
    id: 'dados-recolhidos',
    title: 'Dados que recolhemos',
    blocks: [{ kind: 'table', headers: ['Dado', 'Finalidade', 'Fundamento', 'Prazo de conservação'], rows: [
      ['Identificação e contacto: nome, email, telefone, NIF e cargo.', 'Criar e gerir a conta, confirmar identidade e prestar o serviço.', 'Execução do serviço e consentimento quando pedido.', '[A PREENCHER: prazo por categoria].'],
      ['Dados da empresa: denominação, NIF, morada, sector e representantes.', 'Associar o SAF-T e o Dossier à Empresa e verificar correspondência de NIF.', 'Execução do serviço e obrigações legais aplicáveis.', '[A PREENCHER: prazo por categoria].'],
      ['Dados fiscais e financeiros do SAF-T: facturas, clientes e fornecedores nelas identificados, produtos, impostos e sazonalidade.', 'Validar o ficheiro, analisar a actividade e preparar Score e Dossier.', 'Consentimento expresso para análise e execução do serviço.', '[A PREENCHER: prazo por categoria].'],
      ['Score, Dossier e resultados da análise.', 'Mostrar o resultado ao Utilizador e, mediante autorização separada, ao Banco escolhido.', 'Execução do serviço e consentimento para partilha.', '[A PREENCHER: prazo por categoria].'],
      ['Dados de utilização e técnicos: IP, dispositivo, páginas e cliques.', 'Segurança, funcionamento e, só após consentimento, analítica de utilização.', 'Interesse legítimo para segurança; consentimento para analítica não essencial.', '[A PREENCHER: prazo dos registos técnicos e analíticos].'],
      ['Email da lista de espera.', 'Avisar sobre o lançamento do Giro.', 'Consentimento dado ao subscrever a lista.', 'Até retirar o consentimento ou terminar a finalidade; [CONFIRMAR: prazo máximo].'],
    ] }],
  },
  {
    id: 'dados-terceiros',
    title: 'Dados de clientes e fornecedores no SAF-T',
    blocks: [{ kind: 'paragraph', text: 'O SAF-T pode incluir dados pessoais de clientes, fornecedores e outros contactos da Empresa. A Empresa é responsável por ter legitimidade para enviar esses dados. O Giro usa-os apenas na análise e validação descritas nesta Política e não os usa para fins próprios incompatíveis.' }],
  },
  {
    id: 'finalidades-fundamentos',
    title: 'Finalidades e fundamentos',
    blocks: [{ kind: 'list', items: [
      'Consentimento: análise do SAF-T, partilha de cada Dossier com o Banco escolhido e cookies não essenciais.',
      'Execução do serviço: criar a conta, validar os dados e preparar o Score e o Dossier que pediste.',
      'Obrigações legais: cumprir pedidos que sejam legalmente obrigatórios e manter registos necessários.',
      'Interesse legítimo: proteger contas e sistemas, prevenir abuso e manter registos técnicos essenciais, respeitando os teus direitos.',
    ] }],
  },
  {
    id: 'analise-automatizada',
    title: 'Decisões automatizadas e inteligência artificial',
    blocks: [
      { kind: 'paragraph', text: 'O Giro usa modelos de análise automatizada, incluindo inteligência artificial, para avaliar volume, consistência, crescimento e conformidade fiscal e gerar um Score de 0 a 1000.' },
      { kind: 'paragraph', text: 'O Score é informativo e não decide se recebes crédito. O Banco parceiro avalia o pedido e toma qualquer decisão de crédito com intervenção humana.' },
      { kind: 'paragraph', text: 'Podes pedir informação ou revisão humana da análise através de geral@faktura.ao. Prazo de resposta: [A PREENCHER: prazo de resposta a pedidos de revisão].' },
    ],
  },
  {
    id: 'partilha',
    title: 'Com quem partilhamos os dados',
    blocks: [{ kind: 'list', items: [
      'Bancos parceiros que escolheres, apenas quando pedes crédito e autorizas expressamente a partilha com aquele Banco.',
      'Fornecedores de infraestrutura necessários para operar a plataforma, incluindo Supabase e outros: [A PREENCHER: listar todos os fornecedores e serviços].',
      'Autoridades, quando a lei obrigar ou existir uma ordem válida.',
      'Nunca vendemos os teus dados pessoais.',
    ] }],
  },
  {
    id: 'transferencias',
    title: 'Transferências internacionais',
    blocks: [
      { kind: 'paragraph', text: '[CONFIRMAR: região do projecto Supabase e local de armazenamento dos dados.]' },
      { kind: 'paragraph', text: '[CONFIRMAR: se existem transferências internacionais, países envolvidos e garantias aplicadas antes do lançamento.]' },
    ],
  },
  {
    id: 'conservacao',
    title: 'Conservação e eliminação',
    blocks: [
      { kind: 'paragraph', text: 'Conservamos os dados apenas pelo tempo necessário às finalidades indicadas, às obrigações aplicáveis e à resolução de pedidos ou conflitos.' },
      { kind: 'paragraph', text: '[A PREENCHER: tabela de prazos de conservação por categoria, incluindo contas encerradas, SAF-T, Score, Dossier, consentimentos, logs e lista de espera.]' },
      { kind: 'paragraph', text: 'Podes pedir a eliminação dos teus dados. Alguns registos podem ter de ser mantidos quando uma obrigação legal o exigir; explicamos o fundamento se isso se aplicar.' },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    blocks: [{ kind: 'paragraph', text: 'Usamos cifragem em trânsito e em repouso, controlo de acessos e registos de actividade. Nenhum sistema é completamente seguro; não prometemos segurança absoluta.' }],
  },
  {
    id: 'direitos',
    title: 'Os teus direitos',
    blocks: [
      { kind: 'paragraph', text: 'Nos termos da Lei n.º 22/11, Protecção de Dados Pessoais, podes pedir acesso, rectificação, eliminação, oposição ou limitação do tratamento e retirar o consentimento a qualquer momento. A retirada não afecta o tratamento feito antes dela.' },
      { kind: 'paragraph', text: 'Podes exercer os teus direitos através de geral@faktura.ao. Prazo de resposta: [A PREENCHER: prazo de resposta a pedidos de direitos]. Podes também apresentar reclamação à Agência de Protecção de Dados (APD).' },
    ],
  },
  {
    id: 'cookies-analitica',
    title: 'Cookies e analítica',
    blocks: [
      { kind: 'paragraph', text: 'Usamos armazenamento essencial para guardar a tua escolha de cookies. A analítica de páginas e cliques, incluindo o evento enviado pelo track() do Giro, só é activada depois de aceitares cookies não essenciais. Podes escolher “Aceitar” ou “Recusar não essenciais”.' },
      { kind: 'paragraph', text: '[A PREENCHER: lista de cookies e tecnologias locais, finalidade, duração e fornecedor.]' },
    ],
  },
  {
    id: 'menores',
    title: 'Menores',
    blocks: [{ kind: 'paragraph', text: 'O Giro não se destina a menores de 18 anos e não permite a criação de contas por menores.' }],
  },
  {
    id: 'alteracoes',
    title: 'Alterações e histórico de versões',
    blocks: [
      { kind: 'paragraph', text: 'Podemos actualizar esta Política. Publicamos a nova versão no site, indicamos a data de entrada em vigor e avisamos por email quando a alteração for relevante.' },
      { kind: 'list', items: ['29/10/2026 · Versão 2026-10-29-v1 · Primeira versão para revisão.'] },
    ],
  },
  {
    id: 'contactos',
    title: 'Contactos',
    blocks: [{ kind: 'paragraph', text: 'Faktura Angola, Lda · NIF 5002964031 · Luanda, Angola · geral@faktura.ao' }],
  },
];
