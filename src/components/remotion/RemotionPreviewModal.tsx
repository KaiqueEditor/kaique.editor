import React from 'react';
import { Player } from '@remotion/player';
import { CarouselVideo } from './CarouselVideo';
import { Section, ProjectConfig } from '../../types';
import { X, PlayCircle } from 'lucide-react';

interface RemotionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  config: ProjectConfig;
}

export const RemotionPreviewModal: React.FC<RemotionPreviewModalProps> = ({ isOpen, onClose, sections, config }) => {
  if (!isOpen) return null;

  const durationPerSlide = 90;
  const totalFrames = Math.max(1, sections.length * durationPerSlide);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-95"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center gap-6 max-h-full w-full">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <PlayCircle color="#00E5C3" /> Remotion Player
          </h2>
          <p className="text-white/50 text-sm mt-1">Protótipo de renderização nativa em tempo real</p>
        </div>

        <div className="rounded-3xl overflow-hidden bg-black/50 border border-white/10" 
             style={{ 
               width: 'min(100%, 380px)', 
               aspectRatio: '1080/1440',
               boxShadow: '0 0 80px rgba(0, 229, 195, 0.15)' 
             }}>
          <Player
            component={CarouselVideo}
            inputProps={{ sections, config }}
            durationInFrames={totalFrames}
            compositionWidth={1080}
            compositionHeight={1440}
            fps={30}
            style={{ width: '100%', height: '100%' }}
            controls
            autoPlay
            loop
          />
        </div>
      </div>
    </div>
  );
};
