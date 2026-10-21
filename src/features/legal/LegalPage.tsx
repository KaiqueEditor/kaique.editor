import { ArrowLeft } from 'lucide-react';
import { LEGAL, legalContact } from '../../constants/legal';

export type LegalDoc = 'privacidade' | 'termos';

/** Caminho da página (procarrossel.com.br/privacidade e /termos). */
export const legalDocFromPath = (path = window.location.pathname): LegalDoc | null => {
  const p = path.replace(/\/+$/, '');
  if (p === '/privacidade') return 'privacidade';
  if (p === '/termos') return 'termos';
  return null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title3 font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-body text-fg-2 leading-relaxed max-w-[62ch]">{children}</div>
    </section>
  );
}

const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-5 flex flex-col gap-1.5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
);

const owner = () => `${LEGAL.responsible}${LEGAL.document ? `, inscrito no CNPJ ${LEGAL.document}` : ''}`;

function Privacy() {
  return (
    <>
      <Section title="1. Quem cuida dos seus dados">
        <p>
          O {LEGAL.brand} ({LEGAL.site}) é mantido por {owner()}, que é o controlador dos dados pessoais tratados na
          plataforma e também o encarregado (DPO) para assuntos de privacidade. Contato: {legalContact()}.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <List items={[
          <><b>Conta:</b> e-mail, nome (opcional) e senha (guardada apenas de forma criptografada). Se você entrar com Google ou GitHub, recebemos o e-mail e o nome dessa conta.</>,
          <><b>Conteúdo:</b> os carrosséis que você cria (textos, imagens enviadas, configurações) e a sua marca (nome, @, marca d'água, foto de perfil e fontes padrão).</>,
          <><b>Uso e segurança:</b> data de cada acesso, tipo de aparelho e navegador; data e tipo de cada exportação.</>,
          <><b>No seu aparelho:</b> a sessão de login, preferências (tema, formato) e projetos salvos só no aparelho ficam no armazenamento do navegador.</>,
        ]} />
        <p>Não coletamos CPF, endereço, telefone, dados de pagamento nem dados sensíveis. Não usamos ferramentas de publicidade ou de rastreamento entre sites.</p>
      </Section>

      <Section title="3. Para que usamos e com qual base legal">
        <List items={[
          <><b>Criar e manter sua conta e seus carrosséis</b>: execução do contrato (art. 7º, V, da LGPD).</>,
          <><b>Segurança, prevenção de abuso e estatísticas de uso da plataforma</b>: legítimo interesse (art. 7º, IX), sempre com o mínimo de dados.</>,
          <><b>Atender pedidos e cumprir obrigações legais</b>: cumprimento de obrigação legal (art. 7º, II).</>,
        ]} />
        <p>Não vendemos nem alugamos dados pessoais.</p>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <p>Usamos fornecedores que tratam dados em nosso nome, apenas para fazer a plataforma funcionar:</p>
        <List items={[
          <><b>Supabase</b>: banco de dados, login e armazenamento de imagens, em servidores em São Paulo (Brasil).</>,
          <><b>Vercel</b>: hospedagem do site, com servidores nos Estados Unidos e em outros países.</>,
          <><b>Google Fonts, Adobe Fonts e CDN Fonts</b>: entregam as fontes do editor e, ao carregá-las, recebem o endereço IP e o navegador.</>,
          <><b>Unsplash</b>: quando você busca fotos gratuitas, o termo buscado e o carregamento das imagens passam pelo Unsplash.</>,
        ]} />
        <p>
          Parte desses serviços fica fora do Brasil. Essas transferências internacionais seguem o art. 33 da LGPD,
          com fornecedores que adotam garantias contratuais e padrões de segurança reconhecidos.
        </p>
      </Section>

      <Section title="5. Cookies e armazenamento no navegador">
        <p>
          Usamos apenas armazenamento essencial: manter você conectado, lembrar suas preferências e guardar
          projetos no próprio aparelho. Não usamos cookies de publicidade, de análise de terceiros ou de rastreamento.
          Você pode apagar esses dados nas configurações do navegador, mas precisará entrar de novo.
        </p>
      </Section>

      <Section title="6. Por quanto tempo guardamos">
        <p>
          Guardamos os dados enquanto a sua conta existir. Se você pedir a exclusão da conta, apagamos os seus dados
          e carrosséis, exceto o que a lei obrigar a manter, pelo prazo exigido.
        </p>
      </Section>

      <Section title="7. Seus direitos">
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <List items={[
          'confirmar se tratamos seus dados e acessá-los;',
          'corrigir dados incompletos ou desatualizados;',
          'pedir anonimização, bloqueio ou eliminação de dados desnecessários;',
          'pedir a portabilidade dos seus dados;',
          'pedir a exclusão da conta e dos dados;',
          'saber com quem compartilhamos os dados;',
          'reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
        ]} />
        <p>
          Para exercer qualquer direito, escreva para {legalContact()} usando o e-mail da sua conta.
          Respondemos em até 15 dias.
        </p>
      </Section>

      <Section title="8. Segurança">
        <p>
          Usamos conexão criptografada (HTTPS), senhas protegidas por hash e regras de acesso no banco de dados para
          que cada pessoa veja apenas o próprio conteúdo. Nenhum sistema é 100% seguro; se houver um incidente que
          possa trazer risco a você, avisaremos você e a ANPD, como manda a lei.
        </p>
      </Section>

      <Section title="9. Crianças e adolescentes">
        <p>A plataforma é destinada a maiores de 18 anos ou a adolescentes com autorização dos responsáveis.</p>
      </Section>

      <Section title="10. Mudanças nesta política">
        <p>Se esta política mudar de forma relevante, avisaremos na plataforma. A data da última atualização fica no topo da página.</p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <Section title="1. Aceite">
        <p>
          Ao criar uma conta ou usar o {LEGAL.brand} ({LEGAL.site}), mantido por {owner()}, você concorda com estes
          Termos e com a Política de Privacidade. Se não concordar, não use a plataforma.
        </p>
      </Section>

      <Section title="2. O que é o serviço">
        <p>
          Uma ferramenta online para criar carrosséis e posts para redes sociais a partir de textos e imagens, com
          exportação em imagem, PDF ou vídeo. Os resultados dependem do conteúdo que você fornece; não prometemos
          número de seguidores, alcance, vendas ou qualquer resultado nas redes sociais.
        </p>
      </Section>

      <Section title="3. Sua conta">
        <List items={[
          'Informe dados verdadeiros e mantenha sua senha em sigilo.',
          'Você é responsável pelo que for feito com a sua conta.',
          'Avise-nos se suspeitar de uso indevido.',
        ]} />
      </Section>

      <Section title="4. O que não é permitido">
        <List items={[
          'conteúdo ilegal, discriminatório, de ódio, violento, sexual envolvendo menores ou que incentive crimes;',
          'desinformação que possa causar dano, golpes ou promessas enganosas;',
          'violar direitos autorais, marcas, imagem ou privacidade de terceiros;',
          'tentar acessar contas ou dados de outras pessoas, ou sobrecarregar e atacar a plataforma.',
        ]} />
        <p>Podemos remover conteúdo ou suspender contas que violem estes Termos.</p>
      </Section>

      <Section title="5. Seu conteúdo e direitos autorais">
        <p>
          Os textos, imagens e carrosséis que você cria continuam sendo seus. Você nos autoriza apenas a armazená-los
          e processá-los para que a plataforma funcione.
        </p>
        <p>
          Você é o único responsável por ter os direitos sobre o que envia e publica: fotos, logos, marcas, imagens
          de pessoas e textos de terceiros. As fotos buscadas no Unsplash seguem a licença do Unsplash, e o crédito
          ao fotógrafo é recomendado.
        </p>
      </Section>

      <Section title="6. Planos, pagamentos e reembolso">
        <p>
          Hoje o {LEGAL.brand} é gratuito. Se no futuro houver planos pagos, valerão estas regras, além das que forem
          informadas na contratação:
        </p>
        <List items={[
          'você poderá desistir em até 7 dias após a contratação e receberá o valor pago de volta, integralmente (art. 49 do Código de Defesa do Consumidor);',
          'depois desse prazo, poderá cancelar a qualquer momento, sem multa, e o plano segue ativo até o fim do período já pago;',
          'cobranças indevidas serão devolvidas.',
        ]} />
      </Section>

      <Section title="7. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter a plataforma no ar e seus dados seguros, mas ela é oferecida "no estado em que se
          encontra" e pode ter interrupções, falhas ou mudanças. Recomendamos exportar e guardar uma cópia do que for
          importante. Não nos responsabilizamos pelo conteúdo que os usuários publicam nem pelo uso que fazem dele.
          Nada nestes Termos limita os direitos que o Código de Defesa do Consumidor garante a você.
        </p>
      </Section>

      <Section title="8. Encerramento">
        <p>
          Você pode parar de usar a plataforma e pedir a exclusão da conta a qualquer momento, escrevendo para{' '}
          {legalContact()}.
        </p>
      </Section>

      <Section title="9. Lei e foro">
        <p>
          Estes Termos seguem as leis do Brasil. Eventuais disputas serão resolvidas no foro do domicílio do usuário,
          quando ele for consumidor{LEGAL.city ? `, ou no foro de ${LEGAL.city} nos demais casos` : ''}.
        </p>
      </Section>
    </>
  );
}

/** Página pública de Política de Privacidade ou Termos de Uso. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const title = doc === 'privacidade' ? 'Política de Privacidade' : 'Termos de Uso';
  return (
    <div className="fixed inset-0 safe-inset overflow-y-auto bg-bg text-fg font-sans">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-[760px] mx-auto h-14 px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-subhead font-medium hover:underline underline-offset-4">
            <ArrowLeft size={16} aria-hidden="true" /> {LEGAL.brand}
          </a>
          <nav className="flex gap-4 text-footnote text-muted" aria-label="Documentos">
            <a href="/privacidade" aria-current={doc === 'privacidade' ? 'page' : undefined} className="hover:text-fg aria-[current=page]:text-fg">Privacidade</a>
            <a href="/termos" aria-current={doc === 'termos' ? 'page' : undefined} className="hover:text-fg aria-[current=page]:text-fg">Termos</a>
          </nav>
        </div>
      </header>
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display font-light text-title1 tracking-tight">{title}</h1>
          <p className="text-footnote text-faint">Última atualização: {LEGAL.updatedAt}</p>
        </div>
        {doc === 'privacidade' ? <Privacy /> : <Terms />}
      </main>
    </div>
  );
}
