/**
 * Avisos entre partes do editor que não se conhecem (slide ↔ painéis ↔ janelas).
 * - edit: clicou num texto/imagem do slide → o painel abre no campo certo.
 * - open: um painel pede para abrir uma janela do editor (temas, paletas).
 */
export type EditTarget = 'title' | 'content' | 'media';
export type EditorDialog = 'themes' | 'assets';

const EDIT = 'cp:edit';
const OPEN = 'cp:open';

type EditDetail = { target: EditTarget; focusPanel: boolean };

/** focusPanel=false: o texto está sendo editado direto no slide; o painel só acompanha. */
export const requestEdit = (target: EditTarget, focusPanel = true) =>
  window.dispatchEvent(new CustomEvent<EditDetail>(EDIT, { detail: { target, focusPanel } }));

export const onEditRequest = (fn: (target: EditTarget, focusPanel: boolean) => void) => {
  const handler = (e: Event) => { const d = (e as CustomEvent<EditDetail>).detail; fn(d.target, d.focusPanel); };
  window.addEventListener(EDIT, handler);
  return () => window.removeEventListener(EDIT, handler);
};

export const openEditorDialog = (dialog: EditorDialog) =>
  window.dispatchEvent(new CustomEvent<EditorDialog>(OPEN, { detail: dialog }));

export const onOpenEditorDialog = (fn: (dialog: EditorDialog) => void) => {
  const handler = (e: Event) => fn((e as CustomEvent<EditorDialog>).detail);
  window.addEventListener(OPEN, handler);
  return () => window.removeEventListener(OPEN, handler);
};

/** Foca o campo do painel de texto depois que ele aparecer na tela. */
export const focusTextField = (target: Exclude<EditTarget, 'media'>, tries = 12) => {
  // Editor de computador e de celular ficam ambos na página; vale o que está visível
  const el = [...document.querySelectorAll<HTMLTextAreaElement & HTMLElement>(`[data-field="${target}"]`)]
    .find(f => f.offsetParent !== null);
  if (!el) {
    if (tries > 0) setTimeout(() => focusTextField(target, tries - 1), 50);
    return;
  }
  el.focus({ preventScroll: true });
  if (el.isContentEditable) {
    // campo formatado: cursor no fim do texto
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = document.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  } else {
    el.setSelectionRange(el.value.length, el.value.length);
  }
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

/** Clique num texto ou imagem do slide → abre o painel no campo certo. */
export const handleSlideClick = (e: { target: EventTarget }) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-edit]');
  const target = el?.dataset.edit as EditTarget | undefined;
  if (target) requestEdit(target);
};
