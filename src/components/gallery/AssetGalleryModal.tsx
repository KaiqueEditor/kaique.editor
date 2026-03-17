import React, { useEffect, useState } from 'react';
import { X, Type, Palette, Layers, Loader2, Plus, Trash2, Package } from 'lucide-react';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { useAdmin, ROLE_COLORS } from '../../hooks/useAdmin';
import { toast } from 'react-hot-toast';

const T = {
  bg: 'rgba(10,10,15,0.98)', card: 'rgba(255,255,255,0.03)', glass: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)', text: '#FFFFFF', textSub: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.3)', accent: '#00E5C3', accentGlow: 'rgba(0,229,195,0.15)',
  red: '#FF6B6B',
};

type AssetType = 'font' | 'palette' | 'preset';
const TABS: { key: AssetType; label: string; icon: any }[] = [
  { key: 'palette', label: 'Paletas', icon: Palette },
  { key: 'font', label: 'Fontes', icon: Type },
  { key: 'preset', label: 'Presets', icon: Layers },
];

// ── Built-in Palettes (always available) ─────────────────────────────────────
const BUILTIN_PALETTES = [
  { id: 'bp-1', name: 'Midnight Pro', colors: ['#0A0A0F', '#1A1A2E', '#00E5C3', '#FFFFFF', '#A78BFA'] },
  { id: 'bp-2', name: 'Sunset Gold', colors: ['#1A0A0A', '#2E1A1A', '#FFD93D', '#FFFFFF', '#FF6B6B'] },
  { id: 'bp-3', name: 'Ocean Blue', colors: ['#0A0F1A', '#1A2E3D', '#60A5FA', '#FFFFFF', '#22c55e'] },
  { id: 'bp-4', name: 'Rose Gold', colors: ['#1A0A10', '#2E1A22', '#F472B6', '#FFFFFF', '#FBBF24'] },
  { id: 'bp-5', name: 'Forest', colors: ['#0A1A0F', '#1A2E1A', '#22c55e', '#FFFFFF', '#A3E635'] },
  { id: 'bp-6', name: 'Electric Purple', colors: ['#0F0A1A', '#1A1A3D', '#A78BFA', '#FFFFFF', '#EC4899'] },
  { id: 'bp-7', name: 'Coral Reef', colors: ['#1A0F0A', '#3D2E1A', '#FB923C', '#FFFFFF', '#F87171'] },
  { id: 'bp-8', name: 'Arctic', colors: ['#F8FAFC', '#E2E8F0', '#0EA5E9', '#0F172A', '#6366F1'] },
];

interface AssetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPalette?: (colors: string[]) => void;
}

export const AssetGalleryModal: React.FC<AssetGalleryModalProps> = ({ isOpen, onClose, onApplyPalette }) => {
  const [activeTab, setActiveTab] = useState<AssetType>('palette');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAdmin();

  // New palette form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColors, setNewColors] = useState(['#000000', '#333333', '#00E5C3', '#FFFFFF', '#A78BFA']);

  useEffect(() => {
    if (isOpen) loadAssets();
  }, [isOpen, activeTab]);

  const loadAssets = async () => {
    setLoading(true);
    const data = await cloudStorage.getGlobalAssets(activeTab);
    setAssets(data);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!newName.trim()) { toast.error('Dê um nome ao asset'); return; }
    const ok = await cloudStorage.uploadGlobalAsset({
      name: newName.trim(),
      type: activeTab,
      data: activeTab === 'palette' ? { colors: newColors } : {},
    });
    if (ok) {
      toast.success('Asset adicionado!');
      setShowAddForm(false);
      setNewName('');
      loadAssets();
    } else {
      toast.error('Erro ao salvar asset');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este asset?')) return;
    const ok = await cloudStorage.deleteGlobalAsset(id);
    if (ok) {
      toast.success('Asset removido');
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  if (!isOpen) return null;

  const allPalettes = [...BUILTIN_PALETTES.map(p => ({ ...p, type: 'palette', data: { colors: p.colors }, isBuiltin: true, created_at: '' })), ...assets.filter(a => a.type === 'palette')];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col"
        style={{ background: T.bg, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <Package size={20} style={{ color: T.accent }} />
            <div>
              <h2 className="text-base font-black" style={{ color: T.text }}>Galeria de Assets</h2>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Recursos da Plataforma</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:bg-white/10 active:scale-90">
            <X size={18} style={{ color: T.textSub }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b" style={{ borderColor: T.border }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowAddForm(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex-1 justify-center"
              style={{ background: activeTab === tab.key ? T.accent : 'transparent', color: activeTab === tab.key ? '#000' : T.textSub }}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Admin: Add button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: T.accentGlow, color: T.accent, border: `1px solid ${T.accent}30` }}>
                <Plus size={14} /> Adicionar {activeTab === 'palette' ? 'Paleta' : activeTab === 'font' ? 'Fonte' : 'Preset'}
              </button>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do asset..."
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none"
                style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.text }} />
              {activeTab === 'palette' && (
                <div className="flex gap-2">
                  {newColors.map((c, i) => (
                    <div key={i} className="flex-1">
                      <input type="color" value={c} onChange={e => { const nc = [...newColors]; nc[i] = e.target.value; setNewColors(nc); }}
                        className="w-full h-10 rounded-lg cursor-pointer border-0" style={{ background: 'transparent' }} />
                      <p className="text-[8px] font-bold text-center mt-1" style={{ color: T.textFaint }}>{c}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ color: T.textSub }}>Cancelar</button>
                <button onClick={handleUpload} className="px-5 py-2 rounded-xl text-xs font-black uppercase" style={{ background: T.accent, color: '#000' }}>Salvar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Carregando...</span>
            </div>
          ) : activeTab === 'palette' ? (
            /* Palettes Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allPalettes.map((p: any) => (
                <div key={p.id} className="rounded-2xl overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ background: T.card, border: `1px solid ${T.border}` }}
                  onClick={() => onApplyPalette?.(p.data?.colors || p.colors)}>
                  <div className="flex h-16">
                    {(p.data?.colors || p.colors || []).map((color: string, i: number) => (
                      <div key={i} className="flex-1 transition-all group-hover:brightness-110" style={{ background: color }} />
                    ))}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold" style={{ color: T.text }}>{p.name}</p>
                      {p.isBuiltin && <span className="text-[8px] font-bold" style={{ color: T.textFaint }}>Built-in</span>}
                    </div>
                    {isAdmin && !p.isBuiltin && (
                      <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                        <Trash2 size={12} style={{ color: T.red }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fonts / Presets — placeholder */
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              {activeTab === 'font' ? <Type size={40} style={{ color: T.textFaint }} /> : <Layers size={40} style={{ color: T.textFaint }} />}
              <p className="text-sm font-bold" style={{ color: T.textSub }}>
                {assets.length === 0 ? 'Nenhum asset disponível ainda' : `${assets.length} assets`}
              </p>
              <p className="text-xs text-center max-w-sm" style={{ color: T.textFaint }}>
                {activeTab === 'font' ? 'Fontes customizadas da plataforma aparecerão aqui quando adicionadas pelo admin.' : 'Presets de estilo compartilhados aparecerão aqui.'}
              </p>
              {assets.length > 0 && (
                <div className="w-full space-y-2 mt-4">
                  {assets.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: T.text }}>{a.name}</p>
                        <p className="text-[9px] font-medium" style={{ color: T.textFaint }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={12} style={{ color: T.red }} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-center border-t" style={{ borderColor: T.border }}>
          <span className="text-[9px] font-bold" style={{ color: T.textFaint }}>
            Assets são compartilhados com todos os criadores da plataforma
          </span>
        </div>
      </div>
    </div>
  );
};
