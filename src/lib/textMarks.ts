import { COLOR_MAP } from '../utils/formatters';

/** Cores que a pessoa escolhe com um clique (viram =N=texto=N= por baixo). */
export const TEXT_COLORS: { code: number; name: string; hex: string }[] = [
  { code: 1, name: 'Vermelho', hex: COLOR_MAP['=1='] },
  { code: 2, name: 'Laranja', hex: COLOR_MAP['=2='] },
  { code: 3, name: 'Verde', hex: COLOR_MAP['=3='] },
  { code: 4, name: 'Ciano', hex: COLOR_MAP['=4='] },
  { code: 9, name: 'Azul', hex: COLOR_MAP['=9='] },
  { code: 5, name: 'Roxo', hex: COLOR_MAP['=5='] },
  { code: 6, name: 'Rosa', hex: COLOR_MAP['=6='] },
  { code: 7, name: 'Branco', hex: COLOR_MAP['=7='] },
  { code: 8, name: 'Preto', hex: COLOR_MAP['=8='] },
];
