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

const ALL_MARKS = /=\d=|==|\*\*|\*|_|~|\^|\{|\}/g;
const COLOR_MARK = /=\d=/g;

export interface MarkResult { value: string; start: number; end: number }

/** Tira espaços das pontas da seleção (marcação colada no espaço não fica bonita). */
function trimSelection(value: string, start: number, end: number) {
  while (start < end && /\s/.test(value[start])) start++;
  while (end > start && /\s/.test(value[end - 1])) end--;
  return { start, end };
}

/** Se a seleção já está entre um par de marcações (ex.: =1=…=1=), remove o par. */
function unwrapAround(value: string, start: number, end: number, test: RegExp): MarkResult {
  const before = value.slice(0, start).match(new RegExp(`(${test.source})$`));
  const after = value.slice(end).match(new RegExp(`^(${test.source})`));
  if (before && after && before[0] === after[0]) {
    const b = before[0].length;
    const a = after[0].length;
    return { value: value.slice(0, start - b) + value.slice(start, end) + value.slice(end + a), start: start - b, end: end - b };
  }
  return { value, start, end };
}

function wrap(value: string, start: number, end: number, mark: string, strip: RegExp): MarkResult {
  ({ start, end } = trimSelection(value, start, end));
  if (start === end) return { value, start, end };
  const inner = value.slice(start, end).replace(strip, '');
  return {
    value: value.slice(0, start) + mark + inner + mark + value.slice(end),
    start: start + mark.length,
    end: start + mark.length + inner.length,
  };
}

/** Pinta a seleção com a cor `code` (troca a cor se já estiver pintada). */
export function applyColor(value: string, start: number, end: number, code: number): MarkResult {
  ({ start, end } = trimSelection(value, start, end));
  const u = unwrapAround(value, start, end, /=\d=/);
  return wrap(u.value, u.start, u.end, `=${code}=`, COLOR_MARK);
}

/** Liga/desliga negrito forte (**). */
export function toggleBold(value: string, start: number, end: number): MarkResult {
  ({ start, end } = trimSelection(value, start, end));
  const u = unwrapAround(value, start, end, /\*\*/);
  if (u.value !== value) return u;
  return wrap(value, start, end, '**', /\*\*/g);
}

/** Remove toda formatação da seleção (e o par de marcações em volta, se houver). */
export function clearMarks(value: string, start: number, end: number): MarkResult {
  ({ start, end } = trimSelection(value, start, end));
  let r: MarkResult = { value, start, end };
  for (let i = 0; i < 4; i++) {
    const next = unwrapAround(r.value, r.start, r.end, /=\d=|\*\*|==|\*|_|~|\^/);
    if (next.value === r.value) break;
    r = next;
  }
  const inner = r.value.slice(r.start, r.end).replace(ALL_MARKS, '');
  return { value: r.value.slice(0, r.start) + inner + r.value.slice(r.end), start: r.start, end: r.start + inner.length };
}
