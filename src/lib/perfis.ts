import { User, Building2, Landmark, ShieldCheck } from 'lucide-react';

export type AccountType = 'particular' | 'empresa' | 'banco' | 'seguradora';

export interface PerfilConfig {
  id: AccountType;
  titulo: string;
  descricao: string;
  resumo: string;
  icon: typeof User;
}

export const PERFIS: PerfilConfig[] = [
  {
    id: 'particular',
    titulo: 'Particular',
    descricao: 'Pessoa física. Simula crédito, acompanha o teu perfil financeiro e prepara-te para pedir capital.',
    resumo: 'Simula e acompanha o teu perfil financeiro.',
    icon: User,
  },
  {
    id: 'empresa',
    titulo: 'Pessoa Coletiva',
    descricao: 'Empresas e PMEs. Envia o SAF-T, recebe o Giro Score e pede capital de giro aos bancos parceiros.',
    resumo: 'Envia SAF-T, recebe score e pede capital de giro.',
    icon: Building2,
  },
  {
    id: 'banco',
    titulo: 'Banco / Financiador',
    descricao: 'Instituições bancárias e financeiras. Recebe pedidos já validados, avalia com o Giro Score e decide.',
    resumo: 'Recebe dossiers validados e decide em minutos.',
    icon: Landmark,
  },
  {
    id: 'seguradora',
    titulo: 'Seguradora',
    descricao: 'Companhias de seguros. Oferece produtos de seguro às PMEs que operam no Giro.',
    resumo: 'Distribui produtos de seguro às PMEs do Giro.',
    icon: ShieldCheck,
  },
];

export const isNifValido = (v: string) => /^\d{9,14}$/.test(v.replace(/\D/g, ''));
export const isTelefoneValido = (v: string) => v.replace(/\D/g, '').length >= 9;
export const isEmailValido = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
export const isEmailInstitucional = (v: string) => {
  if (!isEmailValido(v)) return false;
  const dominio = v.split('@')[1].toLowerCase();
  const pessoais = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com'];
  return !pessoais.includes(dominio);
};
