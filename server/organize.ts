/**
 * Organização automática de texto em carrossel via OpenRouter (modelo gratuito).
 * Roda só no servidor: a chave nunca vai para o navegador.
 *
 * Devolve um roteiro no formato antigo ("texto 1", "texto 2"…) para o app montar
 * os slides exatamente como na regra de sempre, mais legenda e hashtags.
 */

export type OrganizeMode = 'feed' | 'x';

export interface OrganizeResult {
  roteiro: string;
  caption: string;
  model: string;
}

export interface OrganizeEnv {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const MAX_INPUT = 8000;

const RULES_FEED = `Você organiza textos em carrosséis de Instagram, em português do Brasil.
Responda SOMENTE com um JSON válido, sem comentários, neste formato:
{"capa":"...","fontes":"...","slides":[{"titulo":"...","texto":"..."}],"legenda":"...","hashtags":["..."]}

Regras:
- Use apenas fatos, números e nomes que estão no texto. Não invente nada.
- "capa": a frase de maior impacto do texto, curta (até 80 caracteres), como manchete. Pode conter um número ou contraste forte.
- "slides": de 4 a 8 slides depois da capa, na ordem lógica do texto. "titulo" até 55 caracteres; "texto" até 200 caracteres.
- Em cada slide, destaque 1 ou 2 palavras-chave do assunto com **duas estrelas**.
- Se o texto terminar com chamada (salvar, comentar, compartilhar, seguir), ela vai no último slide.
- "fontes": se o texto citar fontes (ex.: "Fontes: G1, BBC"), copie aqui no formato "Fontes: ..."; senão, "".
- "legenda": 2 a 4 frases para a legenda do post, com as palavras-chave principais.
- "hashtags": 5 a 8 hashtags em minúsculas, sem acento, sem espaços, ligadas ao assunto.`;

const RULES_X = `Você organiza textos em uma sequência de posts no estilo do X (Twitter), em português do Brasil.
Responda SOMENTE com um JSON válido, sem comentários, neste formato:
{"posts":["..."],"legenda":"...","hashtags":["..."]}

Regras:
- Use apenas fatos, números e nomes que estão no texto. Não invente nada.
- 3 a 8 posts. O primeiro é o gancho (a frase de maior impacto). Cada post tem até 280 caracteres.
- Destaque 1 ou 2 palavras-chave por post com **duas estrelas**.
- Se o texto terminar com chamada (salvar, comentar, compartilhar, seguir), ela vai no último post.
- "legenda": 2 a 4 frases para a legenda, com as palavras-chave principais.
- "hashtags": 5 a 8 hashtags em minúsculas, sem acento, sem espaços.`;

/** Extrai o primeiro objeto JSON da resposta (modelos às vezes cercam com ```json). */
function parseJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('resposta sem JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const oneLine = (s: string) => s.replace(/\n+/g, ' ').trim();

const captionFrom = (legenda: unknown, hashtags: unknown) => {
  const tags = Array.isArray(hashtags)
    ? hashtags.map(h => `#${String(h).replace(/^#/, '').replace(/\s+/g, '').toLowerCase()}`).filter(t => t.length > 1).slice(0, 10)
    : [];
  return [str(legenda, 1500), tags.join(' ')].filter(Boolean).join('\n\n');
};

/** Converte a resposta do modelo no roteiro "texto N" (feed) ou em parágrafos (X). */
function toRoteiro(data: Record<string, unknown>, mode: OrganizeMode): string {
  if (mode === 'x') {
    const posts = Array.isArray(data.posts) ? data.posts.map(p => str(p, 280)).filter(Boolean) : [];
    if (!posts.length) throw new Error('nenhum post na resposta');
    return posts.join('\n\n');
  }
  const capa = str(data.capa, 120);
  const slides = Array.isArray(data.slides) ? data.slides : [];
  if (!capa || !slides.length) throw new Error('resposta sem capa ou slides');
  const lines = [`texto 1`, oneLine(capa)];
  const fontes = str(data.fontes, 400);
  if (fontes) lines.push(fontes);
  let n = 2;
  for (const s of slides.slice(0, 10)) {
    const o = (s ?? {}) as Record<string, unknown>;
    const titulo = str(o.titulo, 90);
    const texto = str(o.texto, 260);
    if (!titulo && !texto) continue;
    lines.push('', `texto ${n}`, oneLine(titulo || texto), `texto ${n + 1}`, oneLine(titulo ? texto : ''));
    n += 2;
  }
  return lines.join('\n');
}

export async function organizeText(text: string, mode: OrganizeMode, env: OrganizeEnv): Promise<OrganizeResult> {
  const key = env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY não configurada');
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const input = text.trim().slice(0, MAX_INPUT);
  if (!input) throw new Error('texto vazio');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://procarrossel.com.br',
      'X-Title': 'Carrossel.Pro',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      // modelo com raciocínio: pouco esforço e folga de tokens para sobrar resposta
      max_tokens: 6000,
      reasoning: { effort: 'low', exclude: true },
      messages: [
        { role: 'system', content: mode === 'x' ? RULES_X : RULES_FEED },
        { role: 'user', content: input },
      ],
    }),
  });

  if (res.status === 429) throw new Error('limite do plano grátis atingido; tente mais tarde');
  if (!res.ok) throw new Error(`OpenRouter respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const json = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? '';
  const data = parseJson(content);
  return { roteiro: toRoteiro(data, mode), caption: captionFrom(data.legenda, data.hashtags), model };
}
