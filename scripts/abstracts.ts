// Fetches the abstract of each benchmark's paper, in its authors' own words, for the "In the authors' words"
// note on benchmark pages. Writes data/abstracts.json, keyed by benchmark id.
//
// Abstracts come only from hosts whose terms allow reuse, and every entry records its license:
//   arXiv          Descriptive metadata, abstracts included, is CC0 (info.arxiv.org/help/api/tou.html).
//                  The API asks for one request every three seconds, on one connection.
//   ACL Anthology  Papers from 2016 on are CC BY 4.0. Older ones are CC BY-NC-SA 3.0 and are left out.
//   DOIs           Read from Crossref, and kept only when the publisher's license is CC0 or CC BY.
//   OpenReview     Metadata is CC0 under its terms, but the API needs an account, so these papers are read
//                  only when OPENREVIEW_USERNAME and OPENREVIEW_PASSWORD are set.
// Lab blogs, GitHub PDFs and proceedings without an open license are left out.
//
// A paper's abstract is kept only when the paper is the benchmark's own: its title or abstract names the
// benchmark, and it is not a model report that only uses it. OWN and NOT_OWN below correct the cases those
// rules get wrong.
//
// By default the script fetches only benchmarks with no abstract yet. --all fetches every paper again.
// usage: node scripts/abstracts.ts [--all] [--only id,id] [--dry]
import { existsSync } from 'node:fs';
import { dataPath, readJson, writeJson, fetchText, fetchJson, today } from './lib/util.ts';
import { text as htmlText } from './lib/html.ts';

export interface Abstract {
  text: string;
  title: string;
  url: string;
  source: 'arxiv' | 'acl' | 'crossref' | 'openreview';
  /** How the page names the paper: "arXiv:2406.19314", "ACL 2024.emnlp-main.499", "doi:10.1038/sdata.2018.251". */
  ref: string;
  license: string;
  fetched: string;
}
interface Bench {
  id: string;
  name: string;
  aliases?: string[];
  links?: { paper?: string };
}
interface Paper {
  title: string;
  abstract: string;
  license: string;
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const all = process.argv.includes('--all');
const dry = process.argv.includes('--dry');
const only = arg('--only')?.split(',');

// Reviewed on 2026-11-01 against every paper link in data/benchmarks.json.
// Papers that introduce the benchmark without naming it in their title or abstract.
const OWN = new Set(
  'adversarial-squad ai2d anthropic-model-written-evals anthropic-red-team community-alignment-personalization-meta cyber-key-skills-v1-google deepmind-dangerous-capability-evaluations deepmind-mathematics devbench dynabench-squad functional-math gdm-situational-awareness gdm-stealth gram-gauging-realistic-agentic-misbehavior gray-swan-ipi-arena-benchmark gsm1k gsm8k-platinum lakera-b3-backbone-breaker-benchmark livemathbench metr-time-horizon-1-1 metr-time-horizon-suite mrcr-v1 mrcr-v2 mt-prompt-injection-test-suite openai-monitorability-evals political-science-llm-benchmark sgp-bench stealth-and-situational-awareness-evaluations sycophancy-eval-answer sycophancyeval vals-finance-agent-v1 vals-finance-agent-v2 vals-finance-agent-v2-1 xbench-profession-marketing xbench-profession-recruitment xbench-scienceqa'.split(' '),
);
// Papers that name the benchmark but are about a model, a method or a platform, with the benchmark a side note.
const NOT_OWN = new Set(
  'beyond-aime browsecomp-vl chatrag-bench cmimc-2025 crpe cv3-eval dpg-bench dream-1k flashdexretarget-50-motion-benchmark gorilla-api-bench halubench hr-bench humaneval-infilling humanevalpack imo-leanproofbench livesports-3k longbench-chat m-arenahard-v2 math-500 math-vr minimax-tts-multilingual-test-set mmeb mmeb-v2 mmmb molmoact2-sim-eval odv-bench olmocr-bench osworld-g refspatial-bench refspatial-expand-bench safelibero sarena screenspot seed-tts-eval smolinstruct spotsoundbench streambench-streamchat tracespatial-bench visualprobe vsi-super'.split(' '),
);

// ---- where each paper lives ------------------------------------------------------------------------

type Where = { source: Abstract['source']; key: string; ref: string; url: string } | { skip: string };

function locate(url: string): Where {
  const arxiv =
    url.match(/arxiv\.org\/(?:abs|pdf|html)\/(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z]{2})?\/\d{7})/i)?.[1] ??
    url.match(/huggingface\.co\/papers\/(\d{4}\.\d{4,5})/)?.[1] ??
    url.match(/10\.48550\/arxiv\.(\d{4}\.\d{4,5})/i)?.[1];
  if (arxiv) return { source: 'arxiv', key: arxiv, ref: `arXiv:${arxiv}`, url: `https://arxiv.org/abs/${arxiv}` };
  const acl = url.match(/aclanthology\.org\/([\w.-]+?)(?:\.pdf)?\/?$/)?.[1];
  if (acl) {
    // new ids start with the year (2024.emnlp-main.499), old ones carry two digits after the letter (D17-1088)
    const yy = acl.match(/^(\d{4})\./)?.[1] ?? acl.match(/^[A-Z](\d\d)-/)?.[1];
    const year = !yy ? 0 : yy.length === 4 ? Number(yy) : Number(yy) + (Number(yy) > 50 ? 1900 : 2000);
    if (year < 2016) return { skip: 'license does not allow reuse' };
    return { source: 'acl', key: acl, ref: `ACL ${acl}`, url: `https://aclanthology.org/${acl}/` };
  }
  const forum = url.match(/openreview\.net\/(?:forum|pdf)\?id=([\w-]+)/)?.[1];
  if (forum) return { source: 'openreview', key: forum, ref: `OpenReview ${forum}`, url: `https://openreview.net/forum?id=${forum}` };
  const doi =
    url.match(/doi\.org\/(10\.\d{4,9}\/[^\s?#]+)/)?.[1] ??
    url.match(/dl\.acm\.org\/doi\/(?:abs\/|full\/|pdf\/)?(10\.\d{4,9}\/[^\s?#]+)/)?.[1] ??
    url.match(/(?:bio|med)rxiv\.org\/content\/(10\.\d{4,9}\/[\d.]+?)(?:v\d+)?(?:[./?#]|$)/)?.[1];
  if (doi) return { source: 'crossref', key: doi, ref: `doi:${doi}`, url: `https://doi.org/${doi}` };
  return { skip: 'host terms do not allow reuse or are unclear' };
}

// ---- readers ---------------------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastArxiv = 0;

/** arXiv metadata for up to 100 ids a request, one request every three seconds. */
async function readArxiv(ids: string[]): Promise<Map<string, Paper>> {
  const out = new Map<string, Paper>();
  const ask = async (batch: string[]) => {
    for (let tries = 0; tries < 3; tries++) {
      await sleep(Math.max(0, lastArxiv + 3100 - Date.now()));
      lastArxiv = Date.now();
      try {
        return await fetchText(`https://export.arxiv.org/api/query?id_list=${batch.join(',')}&max_results=${batch.length}`, {}, 1);
      } catch (e) {
        if (tries === 2) console.log(`arXiv: ${(e as Error).message}`);
      }
    }
    return '';
  };
  const read = (xml: string) => {
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const e = m[1];
      const id = e.match(/<id>https?:\/\/arxiv\.org\/abs\/(.+?)(?:v\d+)?<\/id>/)?.[1];
      const title = e.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const summary = e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1];
      if (id && title && summary && title.trim() !== 'Error') out.set(id, { title: clean(title), abstract: clean(summary), license: 'CC0 1.0' });
    }
  };
  for (let i = 0; i < ids.length; i += 100) read(await ask(ids.slice(i, i + 100)));
  // the API now and then drops entries from a full batch: ask once more for the ones it left out
  const missed = ids.filter((id) => !out.has(id));
  for (let i = 0; i < missed.length; i += 100) read(await ask(missed.slice(i, i + 100)));
  return out;
}

async function readAcl(id: string): Promise<Paper | string> {
  await sleep(1000);
  const html = await fetchText(`https://aclanthology.org/${id}/`);
  const title = html.match(/<h2 id=["']?title["']?>([\s\S]*?)<\/h2>/)?.[1];
  const abstract = html.match(/acl-abstract["']?>[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1];
  if (!title || !abstract) return 'no abstract at the source';
  return { title: clean(htmlText(title)), abstract: clean(htmlText(abstract)), license: 'CC BY 4.0' };
}

/** A Creative Commons license that allows any reuse with credit: CC0 or CC BY, by URL. */
function openLicense(url: string): string | undefined {
  if (/creativecommons\.org\/publicdomain\/zero\//.test(url)) return 'CC0 1.0';
  const by = url.match(/creativecommons\.org\/licenses\/by\/(\d\.\d)/);
  return by ? `CC BY ${by[1]}` : undefined;
}

async function readCrossref(doi: string): Promise<Paper | string> {
  await sleep(1000);
  type W = { message: { title?: string[]; abstract?: string; license?: { URL: string; 'content-version'?: string }[] } };
  const w = (await fetchJson<W>(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)).message;
  const lic = w.license?.find((l) => l['content-version'] === 'vor') ?? w.license?.[0];
  const license = lic && openLicense(lic.URL);
  if (!license) return 'license does not allow reuse';
  if (!w.abstract || !w.title?.[0]) return 'no abstract at the source';
  return { title: clean(htmlText(w.title[0])), abstract: clean(htmlText(w.abstract.replace(/<jats:title>[\s\S]*?<\/jats:title>/g, ' '))), license };
}

let openreviewToken: Promise<string | undefined> | undefined;
async function readOpenreview(id: string): Promise<Paper | string> {
  const user = process.env.OPENREVIEW_USERNAME;
  const password = process.env.OPENREVIEW_PASSWORD;
  if (!user || !password) return 'needs an OpenReview account';
  const API = 'https://api2.openreview.net';
  openreviewToken ??= fetchJson<{ token: string }>(`${API}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: user, password }),
  }).then((r) => r.token);
  const token = await openreviewToken;
  await sleep(1000);
  type N = { notes: { content: Record<string, { value?: unknown }> }[] };
  const note = (await fetchJson<N>(`${API}/notes?id=${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${token}` } })).notes[0];
  const title = note?.content.title?.value;
  const abstract = note?.content.abstract?.value;
  if (typeof title !== 'string' || typeof abstract !== 'string') return 'no abstract at the source';
  return { title: clean(title), abstract: clean(abstract), license: 'CC0 1.0' };
}

// ---- cleaning --------------------------------------------------------------------------------------

const SYMBOLS: Record<string, string> = {
  infty: '∞', times: '×', sim: '~', approx: '≈', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', pm: '±',
  cdot: '⋅', ldots: '…', cdots: '…', dots: '…', rightarrow: '→', to: '→', leftarrow: '←', Rightarrow: '⇒', ll: '≪', gg: '≫',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', eta: 'η', theta: 'θ', kappa: 'κ', lambda: 'λ',
  mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω',
  degree: '°', circ: '°', checkmark: '✓', dagger: '†', star: '*', ast: '*', mid: '|', vert: '|', prime: '′', S: '§',
};
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', n: 'ⁿ' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
const script = (s: string, map: Record<string, string>, mark: string) => ([...s].every((c) => map[c]) ? [...s].map((c) => map[c]).join('') : mark === '_' ? s : `${mark}${s}`);

/** Plain text from an abstract: XML entities decoded, simple LaTeX turned into the characters it prints. */
export function clean(s: string): string {
  let t = htmlText(s);
  t = t.replace(/\\href\{[^{}]*\}\{([^{}]*)\}/g, '$1').replace(/\\url\{([^{}]*)\}/g, '$1');
  for (let i = 0; i < 3; i++)
    t = t
      .replace(/\\(?:textbf|textit|textrm|textsf|texttt|textsc|textnormal|emph|underline|text|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb|mathscr|boldsymbol|bm|operatorname|mbox|hbox)\s*\{([^{}]*)\}/g, '$1')
      .replace(/\{\\(?:bf|it|em|tt|sc|rm|sf)\s+([^{}]*)\}/g, '$1');
  // inline math: commands to characters, scripts to Unicode where they exist, then drop the dollars
  t = t.replace(/(?<!\\)\$([^$]{1,200}?)(?<!\\)\$/g, (_, m: string) =>
    m
      .replace(/\\([a-zA-Z]+)\s*/g, (c, name: string) => SYMBOLS[name] ?? (/^(left|right|big|Big|bigg|displaystyle|mathrm|quad|qquad|,)$/.test(name) ? '' : name))
      .replace(/\^\{([^{}]*)\}|\^(\S)/g, (_, a: string | undefined, b: string | undefined) => script(a ?? b ?? '', SUP, '^'))
      .replace(/_\{([^{}]*)\}|_(\w)/g, (_, a: string | undefined, b: string | undefined) => script(a ?? b ?? '', SUB, '_'))
      .replace(/\\[,;:! ]/g, ' ')
      .replace(/[{}]/g, ''),
  );
  t = t
    .replace(/\\([a-zA-Z]+)(?![a-zA-Z])\s?/g, (c, name: string) => SYMBOLS[name] ?? c)
    .replace(/\\([%&_#$])/g, '$1')
    .replace(/\\\\/g, ' ')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/``/g, '“')
    .replace(/''/g, '”')
    .replace(/---/g, '—')
    .replace(/(?<=\S)--(?=\S)|(?<=\s)--(?=\s)/g, '–')
    .replace(/([A-Za-z.,)])~(?=[A-Za-z0-9(])/g, '$1 ')
    .replace(/(?<!\\)[{}]/g, '');
  return t.replace(/\s+/g, ' ').trim();
}

// ---- is it the benchmark's own paper? ------------------------------------------------------------------

/** Lowercase words, so "SWE-bench", "SWE bench" and "SWEbench" meet. */
const words = (s: string) =>
  ` ${s.toLowerCase().replace(/τ/g, 'tau').replace(/∞/g, 'infinite').replace(/&/g, ' and ').replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, ' ').trim()} `;
interface Hay {
  w: string;
  list: string[];
}
const hay = (s: string): Hay => {
  const w = words(s);
  return { w, list: w.trim().split(' ') };
};
function names(h: Hay, name: string): boolean {
  const w = words(name).trim();
  if (!w) return false;
  if (h.w.includes(` ${w} `)) return true;
  // the same name with its parts written together or apart
  const f = w.replace(/ /g, '');
  if (f.length < 5 || !/\d|[a-z]{5}/.test(f)) return false;
  return h.list.some((_, i) => [1, 2, 3, 4].some((n) => h.list.slice(i, i + n).join('') === f));
}
/** Shorter forms of a name that still look coined: "LAB-Bench" from "LAB-Bench FigQA", "RACE" from "RACE-H". */
function bases(name: string): string[] {
  const n = name.replace(/\s*\([^)]*\)/g, '').trim();
  const toks = n.split(/\s+/);
  const out = new Set([n, toks[0].split(/[-/:]/)[0]]);
  for (let k = toks.length - 1; k >= 1; k--) out.add(toks.slice(0, k).join(' '));
  return [...out].filter((x) => words(x).replace(/ /g, '').length >= 3 && !/^ (the|an?|ai|llm|gpt) $/.test(words(x)) && /[a-z][A-Z]|[A-Z]{2}|\d|[-+]/.test(x));
}
/** An acronym of the title's capitalised words, so "MMLU" meets "Measuring Massive Multitask Language Understanding". */
const acronym = (title: string) =>
  title
    .split(/[\s:,-]+/)
    .filter((t) => /^[A-Z]/.test(t))
    .map((t) => t[0].toLowerCase())
    .join('');
// a model report: the title says so, or its subtitle introduces a model rather than a test
const REPORT =
  /\b(technical report|tech report|system card|model card|herd of models)\b|(?:^|:\s*)(an?|the)\s+(?:(?!benchmark|dataset|suite|evaluation|eval|test|leaderboard|arena|environment|platform|framework|toolkit|corpus|challenge)[\w.-]+\s+){0,5}(models?|llms?|mllms?|vlms?|vla)\b/i;
const modelNames = [
  ...new Set(
    readJson<{ name: string; family?: string; epoch?: string }[]>(dataPath('models.json'))
      .flatMap((m) => [m.name, m.family, m.epoch])
      .filter((n): n is string => !!n)
      .map((n) => words(n).trim())
      .filter((n) => n.length >= 3),
  ),
];

function own(b: Bench, p: Paper): boolean {
  if (OWN.has(b.id)) return true;
  if (NOT_OWN.has(b.id)) return false;
  const T = hay(p.title);
  const A = hay(p.abstract);
  const all = [b.name, ...(b.aliases ?? [])];
  if (all.some((n) => names(T, n))) return true;
  const short = all.flatMap(bases);
  if ([...all, ...short].some((n) => n === n.toUpperCase() && /^[A-Z0-9]{4,}$/.test(n) && acronym(p.title).includes(n.toLowerCase()))) return true;
  const head = words(p.title.split(':')[0]);
  const isModel = (s: string) => modelNames.some((m) => words(s).includes(` ${m} `));
  if (REPORT.test(p.title) || isModel(head)) return false;
  const coined = short.filter((n) => !isModel(n));
  return coined.some((n) => names(T, n)) || all.some((n) => names(A, n)) || coined.some((n) => names(A, n));
}

// ---- run -------------------------------------------------------------------------------------------

const outPath = dataPath('abstracts.json');
const current: Record<string, Abstract> = existsSync(outPath) ? readJson(outPath) : {};
const benchmarks = readJson<Bench[]>(dataPath('benchmarks.json'));
const out: Record<string, Abstract> = {};
const why = new Map<string, string[]>();
const leftOut = (id: string, reason: string) => why.set(reason, [...(why.get(reason) ?? []), id]);
const todo: { b: Bench; at: Extract<Where, { source: string }> }[] = [];

for (const b of benchmarks) {
  const paper = b.links?.paper;
  if (!paper) continue;
  const at = locate(paper);
  if ('skip' in at) {
    leftOut(b.id, at.skip);
    continue;
  }
  const have = current[b.id];
  const fresh = have && have.ref === at.ref && !NOT_OWN.has(b.id);
  if (fresh && (!all || (only && !only.includes(b.id)))) out[b.id] = have;
  else if (!only || only.includes(b.id)) todo.push({ b, at });
}

const papers = new Map<string, Paper | string>();
const arxivIds = [...new Set(todo.filter((t) => t.at.source === 'arxiv').map((t) => t.at.key))];
if (arxivIds.length) for (const [id, p] of await readArxiv(arxivIds)) papers.set(`arxiv:${id}`, p);
for (const { at } of todo) {
  const k = `${at.source}:${at.key}`;
  if (at.source === 'arxiv' || papers.has(k)) continue;
  try {
    papers.set(k, at.source === 'acl' ? await readAcl(at.key) : at.source === 'crossref' ? await readCrossref(at.key) : await readOpenreview(at.key));
  } catch (e) {
    papers.set(k, `could not be read (${(e as Error).message.slice(0, 80)})`);
  }
}
let added = 0;
for (const { b, at } of todo) {
  const p = papers.get(`${at.source}:${at.key}`) ?? 'could not be read';
  if (typeof p === 'string') {
    // a paper that could not be read this time keeps its last abstract
    if (current[b.id]?.ref === at.ref && p.startsWith('could not')) out[b.id] = current[b.id];
    else leftOut(b.id, p);
    continue;
  }
  if (!p.abstract) leftOut(b.id, 'no abstract at the source');
  else if (!own(b, p)) leftOut(b.id, 'the paper is about a model or a wider study, not this benchmark');
  else {
    if (current[b.id]?.ref !== at.ref) added++;
    out[b.id] = { text: p.abstract, title: p.title, url: at.url, source: at.source, ref: at.ref, license: p.license, fetched: today() };
  }
}

const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
if (!dry) writeJson(outPath, sorted);
const bySource = Object.entries(Object.values(sorted).reduce<Record<string, number>>((n, a) => ({ ...n, [a.ref.split(/[: ]/)[0]]: (n[a.ref.split(/[: ]/)[0]] ?? 0) + 1 }), {}));
console.log(
  `Abstracts for ${Object.keys(sorted).length} benchmarks (${bySource.map(([k, n]) => `${k} ${n}`).join(', ')}). ${added} new. ` +
    `${benchmarks.filter((b) => !b.links?.paper).length} benchmarks have no paper link.${dry ? ' Dry run: nothing written.' : ''}`,
);
for (const [reason, ids] of why) console.log(`  Left out, ${reason}: ${ids.length}${ids.length <= 8 ? ` (${ids.join(', ')})` : ''}`);
