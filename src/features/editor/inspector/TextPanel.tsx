import { useRef, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useStore } from '../../../store';
import type { Section } from '../../../types/carousel.types';
import { Button, Field, Input, Segmented, Slider, cx } from '../../../ui';
import { MarkToolbar, RichEditable, type RichEditableHandle } from '../RichEditable';
import { FontSelect, Group, useActiveSection } from '../shared';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { TWEET_LIMIT, tweetLength } from '../../../lib/xPost';
import { scheduleBrandSave } from '../../../services/brandSync';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Campo do painel com a formatação visível; a barra de cores aparece ao selecionar. */
function RichField({ id, field, value, onChange, placeholder, minRows }: {
  id: string; field: 'title' | 'content'; value: string; onChange: (v: string) => void; placeholder: string; minRows: number;
}) {
  const editor = useRef<RichEditableHandle>(null);
  const [selecting, setSelecting] = useState(false);
  return (
    <div className="relative">
      {selecting && (
        <div className="absolute z-30 left-0 bottom-full pb-2">
          <MarkToolbar editor={editor} />
        </div>
      )}
      <RichEditable
        ref={editor}
        value={value}
        onChange={onChange}
        onSelectionChange={setSelecting}
        panel
        ariaLabel={field === 'title' ? 'Título' : 'Texto de apoio'}
        dataField={field}
        placeholder={placeholder}
        className="rich-field w-full bg-fg/[0.07] text-fg text-subhead leading-relaxed rounded-ui-sm px-3 py-2.5 outline-none transition-[background-color,box-shadow] duration-200 hover:bg-fg/[0.09] focus:bg-fg/[0.05] focus:ring-4 focus:ring-accent/30"
        style={{ minHeight: `${minRows * 1.6 + 1.25}em` }}
      />
      <span id={id} className="sr-only" />
    </div>
  );
}

export function TextPanel() {
  const { section: s, update } = useActiveSection();
  const config = useStore(st => st.config);
  const updateConfigLocal = useStore(st => st.updateConfig);
  // nome, @ e foto são da marca: salvam também na nuvem
  const updateConfig: typeof updateConfigLocal = patch => { updateConfigLocal(patch); scheduleBrandSave(); };
  const { handleAvatarUpload } = useFileUpload();
  const avatarInput = useRef<HTMLInputElement>(null);
  if (!s) return null;
  const isSocial = s.layoutType === 'social-post';
  const length = isSocial ? tweetLength(s) : 0;

  return (
    <div className="flex flex-col gap-6">
      <Group>
        <Field label="Título">
          {id => <RichField id={id} field="title" minRows={3} value={s.title} onChange={title => update({ title })} placeholder="Uma frase que prende" />}
        </Field>
        <Field label="Texto de apoio" hint="Para colorir, selecione a palavra (aqui ou no slide).">
          {id => <RichField id={id} field="content" minRows={isSocial ? 5 : 3} value={s.content} onChange={content => update({ content })} placeholder="Contexto, fontes ou subtítulo" />}
        </Field>
        {isSocial && (
          <p className={cx('text-caption tabular-nums text-right -mt-1', length > TWEET_LIMIT ? 'text-danger' : 'text-faint')} aria-live="polite">
            {length > TWEET_LIMIT ? `Passou do limite do X · ` : ''}{length}/{TWEET_LIMIT}
          </p>
        )}
      </Group>

      {isSocial && (
        <Group title="Estilo do post">
          <Segmented<'bold' | 'plain'>
            label="Primeira frase"
            value={s.postTitleBold === false ? 'plain' : 'bold'}
            onChange={v => update({ postTitleBold: v === 'bold' })}
            options={[
              { value: 'bold', label: 'Em negrito' },
              { value: 'plain', label: 'Texto corrido' },
            ]}
          />
        </Group>
      )}

      <Group title="Tipografia">
        <div className="grid grid-cols-[minmax(0,1fr)_76px] gap-2.5 items-end">
          <Field label="Fonte do título">{id => <FontSelect id={id} value={isSocial && (!s.titleFont || s.titleFont === 'sans') ? 'manrope' : s.titleFont || 'bebas-neue'} onChange={v => update({ titleFont: v })} />}</Field>
          <Field label="Tamanho">
            {id => <Input id={id} type="number" min={10} max={160} step={2} value={s.titleSize ?? 30}
              onChange={e => update({ titleSize: clamp(Number(e.target.value) || 10, 10, 160) })} />}
          </Field>
          <Field label="Fonte do texto">{id => <FontSelect id={id} value={isSocial && (!s.bodyFont || s.bodyFont === 'sans') ? 'manrope' : s.bodyFont || 'sans'} onChange={v => update({ bodyFont: v })} />}</Field>
          <Field label="Tamanho">
            {id => <Input id={id} type="number" min={8} max={80} step={1} value={s.bodySize ?? 20}
              onChange={e => update({ bodySize: clamp(Number(e.target.value) || 8, 8, 80) })} />}
          </Field>
        </div>
      </Group>

      <Group title="Posição">
        <Segmented<Section['alignment']>
          label="Alinhamento"
          value={s.alignment}
          onChange={alignment => update({ alignment })}
          options={[
            { value: 'left', label: <><AlignLeft size={15} />Esquerda</> },
            { value: 'center', label: <><AlignCenter size={15} />Centro</> },
            { value: 'right', label: <><AlignRight size={15} />Direita</> },
          ]}
        />
        <Field label="Altura do texto" aside={`${s.textPosY ?? 85}`}>
          {id => <Slider id={id} min={0} max={250} step={5} value={s.textPosY ?? 85} onChange={v => update({ textPosY: v })} />}
        </Field>
      </Group>

      {isSocial && (
        <Group title="Perfil do post">
          <div className="flex items-center gap-3">
            <img src={config.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-fg/[0.06] flex-shrink-0" />
            <Button size="sm" onClick={() => avatarInput.current?.click()}>Trocar foto</Button>
            <input ref={avatarInput} type="file" accept="image/*" className="hidden"
              onChange={e => { handleAvatarUpload(e, url => updateConfig({ avatarUrl: url })); e.target.value = ''; }} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Nome">{id => <Input id={id} value={config.branding} onChange={e => updateConfig({ branding: e.target.value })} placeholder="Seu nome" />}</Field>
            <Field label="@ usuário">{id => <Input id={id} value={config.handle} onChange={e => updateConfig({ handle: e.target.value })} placeholder="@perfil" />}</Field>
          </div>
        </Group>
      )}
    </div>
  );
}
