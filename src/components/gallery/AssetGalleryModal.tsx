import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { useAdmin } from '../../hooks/useAdmin';
import { useStore } from '../../store';
import { Button, Dialog, Field, Input, cx } from '../../ui';

// Ordem das cores: fundo, superfície, destaque, texto, destaque 2
const BUILTIN_PALETTES = [
  { id: 'bp-1', name: 'Meia-noite', colors: ['#0A0A0F', '#1A1A2E', '#00E5C3', '#FFFFFF', '#A78BFA'] },
  { id: 'bp-2', name: 'Dourado', colors: ['#1A0A0A', '#2E1A1A', '#FFD93D', '#FFFFFF', '#FF6B6B'] },
  { id: 'bp-3', name: 'Oceano', colors: ['#0A0F1A', '#1A2E3D', '#60A5FA', '#FFFFFF', '#22c55e'] },
  { id: 'bp-4', name: 'Rosé', colors: ['#1A0A10', '#2E1A22', '#F472B6', '#FFFFFF', '#FBBF24'] },
  { id: 'bp-5', name: 'Floresta', colors: ['#0A1A0F', '#1A2E1A', '#22c55e', '#FFFFFF', '#A3E635'] },
  { id: 'bp-6', name: 'Elétrico', colors: ['#0F0A1A', '#1A1A3D', '#A78BFA', '#FFFFFF', '#EC4899'] },
  { id: 'bp-7', name: 'Coral', colors: ['#1A0F0A', '#3D2E1A', '#FB923C', '#FFFFFF', '#F87171'] },
  { id: 'bp-8', name: 'Ártico', colors: ['#F8FAFC', '#E2E8F0', '#0EA5E9', '#0F172A', '#6366F1'] },
];

type Palette = { id: string; name: string; colors: string[]; builtin?: boolean };

interface AssetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Paletas da plataforma: clicar aplica no slide aberto; admins adicionam e apagam. */
export function AssetGalleryModal({ isOpen, onClose }: AssetGalleryModalProps) {
  const { isAdmin } = useAdmin();
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const updateSection = useStore(s => s.updateSection);
  const [custom, setCustom] = useState<Palette[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [colors, setColors] = useState(['#000000', '#1A1A1A', '#0095F6', '#FFFFFF', '#E1306C']);

  const load = async () => {
    const assets = await cloudStorage.getGlobalAssets('palette');
    setCustom(assets.map(a => ({ id: a.id, name: a.name, colors: Array.isArray(a.data?.colors) ? a.data.colors : [] })));
  };
  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const apply = (p: Palette, all: boolean) => {
    const [bg, , accent, text] = p.colors;
    const patch = { bgColor: bg, titleColor: text, bodyColor: text, brandingColor: accent };
    if (all) sections.forEach(s => updateSection(s.id, patch));
    else if (sections[activeSlide]) updateSection(sections[activeSlide].id, patch);
    toast.success(all ? `“${p.name}” aplicada em todos os slides` : `“${p.name}” aplicada`);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Dê um nome à paleta'); return; }
    const ok = await cloudStorage.uploadGlobalAsset({ name: name.trim(), type: 'palette', data: { colors } });
    if (!ok) { toast.error('Não foi possível salvar'); return; }
    toast.success('Paleta adicionada');
    setAdding(false); setName(''); load();
  };

  const remove = async (p: Palette) => {
    if (!confirm(`Apagar a paleta “${p.name}” para todos os usuários?`)) return;
    if (await cloudStorage.deleteGlobalAsset(p.id)) { setCustom(c => c.filter(x => x.id !== p.id)); toast.success('Paleta apagada'); }
  };

  const all: Palette[] = [...BUILTIN_PALETTES.map(p => ({ ...p, builtin: true })), ...custom];

  return (
    <Dialog open={isOpen} onClose={onClose} title="Paletas" className="max-w-2xl"
      description="Clique para aplicar no slide aberto. Use “Todos” para o carrossel inteiro.">
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-0.5">
        {all.map(p => (
          <li key={p.id} className="group relative rounded-ui-md bg-fg/[0.05] p-2.5 flex flex-col gap-2">
            <button type="button" onClick={() => apply(p, false)} className="flex h-12 rounded-ui-sm overflow-hidden ring-1 ring-fg/10" aria-label={`Aplicar ${p.name} no slide`}>
              {p.colors.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
            </button>
            <div className="flex items-center justify-between gap-2">
              <span className="text-footnote font-medium truncate">{p.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => apply(p, true)} className="text-caption text-muted hover:text-fg underline-offset-2 hover:underline">Todos</button>
                {isAdmin && !p.builtin && (
                  <button type="button" onClick={() => remove(p)} aria-label={`Apagar ${p.name}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-faint hover:text-danger hover:bg-danger/10">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isAdmin && (adding ? (
        <div className="flex flex-col gap-3 rounded-ui-md border border-line p-3">
          <Field label="Nome da paleta">{id => <Input id={id} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Verão 2026" />}</Field>
          <div className="flex items-center gap-2" role="group" aria-label="Cores da paleta">
            {colors.map((c, i) => (
              <label key={i} className={cx('relative w-10 h-10 rounded-full cursor-pointer ring-1 ring-fg/20')} style={{ background: c }}>
                <span className="sr-only">{['Fundo', 'Superfície', 'Destaque', 'Texto', 'Destaque 2'][i]}</span>
                <input type="color" value={c} className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => setColors(prev => prev.map((x, j) => (j === i ? e.target.value : x)))} />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Salvar para todos</Button>
          </div>
        </div>
      ) : (
        <Button icon={<Plus size={15} />} onClick={() => setAdding(true)} className="self-start">Nova paleta da plataforma</Button>
      ))}
    </Dialog>
  );
}
