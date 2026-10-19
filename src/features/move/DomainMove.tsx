import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEW_ORIGIN, dropLocalSession, packLocalState } from '../../lib/domainMove';
import { projectStorage } from '../../services/storage/projectStorage';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { Button } from '../../ui';

const isCloudId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/**
 * Tela de passagem no endereço antigo: leva os projetos locais para a nuvem e
 * redireciona para procarrossel.com.br já com a sessão.
 */
export function DomainMove({ userId }: { userId: string }) {
  const [status, setStatus] = useState('Preparando…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Projetos que só existem neste aparelho → nuvem
        const [local, cloud] = await Promise.all([
          projectStorage.getAllProjects().catch(() => []),
          cloudStorage.getUserCarousels(userId).catch(() => []),
        ]);
        const cloudIds = new Set(cloud.map(c => c.id));
        const cloudNames = new Set(cloud.map(c => c.name));
        const pending = local.filter(p =>
          p.id !== 'auto-backup' && !isCloudId(p.id) && !cloudIds.has(p.id) && !cloudNames.has(p.name) && p.sections?.length);
        for (let i = 0; i < pending.length; i++) {
          if (cancelled) return;
          setStatus(`Levando seus projetos (${i + 1} de ${pending.length})…`);
          const p = pending[i];
          await cloudStorage.saveCarousel(userId, p.name, p.sections, p.config, p.thumbnailDataUrl, null);
        }

        // 2. Sessão + preferências no endereço novo
        setStatus('Abrindo o novo endereço…');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('sessão não encontrada');
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: String(session.expires_in ?? 3600),
          expires_at: String(session.expires_at ?? ''),
          token_type: 'bearer',
          type: 'domain_move',
          cp_state: packLocalState(),
        });
        dropLocalSession();
        if (!cancelled) window.location.replace(`${NEW_ORIGIN}/#${params.toString()}`);
      } catch (e) {
        console.error('[DomainMove]', e);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-bg text-fg font-sans flex flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-title3 font-semibold tracking-tight">Carrossel<span className="text-brand">.</span>Pro</span>
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="font-display font-light text-title2">Estamos em um endereço novo.</h1>
        <p className="text-body text-muted">procarrossel.com.br · sua conta e seus projetos vêm junto.</p>
      </div>
      {failed ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-subhead text-muted">Não deu para levar tudo automaticamente. Seus projetos na nuvem estão salvos.</p>
          <Button variant="primary" onClick={() => window.location.assign(NEW_ORIGIN)}>Ir para procarrossel.com.br</Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-subhead text-muted" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {status}
        </p>
      )}
    </div>
  );
}
