import { useState } from 'react';
import { Button } from '../../ui';

const KEY = 'carrosselpro-storage-notice';

/**
 * Aviso de cookies/armazenamento. O site só usa armazenamento essencial
 * (login e preferências), então é um aviso informativo, não um pedido de consentimento.
 */
export function StorageNotice() {
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(KEY); } catch { return false; } });
  if (!open) return null;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* sem armazenamento */ } setOpen(false); };
  return (
    <div role="region" aria-label="Aviso de cookies"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      className="fixed z-[250] left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-[400px] glass-strong rounded-ui-lg p-4 flex flex-col gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
      <p className="text-footnote text-fg-2 leading-relaxed">
        Usamos só armazenamento essencial para manter você conectado e lembrar suas preferências.
        Não usamos cookies de publicidade ou rastreamento.{' '}
        <a href="/privacidade" className="text-fg underline underline-offset-4">Política de Privacidade</a>
      </p>
      <Button size="sm" variant="primary" onClick={close} className="self-end">Entendi</Button>
    </div>
  );
}
