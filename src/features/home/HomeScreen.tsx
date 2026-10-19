import { useMemo, useRef, useState } from 'react';
import {
  BarChart3, FileText, LayoutGrid, LayoutTemplate, LogOut, Moon, Plus, Search, Sparkles, Sun, UserRound,
} from 'lucide-react';
import { useStore } from '../../store';
import { STARTER_TEMPLATES } from '../../constants/starterTemplates';
import { Button, Dialog, Field, Input, Segmented, cx } from '../../ui';
import { ImportRoteiroDialog } from '../editor/ImportRoteiroDialog';
import { ProjectCard } from './ProjectCard';
import { useProjects, type Project } from './useProjects';

type Filter = 'all' | 'cloud' | 'local';

interface HomeScreenProps {
  userId?: string;
  userEmail?: string | null;
  isAdmin: boolean;
  isProcessing: boolean;
  onOpenProject: (p: Project) => void;
  onNewBlank: () => void;
  onNewFromRoteiro: (text: string) => void;
  onNewFromTemplate: (templateId: string) => void;
  onOpenAnalytics: () => void;
  onLogout: () => void;
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined}
      className={cx(
        'h-10 px-3 rounded-ui-sm flex items-center gap-3 text-subhead text-left transition-colors',
        active ? 'bg-fg/10 text-fg font-medium' : 'text-fg-2 hover:bg-fg/[0.06]',
      )}>
      <span className={active ? 'text-accent-text' : 'text-muted'} aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function QuickAction({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-ui-lg bg-surface hover:bg-surface-2 text-left transition-colors active:scale-[0.99]">
      <span className="w-11 h-11 rounded-full bg-accent/15 text-accent-text flex items-center justify-center flex-shrink-0" aria-hidden="true">{icon}</span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-subhead font-semibold">{title}</span>
        <span className="text-footnote text-muted truncate">{text}</span>
      </span>
    </button>
  );
}

export function HomeScreen(props: HomeScreenProps) {
  const { userId, userEmail, isAdmin, isProcessing } = props;
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const config = useStore(s => s.config);
  const updateConfig = useStore(s => s.updateConfig);
  const { projects, loading, remove, duplicate } = useProjects(userId);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [roteiroOpen, setRoteiroOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(p => (filter === 'all' || p.source === filter) && (!q || p.name.toLowerCase().includes(q)));
  }, [projects, query, filter]);

  const handle = config.handle || config.watermark || userEmail?.split('@')[0] || 'Você';

  return (
    <div className="hidden lg:flex fixed inset-0 bg-bg text-fg font-sans">
      <nav aria-label="Navegação principal" className="w-[248px] flex-shrink-0 border-r border-fg/[0.06] p-4 flex flex-col gap-6">
        <div className="px-3 pt-2 text-title3 font-semibold tracking-tight">Carrossel<span className="text-accent-text">.</span>Pro</div>
        <div className="flex flex-col gap-1">
          <NavItem icon={<LayoutGrid size={18} />} label="Projetos" active onClick={() => searchRef.current?.focus()} />
          <NavItem icon={<LayoutTemplate size={18} />} label="Modelos prontos" onClick={() => setTemplatesOpen(true)} />
          <NavItem icon={<UserRound size={18} />} label="Minha marca" onClick={() => setBrandOpen(true)} />
          {isAdmin && <NavItem icon={<BarChart3 size={18} />} label="Analytics" onClick={props.onOpenAnalytics} />}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <NavItem icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'} onClick={toggleTheme} />
          <div className="flex items-center gap-3 p-3 rounded-ui-lg bg-surface">
            {config.avatarUrl
              ? <img src={config.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <span className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center text-subhead font-semibold" aria-hidden="true">{handle.replace('@', '').charAt(0).toUpperCase()}</span>}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-subhead font-medium truncate">{handle}</span>
              <span className="text-caption text-faint tabular-nums">{projects.length} carrosséis</span>
            </div>
            <button type="button" onClick={props.onLogout} aria-label="Sair" title="Sair"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1180px] mx-auto px-10 py-10 flex flex-col gap-8">
          <header className="flex items-center justify-between gap-6 flex-wrap">
            <h1 className="text-large font-bold">Seus carrosséis</h1>
            <div className="flex items-center gap-3">
              <label className="h-10 w-[300px] px-3.5 rounded-pill bg-fg/[0.07] flex items-center gap-2.5 text-faint focus-within:ring-4 focus-within:ring-accent/30">
                <Search size={16} aria-hidden="true" />
                <input ref={searchRef} type="search" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar projeto" aria-label="Buscar projeto"
                  className="flex-1 min-w-0 bg-transparent outline-none text-subhead text-fg placeholder:text-faint" />
              </label>
              <Button variant="primary" size="lg" icon={<Plus size={18} />} onClick={props.onNewBlank}>Novo carrossel</Button>
            </div>
          </header>

          <section aria-label="Criar" className="grid grid-cols-3 gap-3">
            <QuickAction icon={<FileText size={20} />} title="Colar roteiro" text="“texto 1”, “texto 2”… vira slides" onClick={() => setRoteiroOpen(true)} />
            <QuickAction icon={<Plus size={20} />} title="Em branco" text="3 slides com a sua marca" onClick={props.onNewBlank} />
            <QuickAction icon={<Sparkles size={20} />} title="A partir de um modelo" text={`${STARTER_TEMPLATES.length} modelos prontos`} onClick={() => setTemplatesOpen(true)} />
          </section>

          <div className="flex items-center justify-between gap-4">
            <Segmented<Filter> label="Filtrar projetos" value={filter} onChange={setFilter} className="w-[340px]"
              options={[{ value: 'all', label: 'Todos' }, { value: 'cloud', label: 'Na nuvem' }, { value: 'local', label: 'Neste aparelho' }]} />
            <span className="text-footnote text-faint tabular-nums" aria-live="polite">
              {loading ? 'Carregando…' : `${visible.length} ${visible.length === 1 ? 'projeto' : 'projetos'}`}
            </span>
          </div>

          {loading ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-5 gap-y-7" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <li key={i} className="flex flex-col gap-2.5">
                  <div className="aspect-[3/4] rounded-ui-lg bg-surface animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-surface animate-pulse" />
                </li>
              ))}
            </ul>
          ) : visible.length > 0 ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-5 gap-y-7">
              {visible.map(p => (
                <ProjectCard key={`${p.source}-${p.id}`} project={p}
                  onOpen={() => props.onOpenProject(p)}
                  onDuplicate={() => duplicate(p)}
                  onDelete={() => setToDelete(p)} />
              ))}
            </ul>
          ) : (
            <div className="py-20 flex flex-col items-center gap-3 text-center">
              <p className="text-title3 font-semibold">{query || filter !== 'all' ? 'Nenhum projeto encontrado' : 'Nenhum carrossel ainda'}</p>
              <p className="text-subhead text-muted">{query || filter !== 'all' ? 'Tente outra busca ou filtro.' : 'Comece colando um roteiro ou a partir de um modelo.'}</p>
            </div>
          )}
        </div>
      </main>

      <ImportRoteiroDialog open={roteiroOpen} busy={isProcessing} onClose={() => setRoteiroOpen(false)}
        onConfirm={text => { setRoteiroOpen(false); props.onNewFromRoteiro(text); }} />

      <Dialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} title="Modelos prontos"
        description="Escolha um ponto de partida. Dá para mudar tudo depois." className="max-w-2xl">
        <ul className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
          {STARTER_TEMPLATES.map(t => (
            <li key={t.id}>
              <button type="button" onClick={() => { setTemplatesOpen(false); props.onNewFromTemplate(t.id); }}
                className="w-full text-left p-4 rounded-ui-md bg-fg/[0.06] hover:bg-fg/10 transition-colors flex flex-col gap-1">
                <span className="text-subhead font-semibold">{t.name}</span>
                <span className="text-footnote text-muted">{t.description}</span>
                <span className="text-caption text-faint tabular-nums">{t.slideCount} slides</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={brandOpen} onClose={() => setBrandOpen(false)} title="Minha marca"
        description="Usada nos slides novos e no layout de post."
        footer={<Button variant="primary" onClick={() => setBrandOpen(false)}>Pronto</Button>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">{id => <Input id={id} value={config.branding} onChange={e => updateConfig({ branding: e.target.value })} placeholder="Seu nome" />}</Field>
          <Field label="@ usuário">{id => <Input id={id} value={config.handle} onChange={e => updateConfig({ handle: e.target.value })} placeholder="@perfil" />}</Field>
        </div>
        <Field label="Marca d'água" hint="Aparece discreta no rodapé de todos os slides.">
          {id => <Input id={id} value={config.watermark} onChange={e => updateConfig({ watermark: e.target.value })} placeholder="@seuperfil" />}
        </Field>
      </Dialog>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Apagar projeto?"
        description={toDelete ? `“${toDelete.name}” será apagado${toDelete.source === 'cloud' ? ' da nuvem' : ' deste aparelho'}. Não dá para desfazer.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { if (toDelete) remove(toDelete); setToDelete(null); }}>Apagar</Button>
          </>
        }>
        {null}
      </Dialog>
    </div>
  );
}
