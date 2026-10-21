/**
 * Dados do responsável pela plataforma (aparecem no rodapé, na Política de
 * Privacidade e nos Termos). Preencha antes de publicar.
 */
export const LEGAL = {
  brand: 'Carrossel.Pro',
  site: 'procarrossel.com.br',
  /** Nome completo (pessoa física) ou razão social (empresa). */
  responsible: 'Kaique Torres',
  /** CNPJ (empresa) ou deixe vazio se for pessoa física. Não publique CPF. */
  document: '',
  /** E-mail para contato e pedidos sobre dados pessoais (LGPD). */
  email: '',
  /** Cidade/UF para o foro e o endereço de contato. */
  city: '',
  /** Data da última atualização dos documentos. */
  updatedAt: '21 de outubro de 2026',
} as const;

/** Texto curto de contato (quando o e-mail ainda não foi definido, não inventa um). */
export const legalContact = () => LEGAL.email || 'pelo canal de contato informado no site';
