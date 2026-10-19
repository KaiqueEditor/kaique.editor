import React, { useId } from 'react';
import { useStore } from '../../store';
import { EXPORT_FORMATS } from '../../types/carousel.types';
import type { ProjectConfig, Section } from '../../types/carousel.types';
import { CarouselSlide } from '../../components/carousel/CarouselSlide';
import { FONT_CATEGORIES, getFontsByCategory } from '../../constants/fonts';
import { Select, cx } from '../../ui';

/** Formato de exportação atual (Feed 3:4, Stories 9:16, LinkedIn 1:1). */
export function useFormat() {
  const key = useStore(s => s.exportFormat);
  return EXPORT_FORMATS.find(f => f.key === key) ?? EXPORT_FORMATS[0];
}

/** Slide ativo + atalho para atualizá-lo. */
export function useActiveSection() {
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const updateSection = useStore(s => s.updateSection);
  const section = sections[Math.min(activeSlide, sections.length - 1)] as Section | undefined;
  const update = (updates: Partial<Section>) => { if (section) updateSection(section.id, updates); };
  return { section, index: activeSlide, sections, update };
}

interface SlideThumbProps {
  section: Section;
  index: number;
  total: number;
  width: number;
  className?: string;
  /** Config do projeto (padrão: a do editor aberto). */
  config?: ProjectConfig;
}

/** Miniatura real do slide (o mesmo componente da exportação, em escala). */
export function SlideThumb({ section, index, total, width, className, config: configProp }: SlideThumbProps) {
  const storeConfig = useStore(s => s.config);
  const config = configProp ?? storeConfig;
  const fmt = useFormat();
  const scale = width / fmt.width;
  return (
    <div className={cx('relative overflow-hidden', className)} style={{ width, height: fmt.height * scale }}>
      <div style={{ position: 'absolute', inset: 0, width: fmt.width, height: fmt.height, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <CarouselSlide section={section} config={config} index={index} total={total} isExport formatWidth={fmt.width} formatHeight={fmt.height} />
      </div>
    </div>
  );
}

/** Seletor de fonte agrupado por categoria (respeita fontes exclusivas). */
export function FontSelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const userEmail = useStore(s => s.userEmail);
  const isAdmin = useStore(s => s.isAdmin);
  return (
    <Select id={id} value={value} onChange={e => onChange(e.target.value)}>
      {FONT_CATEGORIES.map(cat => {
        const options = getFontsByCategory(cat.key, userEmail).filter(f => !f.adminOnly || isAdmin);
        if (options.length === 0) return null;
        return (
          <optgroup key={cat.key} label={cat.label}>
            {options.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </optgroup>
        );
      })}
    </Select>
  );
}

/** Círculo de cor que abre o seletor nativo. */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col items-center gap-1.5">
      <label htmlFor={id} className="relative w-9 h-9 rounded-full cursor-pointer transition-transform duration-200 hover:scale-105 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.4)]"
        style={{ background: value }}>
        <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </label>
      <span className="text-caption text-muted">{label}</span>
    </div>
  );
}

/** Grupo com título discreto, à moda dos ajustes do iOS. */
export function Group({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          {title && <h3 className="text-footnote font-semibold text-muted">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
