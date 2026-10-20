import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Dialog, Field, Input } from '../../ui';
import { ColorField, FontSelect } from '../editor/shared';
import { accountFonts } from '../../lib/buildSections';
import { scheduleBrandSave } from '../../services/brandSync';

/** "Minha marca": nome, @, marca d'água e avatar usados nos slides. */
export function BrandDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const config = useStore(s => s.config);
  const updateConfigLocal = useStore(s => s.updateConfig);
  const updateConfig: typeof updateConfigLocal = patch => { updateConfigLocal(patch); scheduleBrandSave(); };
  const brand = useStore(s => s.brandDefaults);
  const setBrandLocal = useStore(s => s.setBrandDefaults);
  const setBrand: typeof setBrandLocal = patch => { setBrandLocal(patch); scheduleBrandSave(); };
  const fallback = accountFonts(useStore(s => s.userEmail));
  const hasBrand = !!(brand.titleFont || brand.bodyFont || brand.titleColor);
  const fileRef = useRef<HTMLInputElement>(null);

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') updateConfig({ avatarUrl: reader.result }); };
    reader.readAsDataURL(file);
  };

  const initial = (config.handle || config.branding || '?').replace('@', '').charAt(0).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} title="Minha marca" description="Usada nos slides e no layout de post."
      footer={<Button variant="primary" onClick={onClose}>Pronto</Button>}>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Trocar foto de perfil"
          className="relative w-16 h-16 rounded-full overflow-hidden bg-fg/10 flex items-center justify-center group flex-shrink-0">
          {config.avatarUrl
            ? <img src={config.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-title3 font-semibold">{initial}</span>}
          <span className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <Camera size={18} aria-hidden="true" />
          </span>
        </button>
        <div className="flex flex-col gap-1">
          <span className="text-subhead font-medium">Foto de perfil</span>
          <span className="text-footnote text-muted">Aparece nos slides de post e no Visualizar.</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome">{id => <Input id={id} value={config.branding} onChange={e => updateConfig({ branding: e.target.value })} placeholder="Seu nome ou marca" />}</Field>
        <Field label="@ usuário">{id => <Input id={id} value={config.handle} onChange={e => updateConfig({ handle: e.target.value })} placeholder="@perfil" />}</Field>
      </div>
      <Field label="Marca d'água" hint="Aparece discreta no rodapé de todos os slides.">
        {id => <Input id={id} value={config.watermark} onChange={e => updateConfig({ watermark: e.target.value })} placeholder="@seuperfil" />}
      </Field>

      <div className="flex flex-col gap-3 pt-2 border-t border-fg/[0.08]">
        <div className="flex items-center justify-between gap-3 pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-subhead font-medium">Carrosséis novos de Feed</span>
            <span className="text-footnote text-muted">Começam com estas fontes e cor de título.</span>
          </div>
          {hasBrand && (
            <Button size="sm" variant="ghost" onClick={() => setBrand({ titleFont: undefined, bodyFont: undefined, titleColor: undefined })}>Usar padrão</Button>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end">
          <Field label="Fonte do título">{id => <FontSelect id={id} value={brand.titleFont ?? fallback.titleFont} onChange={v => setBrand({ titleFont: v })} />}</Field>
          <Field label="Fonte do texto">{id => <FontSelect id={id} value={brand.bodyFont ?? fallback.bodyFont} onChange={v => setBrand({ bodyFont: v })} />}</Field>
          <ColorField label="Título" value={brand.titleColor ?? '#ffffff'} onChange={v => setBrand({ titleColor: v })} />
        </div>
      </div>
    </Dialog>
  );
}
