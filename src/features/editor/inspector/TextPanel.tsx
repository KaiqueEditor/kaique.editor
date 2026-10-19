import { useRef } from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useStore } from '../../../store';
import type { Section, VerifiedStyle } from '../../../types/carousel.types';
import { Button, Field, Input, Segmented, Slider, Textarea, cx } from '../../../ui';
import { FontSelect, Group, useActiveSection } from '../shared';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { VerifiedBadge } from '../../../components/icons/VerifiedBadge';
import { TWEET_LIMIT, tweetLength } from '../../../lib/xPost';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function TextPanel() {
  const { section: s, update } = useActiveSection();
  const config = useStore(st => st.config);
  const updateConfig = useStore(st => st.updateConfig);
  const { handleAvatarUpload } = useFileUpload();
  const avatarInput = useRef<HTMLInputElement>(null);
  if (!s) return null;
  const isSocial = s.layoutType === 'social-post';
  const length = isSocial ? tweetLength(s) : 0;

  return (
    <div className="flex flex-col gap-6">
      <Group>
        <Field label="Título">
          {id => <Textarea id={id} rows={3} value={s.title} onChange={e => update({ title: e.target.value })} placeholder="Uma frase que prende" />}
        </Field>
        <Field label="Texto de apoio" hint="Use *negrito*, _itálico_ e ==destaque==.">
          {id => <Textarea id={id} rows={isSocial ? 5 : 3} value={s.content} onChange={e => update({ content: e.target.value })} placeholder="Contexto, fontes ou subtítulo" />}
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
          <Field label="Fonte do título">{id => <FontSelect id={id} value={s.titleFont || 'bebas-neue'} onChange={v => update({ titleFont: v })} />}</Field>
          <Field label="Tamanho">
            {id => <Input id={id} type="number" min={10} max={160} step={2} value={s.titleSize ?? 30}
              onChange={e => update({ titleSize: clamp(Number(e.target.value) || 10, 10, 160) })} />}
          </Field>
          <Field label="Fonte do texto">{id => <FontSelect id={id} value={s.bodyFont || 'sans'} onChange={v => update({ bodyFont: v })} />}</Field>
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
          <Segmented<VerifiedStyle>
            label="Selo"
            value={config.verified ?? 'blue'}
            onChange={verified => updateConfig({ verified })}
            options={[
              { value: 'blue', label: <><VerifiedBadge size={15} variant="blue" />Azul</> },
              { value: 'gold', label: <><VerifiedBadge size={15} variant="gold" />Ouro</> },
              { value: 'gray', label: <><VerifiedBadge size={15} variant="gray" />Cinza</> },
              { value: 'none', label: 'Sem' },
            ]}
          />
        </Group>
      )}
    </div>
  );
}
