import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, ImageIcon } from 'lucide-react';
import { searchUnsplashPhotos, triggerUnsplashDownload, UnsplashPhoto } from '../../services/api/unsplashService';

const T = {
    bg: 'rgba(0,0,0,0.85)',
    card: 'rgba(255,255,255,0.05)',
    glass: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.1)',
    text: '#FFFFFF',
    textSub: 'rgba(255,255,255,0.6)',
    textDim: 'rgba(255,255,255,0.3)',
    accent: '#00E5C3',
};

const SUGGESTIONS = ['Business', 'Marketing', 'Technology', 'Nature', 'City', 'People', 'Food', 'Fitness', 'Money', 'Minimal', 'Dark', 'Abstract'];

interface ImageGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (imageUrl: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            // Reset on open
            setQuery('');
            setPhotos([]);
            setSearched(false);
            setPage(1);
        }
    }, [isOpen]);

    const doSearch = useCallback(async (q: string, p = 1) => {
        if (!q.trim()) return;
        setLoading(true);
        try {
            const result = await searchUnsplashPhotos(q.trim(), p, 20, 'portrait');
            if (p === 1) {
                setPhotos(result.results);
            } else {
                setPhotos(prev => [...prev, ...result.results]);
            }
            setHasMore(p < result.total_pages);
            setSearched(true);
            setPage(p);
        } catch (err) {
            console.error('Unsplash search error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelect = useCallback(async (photo: UnsplashPhoto) => {
        // Use regular quality (1080px) — perfect for slides
        onSelect(photo.urls.regular);
        // Track download (required by Unsplash TOS)
        triggerUnsplashDownload(photo.id);
        onClose();
    }, [onSelect, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch(query, 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
                style={{ background: T.bg, border: `1px solid ${T.border}` }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2">
                        <ImageIcon size={18} style={{ color: T.accent }} />
                        <span className="text-sm font-bold text-white">Galeria de Imagens</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: T.glass, color: T.textDim }}>Unsplash</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-white/10">
                        <X size={18} style={{ color: T.textSub }} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar imagens..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                                style={{ background: T.glass, border: `1px solid ${T.border}` }}
                            />
                        </div>
                        <button
                            onClick={() => doSearch(query, 1)}
                            disabled={loading || !query.trim()}
                            className="px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                            style={{ background: T.accent, color: '#000' }}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Buscar'}
                        </button>
                    </div>

                    {/* Suggestions */}
                    {!searched && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setQuery(s); doSearch(s, 1); }}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-white/15 active:scale-95"
                                    style={{ background: T.glass, color: T.textSub, border: `1px solid ${T.border}` }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 pt-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.textDim} transparent` }}>
                    {loading && photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
                            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>Buscando...</span>
                        </div>
                    ) : searched && photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <ImageIcon size={32} style={{ color: T.textDim }} />
                            <span className="text-sm" style={{ color: T.textSub }}>Nenhuma imagem encontrada</span>
                            <span className="text-xs" style={{ color: T.textDim }}>Tente outra palavra-chave</span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map(photo => (
                                    <button
                                        key={photo.id}
                                        onClick={() => handleSelect(photo)}
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:ring-2 ring-[#00E5C3]/50 active:scale-95"
                                        style={{ background: photo.color || '#1a1a1a' }}
                                    >
                                        <img
                                            src={photo.urls.small}
                                            alt={photo.alt_description || ''}
                                            className="w-full h-full object-cover transition-all group-hover:brightness-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="absolute bottom-2 left-2 right-2 text-[9px] font-medium text-white/70 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                            📸 {photo.user.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {hasMore && (
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={() => doSearch(query, page + 1)}
                                        disabled={loading}
                                        className="px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all hover:bg-white/15 active:scale-95 disabled:opacity-40"
                                        style={{ background: T.glass, color: T.textSub, border: `1px solid ${T.border}` }}
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Carregar mais'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer — Unsplash attribution (required) */}
                <div className="px-4 py-2 text-center border-t" style={{ borderColor: T.border }}>
                    <span className="text-[9px]" style={{ color: T.textDim }}>
                        Fotos por <a href="https://unsplash.com/?utm_source=CarrosselPro&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">Unsplash</a> — gratuitas para uso comercial
                    </span>
                </div>
            </div>
        </div>
    );
};
