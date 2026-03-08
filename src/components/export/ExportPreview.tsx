import React from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Section, ProjectConfig, EXPORT_FORMATS } from '../../types';
import { CarouselSlide } from '../carousel/CarouselSlide';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';

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
  const theme = useStore(state => state.theme);
  const exportFormat = useStore(state => state.exportFormat);
  const T = getTheme(theme);

  const fmt = EXPORT_FORMATS.find(f => f.key === exportFormat);
  const fmtW = fmt?.width ?? 1080;
  const fmtH = fmt?.height ?? 1440;

  // Detecta mobile via window width
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const PREVIEW_W = 240;
  const PREVIEW_W_SM = 150;
  const pw = isMobile ? PREVIEW_W_SM : PREVIEW_W;
  const ph = Math.round(pw * (fmtH / fmtW));
  const sc = pw / fmtW;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto p-4 sm:p-8 lg:p-12 flex flex-col items-center no-scrollbar animate-fade-in" style={{ background: T.bgCanvas }}>
      {/* Header */}
      <div
        className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 lg:mb-16 p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl lg:rounded-[4rem] backdrop-blur-3xl"
        style={{ background: T.glassMd, border: `1px solid ${T.border}` }}
      >
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black italic tracking-tighter" style={{ color: T.textPrimary }}>Pré-visualização</h2>
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.6em] mt-2 sm:mt-4" style={{ color: T.textFaint }}>
            {sections.length} slide{sections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 sm:gap-4 px-5 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all shadow-2xl disabled:opacity-50 hover:scale-[1.03] active:scale-95"
            style={{ background: T.accent, color: T.accentText }}
          >
            {isExporting
              ? <><Loader2 className="animate-spin" size={isMobile ? 14 : 20} />{exportStep?.toUpperCase()}</>
              : <><Download size={isMobile ? 14 : 20} />Exportar ZIP</>
            }
          </button>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-3 sm:p-4 lg:p-5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-90"
            style={{ color: T.textDim, border: `1px solid ${T.border}` }}
          >
            <X size={isMobile ? 20 : 32} />
          </button>
        </div>
      </div>

      {/* Slides em flex wrap */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-8 pb-32">
        {sections.map((s, idx) => (
          <div
            key={`prev-${s.id}`}
            className="relative group transition-all hover:scale-[1.04] animate-scale-in"
            style={{ flexShrink: 0, animationDelay: `${idx * 50}ms` }}
          >
            <div
              className="rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden"
              style={{ width: pw, height: ph, border: `1px solid ${T.border}`, boxShadow: T.shadowStrong, position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: fmtW, height: fmtH, transform: `scale(${sc})`, transformOrigin: 'top left' }}>
                <CarouselSlide
                  section={s}
                  config={config}
                  index={idx}
                  total={sections.length}
                  isExport={true}
                  isGenerating={generatingIds.includes(s.id)}
                  formatWidth={fmtW}
                  formatHeight={fmtH}
                />
              </div>
            </div>
            <div
              className="absolute top-2 left-2 sm:top-3 sm:left-3 backdrop-blur-xl px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black"
              style={{ background: T.glassMd, color: T.textSub, border: `1px solid ${T.border}` }}
            >
              {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
