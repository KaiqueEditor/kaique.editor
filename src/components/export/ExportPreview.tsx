import React from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Section, ProjectConfig } from '../../types';
import { CarouselSlide } from '../carousel/CarouselSlide';
import { COLOR_PALETTES } from '../../constants/colors';

interface ExportPreviewProps {
  sections: Section[];
  config: ProjectConfig;
  generatingIds: string[];
  isExporting: boolean;
  exportStep: string | null;
  onClose: () => void;
  onExport: () => void;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({
  sections,
  config,
  generatingIds,
  isExporting,
  exportStep,
  onClose,
  onExport,
}) => {
  return (
    <div className="fixed inset-0 bg-black z-[200] overflow-y-auto p-12 flex flex-col items-center no-scrollbar">
      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-24 bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-3xl">
        <div>
          <h2 className="text-5xl text-white font-black italic tracking-tighter">Review Final</h2>
          <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.6em] mt-4">Padrão Social Media</p>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-4 bg-white text-black px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-white/90 transition-all shadow-2xl disabled:opacity-50"
          >
            {isExporting
              ? <><Loader2 className="animate-spin" size={20} />{exportStep?.toUpperCase()}</>
              : <><Download size={20} />Exportar ZIP</>
            }
          </button>
          <button onClick={onClose} className="text-white p-5 hover:bg-white/10 rounded-full border border-white/10 transition-all">
            <X size={54} />
          </button>
        </div>
      </div>

      {/* Grid of slides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 pb-60">
        {sections.map((s, idx) => (
          <div key={`prev-${s.id}`} className="rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative group transition-all hover:scale-[1.05]">
            <div style={{ zoom: 0.35 } as any}>
              <CarouselSlide
                section={s}
                config={config}
                index={idx}
                total={sections.length}
                isExport={true}
                isGenerating={generatingIds.includes(s.id)}
              />
            </div>
            <div className="absolute top-10 left-10 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl text-[16px] font-black text-white border border-white/10">
              Slide {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
