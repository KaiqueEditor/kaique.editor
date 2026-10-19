import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store';
import { Button, Dialog, Field, Input } from '../../ui';

interface CustomTheme {
  id: string;
  name: string;
  bgColor: string;
  titleColor: string;
  bodyColor: string;
  brandingColor: string;
}

const STORAGE_KEY = 'carrosselpro-custom-themes';

const loadThemes = (): CustomTheme[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveThemes = (themes: CustomTheme[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(themes)); } catch { /* armazenamento indisponível */ }
};

const FIELDS: Array<{ key: keyof Omit<CustomTheme, 'id' | 'name'>; label: string }> = [
  { key: 'bgColor', label: 'Fundo' },
  { key: 'titleColor', label: 'Título' },
  { key: 'bodyColor', label: 'Texto' },
  { key: 'brandingColor', label: 'Marca' },
];

/** Temas de cor guardados neste aparelho; aplicar pinta todos os slides. */
export function CustomThemes({ onClose }: { onClose: () => void }) {
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const updateSection = useStore(s => s.updateSection);
  const [themes, setThemes] = useState<CustomTheme[]>(loadThemes);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const cur = sections[activeSlide] ?? sections[0];
  const [colors, setColors] = useState({
    bgColor: cur?.bgColor || '#000000',
    titleColor: cur?.titleColor || '#ffffff',
    bodyColor: cur?.bodyColor || '#cccccc',
    brandingColor: cur?.brandingColor || '#ffffff',
  });

  const persist = (next: CustomTheme[]) => { setThemes(next); saveThemes(next); };

  const save = () => {
    if (!name.trim()) { toast.error('Dê um nome ao tema'); return; }
    persist([...themes, { id: Date.now().toString(), name: name.trim(), ...colors }]);
    setCreating(false); setName('');
    toast.success('Tema salvo');
  };

  const apply = (t: CustomTheme) => {
    sections.forEach(s => updateSection(s.id, { bgColor: t.bgColor, titleColor: t.titleColor, bodyColor: t.bodyColor, brandingColor: t.brandingColor }));
    toast.success(`“${t.name}” aplicado em todos os slides`);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Temas" description="Combinações de cor guardadas neste aparelho. Aplicar pinta todos os slides.">
      {themes.length === 0 && !creating && (
        <p className="text-subhead text-muted">Nenhum tema ainda. Crie um a partir das cores do slide aberto.</p>
      )}
      {themes.length > 0 && (
        <ul className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
          {themes.map(t => (
            <li key={t.id} className="flex items-center gap-2">
              <button type="button" onClick={() => apply(t)}
                className="flex-1 min-w-0 flex items-center gap-3 h-12 px-2 rounded-ui-sm hover:bg-fg/[0.06] text-left">
                <span className="flex h-8 w-16 rounded-ui-sm overflow-hidden ring-1 ring-fg/10 flex-shrink-0" aria-hidden="true">
                  {FIELDS.map(f => <span key={f.key} className="flex-1" style={{ background: t[f.key] }} />)}
                </span>
                <span className="text-subhead truncate">{t.name}</span>
              </button>
              <button type="button" onClick={() => persist(themes.filter(x => x.id !== t.id))} aria-label={`Apagar ${t.name}`}
                className="w-9 h-9 rounded-full flex items-center justify-center text-faint hover:text-danger hover:bg-danger/10">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {creating ? (
        <div className="flex flex-col gap-4 rounded-ui-md border border-line p-3">
          <Field label="Nome do tema">{id => <Input id={id} autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} placeholder="Ex.: Notícia escura" />}</Field>
          <div className="flex justify-between px-1">
            {FIELDS.map(f => (
              <label key={f.key} className="flex flex-col items-center gap-1.5 cursor-pointer">
                <span className="relative w-10 h-10 rounded-full ring-1 ring-fg/20" style={{ background: colors[f.key] }}>
                  <input type="color" value={colors[f.key]} onChange={e => setColors(c => ({ ...c, [f.key]: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer" aria-label={f.label} />
                </span>
                <span className="text-caption text-muted">{f.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Salvar tema</Button>
          </div>
        </div>
      ) : (
        <Button icon={<Plus size={15} />} onClick={() => setCreating(true)} className="self-start">Novo tema</Button>
      )}
    </Dialog>
  );
}
