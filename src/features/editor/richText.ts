/**
 * Texto formatado sem mostrar os códigos.
 * O app continua guardando as marcações (=1=…=1=, **…**, ==…==), mas o campo de
 * edição mostra o texto já pintado. Aqui ficam a conversão marcação ⇄ HTML e as
 * operações de pintar/negrito/limpar sobre a seleção.
 */
import { COLOR_MAP } from '../../utils/formatters';

const COLOR_ALTS = Array.from({ length: 9 }, (_, i) => `=${i + 1}=.*?=${i + 1}=`).join('|');
const SPLIT = new RegExp(`(${COLOR_ALTS}|==.*?==|\\*\\*.*?\\*\\*|\\*.*?\\*|_.*?_|~.*?~|\\^.*?\\^|\\{.*?\\})`, 's');
const HIGHLIGHT = '#00E5C3';

type Mark = string; // '=1=' … '=9=', '==', '**', '*', '_', '~', '^', '{'

const closeOf = (m: Mark) => (m === '{' ? '}' : m);
const isColor = (m?: string) => !!m && /^=\d=$/.test(m);

/** Estilo de cada marcação (igual ao renderFormattedText, para o campo ficar fiel ao slide). */
function markStyle(m: Mark, panel: boolean): Partial<CSSStyleDeclaration> {
  if (isColor(m)) {
    const color = COLOR_MAP[m];
    const s: Partial<CSSStyleDeclaration> = { color, fontWeight: '900' };
    // no painel (fundo escuro/claro) branco e preto precisariam de contraste
    if (panel && color.toUpperCase() === '#FFFFFF') Object.assign(s, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '3px' });
    if (panel && color.toUpperCase() === '#0F1419') Object.assign(s, { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px' });
    return s;
  }
  switch (m) {
    case '==': return { color: HIGHLIGHT, fontWeight: '900' };
    case '**': return { fontWeight: '900' };
    case '*': return { fontWeight: '700' };
    case '_': return { fontStyle: 'italic' };
    case '~': return { textDecoration: 'line-through', opacity: '0.6' };
    case '^': return { fontSize: '0.65em', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' };
    case '{': return { fontWeight: '900', color: '#A855F7' };
    default: return {};
  }
}

function markOf(part: string): Mark | null {
  const color = part.match(/^=(\d)=/);
  if (color && part.endsWith(color[0]) && part.length > 6) return color[0];
  for (const m of ['==', '**']) if (part.startsWith(m) && part.endsWith(m) && part.length > 4) return m;
  for (const m of ['*', '_', '~', '^']) if (part.startsWith(m) && part.endsWith(m) && part.length > 2) return m;
  if (part.startsWith('{') && part.endsWith('}') && part.length > 2) return '{';
  return null;
}

/** Cria o elemento de uma marcação (com data-m para voltar a ser código depois). */
export function createMark(doc: Document, m: Mark, panel: boolean): HTMLElement {
  const el = doc.createElement(m === '**' || m === '*' ? 'strong' : 'span');
  el.dataset.m = m;
  Object.assign(el.style, markStyle(m, panel));
  return el;
}

/** Marcação → nós do DOM (recursivo, aceita cor dentro de negrito e vice-versa). */
export function renderInto(target: Node, raw: string, panel: boolean) {
  const doc = target.ownerDocument ?? document;
  for (const part of raw.split(SPLIT)) {
    if (!part) continue;
    const m = markOf(part);
    if (!m) { target.appendChild(doc.createTextNode(part)); continue; }
    const el = createMark(doc, m, panel);
    renderInto(el, part.slice(m.length, part.length - closeOf(m).length), panel);
    target.appendChild(el);
  }
}

/** DOM → marcação (o que o app salva), juntando marcações iguais coladas. */
export const serialize = (node: Node) =>
  serializeNode(node).replace(/(=[1-9]=)\1/g, '').replace(/\*\*\*\*/g, '').replace(/====/g, '');

function serializeNode(node: Node): string {
  let out = '';
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.nodeValue ?? '').replace(/\u00A0/g, ' ').replace(/\u200B/g, '');
      return;
    }
    if (!(child instanceof HTMLElement)) return;
    if (child.tagName === 'BR') { out += '\n'; return; }
    const inner = serializeNode(child);
    const m = child.dataset.m;
    if (m) { if (inner) out += m + inner + closeOf(m); return; }
    if (child.tagName === 'DIV' || child.tagName === 'P') {
      out += (out && !out.endsWith('\n') ? '\n' : '') + inner;
      return;
    }
    out += inner;
  });
  return out;
}

const marksIn = (root: ParentNode, test: (m: string) => boolean) =>
  [...root.querySelectorAll<HTMLElement>('[data-m]')].filter(el => test(el.dataset.m!));

function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/** Remove marcações que ficaram vazias depois de cortar a seleção. */
function dropEmpty(root: HTMLElement) {
  marksIn(root, () => true).forEach(el => { if (!el.textContent) el.remove(); });
}

/** Ancestrais de marcação (dentro de root) que envolvem o nó, do mais próximo ao mais distante. */
function markAncestors(node: Node, root: HTMLElement, test: (m: string) => boolean) {
  const out: HTMLElement[] = [];
  for (let n: Node | null = node; n && n !== root; n = n.parentNode) {
    if (n instanceof HTMLElement && n.dataset.m && test(n.dataset.m)) out.push(n);
  }
  return out;
}

/**
 * Tira a seleção de dentro das marcações que a envolvem (corta a marcação em duas),
 * para inserir algo "por fora" delas. Devolve o range já recolhido no ponto de inserção.
 */
function liftOutOf(range: Range, root: HTMLElement, test: (m: string) => boolean) {
  // basta cortar a marcação mais externa: as internas vão junto na cópia do pedaço da direita
  const ancestors = markAncestors(range.startContainer, root, test);
  const anc = ancestors[ancestors.length - 1];
  if (!anc?.parentNode) return;
  const after = document.createRange();
  after.setStart(range.startContainer, range.startOffset);
  after.setEnd(anc, anc.childNodes.length);
  const tail = after.extractContents();
  const tailWrapper = anc.cloneNode(false) as HTMLElement;
  tailWrapper.append(tail);
  anc.parentNode.insertBefore(tailWrapper, anc.nextSibling);
  range.setStartAfter(anc);
  range.collapse(true);
}

function currentRange(root: HTMLElement): Range | null {
  const sel = root.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed || !root.contains(range.commonAncestorContainer)) return null;
  return range;
}

function selectNode(el: Node) {
  const sel = (el.ownerDocument ?? document).getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(r);
}

/** Envolve a seleção numa marcação nova, tirando antes as do mesmo tipo. */
function wrapSelection(root: HTMLElement, m: Mark, sameKind: (x: string) => boolean, panel: boolean) {
  const range = currentRange(root);
  if (!range) return false;
  const frag = range.extractContents();
  marksIn(frag, sameKind).forEach(unwrap);
  liftOutOf(range, root, sameKind);
  const el = createMark(root.ownerDocument, m, panel);
  el.append(frag);
  range.insertNode(el);
  dropEmpty(root);
  root.normalize();
  selectNode(el);
  return true;
}

/** Pinta a seleção (troca a cor se já estava pintada). */
export const paintSelection = (root: HTMLElement, code: number, panel: boolean) =>
  wrapSelection(root, `=${code}=`, isColor, panel);

/** O trecho selecionado cobre pelo menos 1 caractere deste texto? (encostar não conta) */
function overlaps(range: Range, t: Text) {
  const nr = document.createRange();
  nr.selectNodeContents(t);
  const clip = range.cloneRange();
  if (clip.compareBoundaryPoints(Range.START_TO_START, nr) < 0) clip.setStart(t, 0);
  if (clip.compareBoundaryPoints(Range.END_TO_END, nr) > 0) clip.setEnd(t, t.length);
  return !clip.collapsed && clip.toString().length > 0 && t.parentNode !== null && nr.intersectsNode(t);
}

/**
 * Liga/desliga uma marcação de estilo (** negrito, _ itálico, ~ riscado):
 * se todo o trecho já tem, tira; senão, aplica.
 */
export function toggleMarkSelection(root: HTMLElement, mark: '**' | '_' | '~', panel: boolean) {
  const range = currentRange(root);
  if (!range) return false;
  const isBold = (m: string) => m === mark;
  const texts: Text[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode() as Text | null; t; t = walker.nextNode() as Text | null) {
    if (t.textContent && overlaps(range, t)) texts.push(t);
  }
  const allBold = texts.length > 0 && texts.every(t => markAncestors(t, root, isBold).length > 0);
  if (!allBold) return wrapSelection(root, mark, isBold, panel);
  const start = visibleOffset(root, range.startContainer, range.startOffset);
  const end = start + range.toString().length;
  new Set(texts.flatMap(t => markAncestors(t, root, isBold))).forEach(unwrap);
  root.normalize();
  selectVisible(root, start, end);
  return true;
}

/** Posição de (node, offset) no texto visível do campo. */
function visibleOffset(root: HTMLElement, node: Node, offset: number) {
  const r = document.createRange();
  r.selectNodeContents(root);
  r.setEnd(node, offset);
  return r.toString().length;
}

/** Seleciona o trecho [start, end) do texto visível. */
function selectVisible(root: HTMLElement, start: number, end: number) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const r = document.createRange();
  let pos = 0;
  let started = false;
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const len = t.textContent?.length ?? 0;
    if (!started && start <= pos + len) { r.setStart(t, start - pos); started = true; }
    if (started && end <= pos + len) { r.setEnd(t, end - pos); break; }
    pos += len;
  }
  if (!started) return;
  const sel = root.ownerDocument.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

/** Tira toda a formatação da seleção. */
export function clearSelection(root: HTMLElement) {
  const range = currentRange(root);
  if (!range) return false;
  const text = range.toString();
  const start = visibleOffset(root, range.startContainer, range.startOffset);
  range.deleteContents();
  liftOutOf(range, root, () => true);
  range.insertNode(root.ownerDocument.createTextNode(text));
  dropEmpty(root);
  // normalize junta textos vizinhos: a seleção é refeita pela posição no texto
  root.normalize();
  selectVisible(root, start, start + text.length);
  return true;
}

/** Põe o cursor na posição `offset` do texto visível (ou no fim). */
export function placeCaret(root: HTMLElement, offset: number | 'end') {
  const sel = root.ownerDocument.getSelection();
  if (!sel) return;
  const r = document.createRange();
  if (offset === 'end') {
    r.selectNodeContents(root);
    r.collapse(false);
  } else {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let left = offset;
    let placed = false;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const len = t.textContent?.length ?? 0;
      if (left <= len) { r.setStart(t, left); placed = true; break; }
      left -= len;
    }
    if (!placed) { r.selectNodeContents(root); r.collapse(false); } else r.collapse(true);
  }
  sel.removeAllRanges();
  sel.addRange(r);
}
