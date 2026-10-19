import { ArrowRight, Cloud, Eye, Film, ImageIcon, LayoutGrid, Palette } from 'lucide-react';
import type { ProjectConfig, Section } from '../../types';
import { CarouselSlide } from '../../components/carousel/CarouselSlide';
import { Button, cx } from '../../ui';

interface LandingPageProps {
  onSignUp: () => void;
  onLogin: () => void;
}

// Fotos de exemplo feitas só com gradiente (sem depender de imagens externas)
const svgPhoto = (a: string, b: string, c: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1440"><defs><radialGradient id="g" cx="30%" cy="25%" r="90%"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><rect width="1080" height="1440" fill="url(#g)"/></svg>`)}`;

const DEMO_CONFIG: ProjectConfig = {
  branding: 'Carrossel.Pro',
  handle: '@procarrossel',
  watermark: '@procarrossel',
  avatarUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset="0.35" stop-color="#FA7E1E"/><stop offset="0.6" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect width="40" height="40" fill="url(#g)"/><text x="20" y="27" font-family="Arial" font-weight="700" font-size="18" fill="#fff" text-anchor="middle">C</text></svg>`)}`,
  numSlides: 3,
};

const base = {
  alignment: 'center', titleFont: 'bebas-neue', bodyFont: 'sans', titleColor: '#ffffff', bodyColor: '#e5e5e5',
  bgColor: '#0a0a0a', brandingColor: '#ffffff', titleSize: 44, bodySize: 16, imagePosX: 50, imagePosY: 50,
  imageScale: 1, overlayOpacity: 0, textPosY: 70, showSocialImage: false, gradientIntensity: 1,
} as const;

const FEED_COVER: Section = {
  ...base, id: 'demo-1', layoutType: 'storytelling', imageHeight: 62,
  title: '3 erros que travam o seu perfil', content: 'Arrasta pro lado e confere',
  imageUrl: svgPhoto('#FA7E1E', '#D62976', '#2a0f3a'),
};
const FEED_SLIDE: Section = {
  ...base, id: 'demo-2', layoutType: 'storytelling', alignment: 'left', imageHeight: 55, titleSize: 36,
  title: 'Postar sem constância', content: 'O algoritmo entrega mais para quem aparece toda semana.',
  imageUrl: svgPhoto('#4F5BD5', '#962FBF', '#0b0b1a'),
};
const X_POST: Section = {
  ...base, id: 'demo-3', layoutType: 'social-post', alignment: 'left', bgColor: '#ffffff', titleColor: '#0f1419',
  bodyColor: '#0f1419', brandingColor: '#0f1419', titleFont: 'sans', titleSize: 26, bodySize: 24, textPosY: 85,
  title: 'Ninguém te conta isso sobre consistência:', content: 'Ela não é sobre motivação.\n\nÉ sobre aparecer nos dias em que ninguém está olhando.',
};

/** Slide de verdade, renderizado pelo mesmo componente do editor e reduzido. */
function DemoSlide({ section, width, index = 0, className, style }: { section: Section; width: number; index?: number; className?: string; style?: React.CSSProperties }) {
  const scale = width / 1080;
  return (
    <div className={cx('overflow-hidden rounded-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.45)]', className?.includes('absolute') ? '' : 'relative', className)} style={{ width, height: 1440 * scale, ...style }} aria-hidden="true">
      <div style={{ position: 'absolute', inset: 0, width: 1080, height: 1440, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <CarouselSlide section={section} config={DEMO_CONFIG} index={index} total={5} isExport />
      </div>
    </div>
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
            {[
              { s: FEED_SLIDE, i: 1, w: 230, x: -140, y: 26, r: -8, extra: 'hidden sm:block' },
              { s: X_POST, i: 2, w: 230, x: 130, y: 28, r: 7, extra: '' },
              { s: FEED_COVER, i: 0, w: 260, x: -10, y: -4, r: 0, extra: '' },
            ].map(({ s, i, w, x, y, r, extra }) => (
              <DemoSlide key={s.id} section={s} index={i} width={w} className={cx('absolute left-1/2 top-1/2', extra)}
                style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${r}deg)` }} />
            ))}
          </div>
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
                { title: 'Feed', text: 'Título forte, foto de fundo e texto de apoio. O clássico que prende no arrastar.', slides: [FEED_COVER, FEED_SLIDE] },
                { title: 'Post do X', text: 'Visual de tweet com seu nome, @ e selo. Ideal para opinião, dicas e threads.', slides: [X_POST] },
              ].map(card => (
                <article key={card.title} className="p-6 sm:p-8 rounded-ui-xl bg-surface flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-title2 font-semibold">{card.title}</h3>
                    <p className="text-subhead text-muted leading-relaxed">{card.text}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {card.slides.map((s, i) => <DemoSlide key={s.id} section={s} index={i} width={170} className="shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />)}
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
