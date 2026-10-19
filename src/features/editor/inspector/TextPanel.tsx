import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useStore } from '../../../store';
import type { Section } from '../../../types/carousel.types';
import { Field, Input, Segmented, Slider, Textarea } from '../../../ui';
import { FontSelect, Group, useActiveSection } from '../shared';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function TextPanel() {
  const { section: s, update } = useActiveSection();
  const config = useStore(st => st.config);
  const updateConfig = useStore(st => st.updateConfig);
  if (!s) return null;

  return (
    <div className="flex flex-col gap-6">
      <Group>
        <Field label="Título">
          {id => <Textarea id={id} rows={3} value={s.title} onChange={e => update({ title: e.target.value })} placeholder="Uma frase que prende" />}
        </Field>
        <Field label="Texto de apoio" hint="Use *negrito*, _itálico_ e ==destaque==.">
          {id => <Textarea id={id} rows={3} value={s.content} onChange={e => update({ content: e.target.value })} placeholder="Contexto, fontes ou subtítulo" />}
        </Field>
      </Group>

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

      {s.layoutType === 'social-post' && (
        <Group title="Perfil do post">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Nome">{id => <Input id={id} value={config.branding} onChange={e => updateConfig({ branding: e.target.value })} placeholder="Seu nome" />}</Field>
            <Field label="@ usuário">{id => <Input id={id} value={config.handle} onChange={e => updateConfig({ handle: e.target.value })} placeholder="@perfil" />}</Field>
          </div>
          <p className="text-caption text-faint">Clique no avatar dentro do slide para trocar a foto.</p>
        </Group>
      )}
    </div>
  );
}
