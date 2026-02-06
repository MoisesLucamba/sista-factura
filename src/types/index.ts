// Core business types for Angolan invoicing system

export interface Empresa {
  id: string;
  nome: string;
  nif: string;
  endereco: string;
  telefone: string;
  email: string;
  setor: string;
  regimeFiscal: 'geral' | 'simplificado' | 'isento';
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  nif: string;
  endereco: string;
  telefone?: string;
  email?: string;
  tipo: 'particular' | 'empresa';
  createdAt: Date;
  updatedAt: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  nif: string;
  endereco: string;
  telefone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: 'produto' | 'servico';
  precoUnitario: number;
  unidade: string;
  ivaIncluido: boolean;
  taxaIva: number; // 14% default, 0% for exempt
  stock?: number;
  stockMinimo?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemFatura {
  id: string;
  produtoId: string;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  taxaIva: number;
  subtotal: number;
  valorIva: number;
  total: number;
}

export type TipoDocumento = 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito';
export type EstadoFatura = 'rascunho' | 'emitida' | 'paga' | 'anulada' | 'vencida';

export interface Fatura {
  id: string;
  numero: string;
  serie: string;
  tipo: TipoDocumento;
  estado: EstadoFatura;
  clienteId: string;
  cliente: Cliente;
  dataEmissao: Date;
  dataVencimento: Date;
  dataPagamento?: Date;
  itens: ItemFatura[];
  subtotal: number;
  totalIva: number;
  total: number;
  observacoes?: string;
  metodoPagamento?: string;
  referenciaPagamento?: string;
  qrCode?: string;
  assinaturaDigital?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  faturacaoMensal: number;
  faturacaoAnual: number;
  ivaMensal: number;
  ivaAnual: number;
  totalClientes: number;
  faturasEmitidas: number;
  faturasPendentes: number;
  faturasVencidas: number;
}

export interface FaturacaoMensal {
  mes: string;
  valor: number;
  iva: number;
}

export type UserRole = 'admin' | 'operador' | 'contador';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
