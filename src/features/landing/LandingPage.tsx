import { ArrowRight, Cloud, Eye, Film, ImageIcon, LayoutGrid, Palette } from 'lucide-react';
import { Button, cx } from '../../ui';

interface LandingPageProps {
  onSignUp: () => void;
  onLogin: () => void;
}

// Posts reais feitos no Carrossel.Pro (@kaique.editor)
const POSTS = {
  robotaxi: { src: '/landing/robotaxi.jpg', alt: 'Carrossel de feed: Elon Musk lança carro sem motorista que lucra com robotáxi 24h' },
  ia: { src: '/landing/ia-40-posts.jpg', alt: 'Carrossel de feed: Fiz 40 posts só com IA em 30 dias, 6,5 milhões de views' },
  instagram: { src: '/landing/instagram-2026.jpg', alt: 'Carrossel de feed: O Instagram atualizou tudo em 2026' },
  gta: { src: '/landing/gta-vi.jpg', alt: 'Carrossel de feed: O Brasil bloqueou a Rockstar, GTA VI pode não ser vendido aqui' },
  pokemon: { src: '/landing/pokemon.jpg', alt: 'Carrossel de feed: Uma carta Pokémon vendida por mais de R$ 95 milhões' },
  banco: { src: '/landing/banco-cdi.jpg', alt: 'Post do X: O banco que prometia 140% do CDI quebrou e levou R$ 51 bilhões' },
} as const;
type PostKey = keyof typeof POSTS;

/** Post real (imagem 3:4) com sombra. */
function PostImage({ post, width, className, style, eager }: { post: PostKey; width: number; className?: string; style?: React.CSSProperties; eager?: boolean }) {
  const { src, alt } = POSTS[post];
  return (
    <img src={src} alt={alt} width={width} height={Math.round(width * 4 / 3)} loading={eager ? 'eager' : 'lazy'} decoding="async"
      className={cx('rounded-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] object-cover bg-surface', className)}
      style={{ width, height: Math.round(width * 4 / 3), ...style }} />
  );
}

const STEPS = [
  { n: '1', title: 'Cole o texto', text: 'Seu roteiro em parágrafos ou no formato “texto 1, texto 2”. Cada parte vira um slide.' },
  { n: '2', title: 'Ajuste o visual', text: 'Fotos, cores, fontes e a sua marca em todos os slides, com prévia ao vivo.' },
  { n: '3', title: 'Exporte e poste', text: 'Imagens em alta, PDF ou vídeo. Prontos para o Instagram, Stories e LinkedIn.' },
];

const FEATURES = [
  { icon: <Palette size={20} />, title: 'Sua marca', text: 'Nome, @ e foto aplicados em todos os slides.' },
  { icon: <Eye size={20} />, title: 'Prévia do feed', text: 'Veja como o post fica no Instagram antes de postar.' },
  { icon: <LayoutGrid size={20} />, title: 'Feed, Stories e LinkedIn', text: 'Troque o formato sem refazer nada.' },
  { icon: <Film size={20} />, title: 'Vídeo no slide', text: 'Coloque um trecho de vídeo e exporte em MP4.' },
  { icon: <ImageIcon size={20} />, title: 'Fotos gratuitas', text: 'Busque imagens do Unsplash direto no editor.' },
  { icon: <Cloud size={20} />, title: 'Salvo na nuvem', text: 'Seus carrosséis em qualquer aparelho.' },
];

function Logo() {
  return <span className="text-title3 font-semibold tracking-tight">Carrossel<span className="text-brand">.</span>Pro</span>;
}

/** Página pública de procarrossel.com.br para quem ainda não entrou. */
export function LandingPage({ onSignUp, onLogin }: LandingPageProps) {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-bg text-fg font-sans">
      <header className="sticky top-0 z-20 glass-strong">
        <div className="max-w-[1180px] mx-auto h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
          <Logo />
          <nav className="flex items-center gap-2" aria-label="Conta">
            <Button variant="ghost" size="sm" onClick={onLogin}>Entrar</Button>
            <Button variant="primary" size="sm" onClick={onSignUp}>Criar conta</Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-[1180px] mx-auto px-4 sm:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-8 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
            <span className="h-7 px-3 rounded-pill bg-fg/[0.07] text-footnote text-muted flex items-center">Para quem cria conteúdo no Instagram</span>
            <h1 className="font-display font-light text-[34px] sm:text-[46px] lg:text-[56px] leading-[1.08] tracking-tight">
              Do texto ao carrossel em <span className="text-brand font-normal">1 minuto</span>.
            </h1>
            <p className="text-body sm:text-title3 text-muted max-w-[520px] leading-relaxed">
              Cole o seu roteiro, escolha entre Feed ou Post do X e exporte pronto para postar. Sem precisar saber design.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="primary" size="lg" onClick={onSignUp} icon={<ArrowRight size={18} />} className="flex-row-reverse">Criar meu carrossel</Button>
              <Button variant="secondary" size="lg" onClick={onLogin}>Já tenho conta</Button>
            </div>
            <p className="text-footnote text-faint">Grátis para começar · Entre com Google ou e-mail</p>
          </div>

          <div className="relative h-[400px] sm:h-[470px]" aria-hidden="true">
            {([
              { p: 'instagram', w: 230, x: -150, y: 26, r: -8, extra: 'hidden sm:block' },
              { p: 'banco', w: 230, x: 140, y: 28, r: 7, extra: '' },
              { p: 'ia', w: 265, x: -6, y: -4, r: 0, extra: '' },
            ] as const).map(({ p, w, x, y, r, extra }) => (
              <PostImage key={p} post={p} width={w} eager className={cx('absolute left-1/2 top-1/2', extra)}
                style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${r}deg)` }} />
            ))}
          </div>
        </section>

        {/* Vitrine: posts reais */}
        <section className="border-t border-fg/[0.06]" aria-labelledby="vitrine">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 pt-16 pb-4 flex flex-col gap-2 text-center items-center">
            <h2 id="vitrine" className="font-display font-light text-title1 tracking-tight">Feito no Carrossel.Pro</h2>
            <p className="text-body text-muted">Posts reais publicados por @kaique.editor.</p>
          </div>
          <ul className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-8 pt-6 pb-16 snap-x snap-mandatory lg:justify-center">
            {(Object.keys(POSTS) as PostKey[]).map(p => (
              <li key={p} className="snap-center flex-shrink-0">
                <PostImage post={p} width={200} className="shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona */}
        <section className="border-t border-fg/[0.06]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-20 flex flex-col gap-10">
            <h2 className="font-display font-light text-title1 tracking-tight text-center">Como funciona</h2>
            <ol className="grid md:grid-cols-3 gap-4">
              {STEPS.map(s => (
                <li key={s.n} className="p-6 rounded-ui-xl bg-surface flex flex-col gap-3">
                  <span className="w-10 h-10 rounded-full ig-ring text-on-accent flex items-center justify-center text-subhead font-semibold">{s.n}</span>
                  <h3 className="text-title3 font-semibold">{s.title}</h3>
                  <p className="text-subhead text-muted leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Dois formatos */}
        <section className="border-t border-fg/[0.06]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-20 flex flex-col gap-10">
            <div className="flex flex-col gap-3 text-center items-center">
              <h2 className="font-display font-light text-title1 tracking-tight">Dois formatos, um clique</h2>
              <p className="text-body text-muted max-w-[560px]">O mesmo texto vira um carrossel de feed com fotos ou uma sequência de posts no estilo do X.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Feed', text: 'Título forte, foto de fundo e texto de apoio. O clássico que prende no arrastar.', posts: ['robotaxi', 'pokemon'] as PostKey[] },
                { title: 'Post do X', text: 'Visual de tweet com seu nome, @ e selo. Ideal para opinião, notícia e threads.', posts: ['banco'] as PostKey[] },
              ].map(card => (
                <article key={card.title} className="p-6 sm:p-8 rounded-ui-xl bg-surface flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-title2 font-semibold">{card.title}</h3>
                    <p className="text-subhead text-muted leading-relaxed">{card.text}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {card.posts.map(p => <PostImage key={p} post={p} width={170} className="shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section className="border-t border-fg/[0.06]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-20 flex flex-col gap-10">
            <h2 className="font-display font-light text-title1 tracking-tight text-center">Tudo o que você precisa</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              {FEATURES.map(f => (
                <li key={f.title} className="flex gap-4">
                  <span className="w-11 h-11 rounded-full bg-fg/[0.07] flex items-center justify-center flex-shrink-0" aria-hidden="true">{f.icon}</span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-subhead font-semibold">{f.title}</h3>
                    <p className="text-subhead text-muted leading-relaxed">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Chamada final */}
        <section className="px-4 sm:px-8 pb-20">
          <div className="max-w-[1180px] mx-auto rounded-ui-xl bg-surface px-6 py-14 sm:py-16 flex flex-col items-center gap-6 text-center">
            <h2 className="font-display font-light text-title1 sm:text-[40px] leading-tight tracking-tight">Seu próximo post começa agora.</h2>
            <Button variant="primary" size="lg" onClick={onSignUp}>Criar conta grátis</Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-fg/[0.06]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between text-footnote text-faint">
          <span>© {new Date().getFullYear()} Carrossel.Pro</span>
          <button type="button" onClick={onLogin} className="hover:text-fg">Entrar</button>
        </div>
      </footer>
    </div>
  );
}
