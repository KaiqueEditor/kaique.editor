import { STARTER_TEMPLATES } from '../../constants/starterTemplates';
import { Dialog } from '../../ui';

/** Lista de modelos prontos (usada na home e no editor). */
export function TemplatesDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (templateId: string) => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Modelos prontos"
      description="Escolha um ponto de partida. Dá para mudar tudo depois." className="max-w-2xl">
      <ul className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
        {STARTER_TEMPLATES.map(t => (
          <li key={t.id}>
            <button type="button" onClick={() => { onClose(); onPick(t.id); }}
              className="w-full text-left p-4 rounded-ui-md bg-fg/[0.06] hover:bg-fg/10 transition-colors flex flex-col gap-1">
              <span className="text-subhead font-semibold">{t.name}</span>
              <span className="text-footnote text-muted">{t.description}</span>
              <span className="text-caption text-faint tabular-nums">{t.slideCount} slides</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
