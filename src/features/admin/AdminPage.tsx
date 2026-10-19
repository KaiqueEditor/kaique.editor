import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { cloudStorage, type AdminAuditEntry, type AdminDashboard, type AdminUserRow } from '../../services/storage/cloudStorage';
import { ROLE_LABELS, type UserRole } from '../../hooks/useAdmin';
import { APP_VERSION } from '../../version';
import { Button, Dialog, IconButton, Panel, Select, Tabs, cx } from '../../ui';
import { relativeTime } from '../home/useProjects';
import { plainText } from '../../utils/formatters';

type Tab = 'overview' | 'users' | 'carousels' | 'audit';

const nf = new Intl.NumberFormat('pt-BR');

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <Panel className="p-5 flex flex-col gap-1.5">
      <span className="text-footnote text-muted">{label}</span>
      <span className="text-title1 font-semibold tabular-nums">{nf.format(value)}</span>
      {note && <span className="text-caption text-faint">{note}</span>}
    </Panel>
  );
}

/** Barras verticais de uma série (usuários ativos por dia), com valor ao passar o mouse. */
function DailyChart({ data }: { data: AdminDashboard['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.users));
  const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const h = hover !== null ? data[hover] : null;
  return (
    <Panel className="p-5 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-subhead font-semibold">Usuários ativos por dia</h3>
        <span className="text-footnote text-faint tabular-nums" aria-live="polite">
          {h ? `${fmt(h.date)}: ${h.users} ${h.users === 1 ? 'usuário' : 'usuários'}` : 'Últimos 30 dias'}
        </span>
      </div>
      <div className="flex items-end gap-[2px] h-40" role="img"
        aria-label={`Usuários ativos por dia nos últimos 30 dias. Máximo de ${max} em um dia.`}
        onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
            <div className={cx('w-full rounded-t-[4px] transition-colors', hover === i ? 'bg-fg' : 'bg-fg/45')}
              style={{ height: `${d.users === 0 ? 0 : Math.max(4, (d.users / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-caption text-faint tabular-nums" aria-hidden="true">
        <span>{data[0] && fmt(data[0].date)}</span>
        <span>{data.length > 0 && fmt(data[data.length - 1].date)}</span>
      </div>
    </Panel>
  );
}

/** Barras horizontais com rótulo direto (dispositivos, navegadores). */
function BarList({ title, rows }: { title: string; rows: { name: string; users: number }[] }) {
  const max = Math.max(1, ...rows.map(r => r.users));
  return (
    <Panel className="p-5 flex flex-col gap-4">
      <h3 className="text-subhead font-semibold">{title} <span className="text-footnote font-normal text-faint">· usuários, 30 dias</span></h3>
      {rows.length === 0 ? <p className="text-footnote text-faint">Sem dados no período.</p> : (
        <ul className="flex flex-col gap-3">
          {rows.map(r => (
            <li key={r.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-footnote"><span className="capitalize">{r.name}</span><span className="tabular-nums text-muted">{r.users}</span></div>
              <div className="h-1.5 rounded-full bg-fg/10"><div className="h-full rounded-full bg-fg" style={{ width: `${(r.users / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [carousels, setCarousels] = useState<Awaited<ReturnType<typeof cloudStorage.getAllCarousels>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<{ user: AdminUserRow; role: UserRole } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: { user } }, dash, log, cars] = await Promise.all([
        supabase.auth.getUser(),
        cloudStorage.getAdminDashboard(),
        cloudStorage.getAdminAudit(),
        cloudStorage.getAllCarousels(),
      ]);
      setMe(user?.id ?? null);
      setData(dash);
      setAudit(log);
      setCarousels(cars);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const emailOf = useMemo(() => {
    const m = new Map<string, string>();
    data?.users.forEach(u => m.set(u.id, u.email ?? 'sem e-mail'));
    return (id: string | null) => (id ? m.get(id) ?? 'conta removida' : 'sistema');
  }, [data]);

  const q = query.trim().toLowerCase();
  const users = (data?.users ?? []).filter(u => !q || (u.email ?? '').toLowerCase().includes(q));
  const cars = carousels.filter(c => !q || plainText(c.name ?? '').toLowerCase().includes(q) || emailOf(c.user_id).toLowerCase().includes(q));

  const confirmRole = async () => {
    if (!pending) return;
    setSaving(true);
    const err = await cloudStorage.updateUserRole(pending.user.id, pending.role);
    setSaving(false);
    if (err) { toast.error(err); return; }
    toast.success(`${pending.user.email} agora é ${ROLE_LABELS[pending.role]}`);
    setPending(null);
    load();
  };

  return (
    <div className="fixed inset-0 bg-bg text-fg font-sans overflow-y-auto">
      <header className="glass sticky top-3 z-20 mx-3 rounded-ui-xl px-3 py-2.5 flex flex-wrap items-center gap-3">
        <IconButton label="Voltar" onClick={onBack} className="bg-fg/[0.08]"><ArrowLeft size={18} /></IconButton>
        <div className="flex flex-col leading-tight mr-auto">
          <span className="font-display font-light text-title3">Painel admin</span>
          <span className="text-caption text-faint">Carrossel.Pro · v{APP_VERSION}</span>
        </div>
        <Tabs<Tab> label="Seções do painel" value={tab} onChange={t => { setTab(t); setQuery(''); }} className="order-last w-full sm:order-none sm:w-auto"
          options={[
            { value: 'overview', label: 'Visão geral' },
            { value: 'users', label: 'Usuários' },
            { value: 'carousels', label: 'Carrosséis' },
            { value: 'audit', label: 'Auditoria' },
          ]} />
        <IconButton label="Atualizar" onClick={load} disabled={loading}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></IconButton>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {error ? (
          <Panel className="p-8 flex flex-col items-center gap-3 text-center">
            <ShieldAlert size={28} className="text-danger" aria-hidden="true" />
            <p className="text-title3 font-semibold">Acesso restrito</p>
            <p className="text-subhead text-muted max-w-md">Só administradores veem este painel. Detalhe: {error}</p>
            <Button onClick={onBack}>Voltar</Button>
          </Panel>
        ) : loading && !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 rounded-ui-lg bg-surface animate-pulse" />)}
          </div>
        ) : data && (
          <>
            {tab === 'overview' && (
              <>
                <section aria-label="Números principais" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat label="Usuários" value={data.totals.users} note={`+${data.totals.new_users_30d} nos últimos 30 dias`} />
                  <Stat label="Ativos hoje" value={data.totals.dau} />
                  <Stat label="Ativos em 7 dias" value={data.totals.wau} />
                  <Stat label="Ativos em 30 dias" value={data.totals.mau} />
                  <Stat label="Carrosséis salvos" value={data.totals.carousels} />
                  <Stat label="Exportações" value={data.totals.exports} />
                  <Stat label="Slides exportados" value={data.totals.slides} />
                  <Stat label="Slides por exportação" value={data.totals.exports ? Math.round(data.totals.slides / data.totals.exports) : 0} />
                </section>
                <DailyChart data={data.daily} />
                <div className="grid md:grid-cols-2 gap-3">
                  <BarList title="Dispositivos" rows={data.devices} />
                  <BarList title="Navegadores" rows={data.browsers} />
                </div>
              </>
            )}

            {(tab === 'users' || tab === 'carousels') && (
              <label className="h-10 w-full sm:w-[340px] px-3.5 rounded-pill bg-fg/[0.07] flex items-center gap-2.5 text-faint focus-within:ring-4 focus-within:ring-accent/30">
                <Search size={16} aria-hidden="true" />
                <input type="search" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={tab === 'users' ? 'Buscar por e-mail' : 'Buscar por nome ou autor'}
                  aria-label="Buscar" className="flex-1 min-w-0 bg-transparent outline-none text-subhead text-fg placeholder:text-faint" />
              </label>
            )}

            {tab === 'users' && (
              <Panel className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-subhead">
                  <thead>
                    <tr className="text-left text-footnote text-muted border-b border-line">
                      <th className="font-medium px-5 py-3">Usuário</th>
                      <th className="font-medium px-3 py-3 w-[150px]">Papel</th>
                      <th className="font-medium px-3 py-3 text-right">Carrosséis</th>
                      <th className="font-medium px-3 py-3 text-right">Exportações</th>
                      <th className="font-medium px-3 py-3 text-right">Dias ativos</th>
                      <th className="font-medium px-5 py-3 text-right">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const self = u.id === me;
                      const last = u.last_login ?? u.last_edit;
                      return (
                        <tr key={u.id} className="border-b border-line last:border-0 hover:bg-fg/[0.03]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-fg/10 flex items-center justify-center text-footnote font-semibold flex-shrink-0" aria-hidden="true">
                                {(u.email ?? '?').charAt(0).toUpperCase()}
                              </span>
                              <span className="truncate">{u.email ?? 'sem e-mail'}{self && <span className="text-faint"> (você)</span>}</span>
                              {u.role === 'admin' && <ShieldCheck size={15} className="text-fg flex-shrink-0" aria-label="Admin" />}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <Select aria-label={`Papel de ${u.email}`} value={u.role} disabled={self} className="min-w-[124px]"
                              title={self ? 'Você não pode alterar o próprio papel' : undefined}
                              onChange={e => setPending({ user: u, role: e.target.value as UserRole })}>
                              <option value="user">{ROLE_LABELS.user}</option>
                              <option value="admin">{ROLE_LABELS.admin}</option>
                            </Select>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{u.carousels}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{u.exports}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{u.active_days}</td>
                          <td className="px-5 py-3 text-right text-muted whitespace-nowrap">{last ? relativeTime(last) : 'nunca'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {users.length === 0 && <p className="p-8 text-center text-subhead text-muted">Nenhum usuário encontrado.</p>}
              </Panel>
            )}

            {tab === 'carousels' && (
              cars.length === 0 ? <p className="py-16 text-center text-subhead text-muted">Nenhum carrossel encontrado.</p> : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-6">
                  {cars.map(c => (
                    <li key={c.id} className="flex flex-col gap-2">
                      <div className="aspect-[3/4] rounded-ui-lg overflow-hidden bg-surface ring-1 ring-fg/[0.06]">
                        {c.thumbnail_url && <img src={c.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 px-0.5">
                        <span className="text-subhead font-medium truncate" title={plainText(c.name)}>{plainText(c.name) || 'Sem título'}</span>
                        <span className="text-footnote text-faint truncate">{emailOf(c.user_id)}</span>
                        <span className="text-caption text-faint tabular-nums">{c.slide_count} slides · {relativeTime(c.updated_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {tab === 'audit' && (
              <Panel className="divide-y divide-line">
                {audit.length === 0 ? (
                  <p className="p-8 text-center text-subhead text-muted">Nenhuma ação administrativa registrada ainda.</p>
                ) : audit.map(a => (
                  <div key={a.id} className="px-5 py-3.5 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-subhead">
                      <span className="font-medium">{emailOf(a.actor)}</span>
                      <span className="text-muted"> mudou </span>
                      <span className="font-medium">{a.detail.email ?? emailOf(a.target)}</span>
                      <span className="text-muted"> de {ROLE_LABELS[a.detail.from as UserRole] ?? a.detail.from} para </span>
                      <span className="font-medium">{ROLE_LABELS[a.detail.to as UserRole] ?? a.detail.to}</span>
                    </p>
                    <span className="text-footnote text-faint">{relativeTime(a.created_at)}</span>
                  </div>
                ))}
              </Panel>
            )}
          </>
        )}
      </main>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.role === 'admin' ? 'Tornar admin?' : 'Remover acesso de admin?'}
        description={pending ? (pending.role === 'admin'
          ? `${pending.user.email} vai ver o painel admin, os dados de todos os usuários e poderá mudar papéis.`
          : `${pending.user.email} volta a ser Criador e perde o acesso ao painel.`) : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancelar</Button>
            <Button variant={pending?.role === 'admin' ? 'primary' : 'danger'} loading={saving} onClick={confirmRole}>Confirmar</Button>
          </>
        }
      >
        <p className="text-footnote text-faint">A mudança fica registrada na auditoria.</p>
      </Dialog>
    </div>
  );
}
