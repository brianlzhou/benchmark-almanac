// Labs: launch posts from the labs whose terms allow automated reading, and the benchmark tables in new
// open-weight model cards on Hugging Face.
//
// Left out on purpose: Anthropic and OpenAI (their terms forbid automated extraction from their websites),
// Meta (its robots.txt bars automated collection), and DeepSeek's and Kimi's sites (their terms forbid
// crawlers). Their open-weight cards on Hugging Face are read, under Hugging Face's terms.
import { key } from '../util.ts';
import { FROM, names, phraseNames, launchNames, knownId, arxivId, githubRepo, type Reader } from './core.ts';
import { parseFeed, stripTags } from './text.ts';

const BLOGS = [
  // Google's terms allow automated access that follows robots.txt, and both robots files allow these paths
  { lab: 'Google DeepMind', feed: 'https://deepmind.google/blog/rss.xml' },
  { lab: 'Google', feed: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/rss/' },
  // Mistral's terms have no crawling clause, and its robots.txt allows everything
  { lab: 'Mistral AI', feed: 'https://mistral.ai/news/rss' },
  // Ai2's terms have no crawling clause, and its robots.txt bars only /api. It launches benchmarks in its blog.
  { lab: 'Ai2', feed: 'https://allenai.org/rss.xml' },
];
// labs that publish open weights with a benchmark table in the model card
export const HF_ORGS = ['Qwen', 'deepseek-ai', 'moonshotai', 'zai-org', 'MiniMaxAI', 'google', 'mistralai', 'openai', 'meta-llama', 'meta-models', 'XiaomiMiMo', 'stepfun-ai', 'tencent', 'inclusionAI', 'allenai', 'ibm-granite', 'microsoft', 'nvidia'];
// quantized copies and other repackagings repeat the original card
export const COPY = /(FP8|FP4|NVFP4|MXFP\d|GGUF|AWQ|GPTQ|INT[48]|W4A16|W8A8|BF16|bnb|MLX|ONNX|eagle|draft|-Base$|-base$)/i;

function addAll(r: Reader, found: string[], how: { source: string; url: string }) {
  for (const nm of new Set(found)) r.add({ key: key(nm), name: nm, title: nm, url: how.url, arxiv: arxivId(how.url), stageA: 5, general: true }, { curated: how });
}

/**
 * Benchmark names in a model card's tables. A cell that holds a benchmark-style word is taken whole, so
 * "BigBench Extra Hard" stays one name. Settings in brackets and footnote marks are dropped.
 */
export function cardNames(card: string): string[] {
  const cells: string[] = [];
  for (const line of card.split('\n')) {
    if (/^\s*\|/.test(line)) cells.push(...line.split('|'));
    for (const m of line.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)) cells.push(m[1]);
  }
  const out = new Set<string>();
  for (const raw of cells) {
    const plain = stripTags(raw).replace(/[*_`]+|<sup>.*?<\/sup>|[†‡§¶]+|\^\S+/g, '');
    let cell = plain
      .replace(/\s*[([][^)\]]*[)\]]\s*/g, ' ')
      // a tool setting after the name: "BenchCAD w/o tools", "HLE with tools"
      .replace(/\s+(?:w\/o?|with|without|no)\s+tools?\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // a version the registry does not list: "Terminal-Bench-Science 0.1" is Terminal-Bench-Science.
    // A new version of a cataloged benchmark comes with its own launch post, which other readers find.
    const base = cell.replace(/[\s-]+v?\d+(?:\.\d+)*$/i, '');
    if (base !== cell && !knownId(cell) && knownId(base)) cell = base;
    if (!cell || /^[\d.,%\s/±-]+$/.test(cell)) continue;
    const tokens = [...names(cell), ...phraseNames(cell)];
    if (!tokens.length) continue;
    // "Massive Text Embedding Benchmark (MTEB)": the registry may know it by the short name
    const short = plain.match(/\(([A-Z][\w.+-]{1,15})\)/)?.[1];
    if (short && knownId(short)) out.add(short);
    else if (cell.length <= 40 && cell.split(' ').length <= 5) out.add(cell);
    else tokens.forEach((t) => out.add(t));
  }
  return [...out];
}

export async function labs(r: Reader) {
  for (const b of BLOGS) {
    const xml = await r.text(b.feed).catch((e: Error) => (r.note(`${b.lab} feed failed: ${e.message}`), ''));
    const posts = parseFeed(xml).filter((p) => p.date >= FROM).slice(0, 8);
    for (const p of posts) {
      r.read();
      // a launch post's benchmark table is in the page, not the feed
      const page = await r.text(p.link).catch(() => '');
      const main = page.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? page.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? page;
      const text = `${p.title}\n${stripTags(p.html)}\n${stripTags(main)}`;
      // a benchmark the post launches is the lab's own, with the repository the post links to under its name
      // (other links in a post are often cited work)
      const repos = [...main.matchAll(/href="([^"]+)"/g)].map((h) => githubRepo(h[1])).filter((x): x is string => !!x);
      const how = { curated: { source: b.lab, url: p.link } };
      for (const nm of launchNames(stripTags(main) || stripTags(p.html), p.title)) {
        const repo = repos.find((x) => key(x.split('/').pop() ?? '').includes(key(nm).slice(0, 6)));
        r.add({ key: key(nm), name: nm, title: p.title, url: p.link, org: b.lab, repo, introduced: true, stageA: 6, general: true }, how);
      }
      addAll(r, [...names(text), ...phraseNames(text)], { source: b.lab, url: p.link });
    }
  }
  type M = { id: string; lastModified?: string; createdAt?: string };
  for (const org of HF_ORGS) {
    const models = await r.json<M[]>(`https://huggingface.co/api/models?author=${org}&sort=lastModified&direction=-1&limit=10&expand[]=lastModified&expand[]=createdAt`).catch(() => [] as M[]);
    for (const m of models.filter((x) => (x.lastModified ?? '').slice(0, 10) >= FROM && !COPY.test(x.id)).slice(0, 4)) {
      const card = await r.text(`https://huggingface.co/${m.id}/raw/main/README.md`).catch(() => '');
      if (!card) continue;
      r.read();
      addAll(r, cardNames(card), { source: `${m.id.split('/')[1]} model card`, url: `https://huggingface.co/${m.id}` });
    }
  }
}
