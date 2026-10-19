import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { searchUnsplashPhotos, triggerUnsplashDownload, type UnsplashPhoto } from '../../services/api/unsplashService';
import { Button, Dialog } from '../../ui';

const SUGGESTIONS = ['Negócios', 'Tecnologia', 'Cidade', 'Pessoas', 'Dinheiro', 'Natureza', 'Comida', 'Minimalista', 'Escuro', 'Abstrato'];

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

/** Busca de fotos no Unsplash (com crédito do fotógrafo, como pedem os termos). */
export function ImageGallery({ isOpen, onClose, onSelect }: ImageGalleryProps) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isOpen) { setQuery(''); setPhotos([]); setSearched(false); setPage(1); setFailed(false); }
  }, [isOpen]);

  const search = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setFailed(false);
    try {
      const result = await searchUnsplashPhotos(q.trim(), p, 20, 'portrait');
      setPhotos(prev => (p === 1 ? result.results : [...prev, ...result.results]));
      setHasMore(p < result.total_pages);
      setSearched(true);
      setPage(p);
    } catch (err) {
      console.error('Unsplash:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const pick = (photo: UnsplashPhoto) => {
    onSelect(photo.urls.regular);
    triggerUnsplashDownload(photo.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Buscar fotos" description="Fotos gratuitas do Unsplash, em pé, prontas para slide." className="max-w-3xl">
      <form onSubmit={e => { e.preventDefault(); search(query, 1); }} className="flex gap-2">
        <label className="h-11 flex-1 px-3.5 rounded-pill bg-fg/[0.07] flex items-center gap-2.5 text-faint focus-within:ring-4 focus-within:ring-accent/30">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: escritório, celular, dinheiro"
            aria-label="Buscar fotos" className="flex-1 min-w-0 bg-transparent outline-none text-subhead text-fg placeholder:text-faint" />
        </label>
        <Button type="submit" variant="primary" size="lg" loading={loading && page === 1}>Buscar</Button>
      </form>

      {!searched && !failed && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <Button key={s} size="sm" onClick={() => { setQuery(s); search(s, 1); }}>{s}</Button>
          ))}
        </div>
      )}

      {failed && <p className="text-subhead text-danger">Não foi possível buscar agora. Tente de novo em instantes.</p>}
      {searched && photos.length === 0 && !loading && <p className="text-subhead text-muted">Nada encontrado para “{query}”.</p>}

      {photos.length > 0 && (
        <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1">
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {photos.map(p => (
              <li key={p.id} className="flex flex-col gap-1">
                <button type="button" onClick={() => pick(p)} aria-label={`Usar foto: ${p.alt_description ?? 'sem descrição'}`}
                  className="block aspect-[3/4] rounded-ui-sm overflow-hidden ring-1 ring-fg/10 hover:ring-2 hover:ring-fg transition-shadow"
                  style={{ background: p.color }}>
                  <img src={p.urls.small} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
                <a href={`${p.user.links.html}?utm_source=carrossel_pro&utm_medium=referral`} target="_blank" rel="noreferrer"
                  className="text-caption text-faint truncate hover:text-fg">{p.user.name} · Unsplash</a>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button loading={loading} onClick={() => search(query, page + 1)}>Carregar mais</Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
