// Tests search by meaning against scripts/meaning/queries.json: plain-language requests, each with the benchmarks
// a good answer must include. It ranks with src/lib/meaning-rank.ts, the code the Build an index picker runs, and
// prints recall@10 (the share of a request's expected benchmarks in the top 10) and MRR (one over the rank of the
// first expected benchmark), for the dev and held-out requests apart. Versions of one benchmark count as one
// result, and any version of an expected benchmark counts as a hit.
//
// Two pools: the benchmarks the index builder can use (read from /build/matrix.json) and every benchmark.
//
//   TRANSFORMERS_DIR=/private/tmp/almanac-embed node scripts/meaning-eval.ts [options]
//     --vectors DIR    vectors to test (default public/meaning)
//     --matrix URL     the builder payload, a URL or a file (default http://localhost:4321/build/matrix.json)
//     --words W        weight of the word score (default WORD_WEIGHT in src/lib/meaning-rank.ts)
//     --show           print the top 10 for each request
//     --nofold         rank every version on its own (hits still count by family)
//     --fallback       rank by words alone, as a browser without WebGPU does
//     --name W         with --fallback, the weight of a name match (default NAME_WEIGHT)
//     --no-abstracts   leave paper abstracts out of the word score
//     --only TEXT      only requests that contain TEXT
//     --cap N          at most N picks whose names share a first word (default STEM_CAP, 0 for no cap)
//     --prior B        the scored-model prior's weight in the builder pool (default PRIOR_WEIGHT)
//
// The request vectors come from the same 4-bit model and query prompt the browser uses, and are cached in
// .cache/meaning/, so a rerun with new vectors embeds nothing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, dataPath, readJson } from './lib/util.ts';
import { MODEL, QUERY_PROMPT, loadLib } from './embed.ts';
import { buildLexicon, bm25, cosines, rank, readVectors, wordText, wordsOnly, capStems, familyKey, STEM_CAP, NAME_WEIGHT, WORD_WEIGHT, PRIOR_WEIGHT, prior, type Lexicon } from '../src/lib/meaning-rank.ts';

interface Query {
  q: string;
  split: 'dev' | 'held';
  want: string[];
}
interface Bench {
  id: string;
  name: string;
  family?: string;
  description?: string;
  note?: string;
}

const args = process.argv.slice(2);
const opt = (name: string, d = '') => (args.includes(name) ? args[args.indexOf(name) + 1] : d);
const VEC = opt('--vectors', join(ROOT, 'public', 'meaning'));
const MATRIX = opt('--matrix', 'http://localhost:4321/build/matrix.json');
const SHOW = args.includes('--show');
const NOFOLD = args.includes('--nofold');
const FALLBACK = args.includes('--fallback');
const NO_ABS = args.includes('--no-abstracts');
const NAME_W = Number(opt('--name', String(NAME_WEIGHT)));
const ONLY = opt('--only');
const CAP = Number(opt('--cap', String(STEM_CAP)));
const PRIOR = Number(opt('--prior', String(PRIOR_WEIGHT)));
const QUERY_DTYPE = 'q4';

const benchmarks = readJson<Bench[]>(dataPath('benchmarks.json'));
const byId = new Map(benchmarks.map((b) => [b.id, b]));
const family = (id: string) => familyKey(id, (x) => byId.get(x));
const { queries: all } = readJson<{ queries: Query[] }>(join(ROOT, 'scripts', 'meaning', 'queries.json'));
const queries = all.filter((x) => !ONLY || x.q.includes(ONLY));
for (const x of queries) for (const id of x.want) if (!byId.has(id)) throw new Error(`queries.json: unknown benchmark ${id} in "${x.q}"`);

// ---- the builder's benchmarks --------------------------------------------------------------------------
const CACHE = join(ROOT, '.cache', 'meaning');
mkdirSync(CACHE, { recursive: true });
/** The builder's benchmarks, with how many models each has scores for (the larger of its two sources). */
async function builderIds(): Promise<Map<string, number>> {
  const file = join(CACHE, 'builder-ids.json');
  try {
    const text = /^https?:/.test(MATRIX) ? await (await fetch(MATRIX)).text() : readFileSync(MATRIX, 'utf8');
    const p = JSON.parse(text) as { benches: [string][]; ind: number[][]; lab: number[][] };
    const out: [string, number][] = p.benches.map((b, i) => [b[0], Math.max(p.ind[i].length, p.lab[i].length) / 2]);
    writeFileSync(file, JSON.stringify(out));
    return new Map(out);
  } catch {
    if (existsSync(file)) return new Map(readJson<[string, number][]>(file));
    throw new Error(`Could not read the builder payload from ${MATRIX}. Start the dev server or pass --matrix.`);
  }
}

// ---- request vectors, cached -------------------------------------------------------------------------
async function requestVectors(texts: string[]): Promise<Map<string, number[]>> {
  const file = join(CACHE, 'queries.json');
  const cache: Record<string, number[]> = existsSync(file) ? readJson(file) : {};
  const k = (t: string) => `${MODEL}|${QUERY_DTYPE}|${QUERY_PROMPT}${t}`;
  const todo = texts.filter((t) => !cache[k(t)]);
  if (todo.length) {
    const { AutoConfig, AutoModel, AutoTokenizer, env } = await loadLib();
    env.cacheDir = join(ROOT, '.cache', 'transformers');
    const config = await AutoConfig.from_pretrained(MODEL);
    config.vision_config = config.audio_config = null;
    const net = await AutoModel.from_pretrained(MODEL, { config, dtype: QUERY_DTYPE, device: 'cpu' });
    const tok = await AutoTokenizer.from_pretrained(MODEL);
    for (const t of todo) {
      const { sentence_embedding } = await net(await tok([QUERY_PROMPT + t]));
      cache[k(t)] = Array.from(sentence_embedding.data as Float32Array).slice(0, 768).map((x) => Math.round(x * 1e6) / 1e6);
    }
    writeFileSync(file, JSON.stringify(cache));
  }
  return new Map(texts.map((t) => [t, cache[k(t)]]));
}

// ---- run -----------------------------------------------------------------------------------------------
const index = readJson<{ ids: string[]; dim: number }>(join(VEC, 'index.json'));
const bin = readFileSync(join(VEC, 'vectors.bin'));
const vectors = readVectors(index, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer);
const W = Number(opt('--words', String(WORD_WEIGHT)));
const abstracts = readJson<Record<string, { text: string }>>(dataPath('abstracts.json'));
const builder = await builderIds();
const reqs = FALLBACK ? new Map<string, number[]>() : await requestVectors(queries.map((x) => x.q));

// Each pool gets its own word index, as the picker builds one over the builder's benchmarks only: word rarity and
// the scale of the word score depend on which benchmarks are in it.
type Pool = 'builder' | 'all';
const POOLS: Record<Pool, (id: string) => boolean> = { builder: (id) => builder.has(id), all: () => true };
const rowOf = new Map(vectors.ids.map((id, r) => [id, r]));
const pools = Object.fromEntries(
  (Object.keys(POOLS) as Pool[]).map((pool) => {
    // the fallback ranks benchmarks with no vector too
    const ids = (FALLBACK ? benchmarks.map((b) => b.id) : vectors.ids).filter(POOLS[pool]);
    const lex: Lexicon = buildLexicon(ids.map((id) => wordText(byId.get(id) ?? {}, NO_ABS ? undefined : abstracts[id]?.text)));
    return [pool, { ids, lex, names: ids.map((id) => byId.get(id)?.name ?? id) }];
  }),
) as Record<Pool, { ids: string[]; lex: Lexicon; names: string[] }>;

// the scored-model prior applies where model counts are known: the builder pool
const liftFor = (pool: Pool) => (pool === 'builder' && PRIOR ? (id: string) => prior(builder.get(id) ?? 0, PRIOR) : undefined);
const sums: Record<string, { n: number; recall: number; mrr: number }> = {};
for (const x of queries) {
  const cos = FALLBACK ? null : cosines(vectors, reqs.get(x.q)!);
  for (const pool of ['builder', 'all'] as Pool[]) {
    const inPool = POOLS[pool];
    const P = pools[pool];
    // expected families that have a member in this pool
    const poolFams = new Set([...byId.keys()].filter(inPool).map(family));
    const want = new Set(x.want.map(family).filter((f) => poolFams.has(f)));
    if (!want.size) continue;
    let top;
    if (FALLBACK) {
      top = rank(P.ids, wordsOnly(P.lex, P.names, x.q, NAME_W), { lift: liftFor(pool), family: NOFOLD ? (id) => id : family, k: 100 });
    } else {
      // the pool's cosines and word scores, row by row in the pool's order
      const c = Float32Array.from(P.ids, (id) => cos![rowOf.get(id)!]);
      const kw = W ? bm25(P.lex, x.q) : undefined;
      top = rank(P.ids, c, { words: kw, wordWeight: W, lift: liftFor(pool), family: NOFOLD ? (id) => id : family, k: 100 });
    }
    if (CAP) top = capStems(top, (id) => byId.get(id)?.name ?? id, CAP);
    const top10 = new Set(top.slice(0, 10).map((r) => family(r.id)));
    const recall = [...want].filter((f) => top10.has(f)).length / want.size;
    const first = top.findIndex((r) => want.has(family(r.id)));
    const mrr = first >= 0 ? 1 / (first + 1) : 0;
    for (const key of [`${pool} ${x.split}`, `${pool} all`]) {
      const s = (sums[key] ??= { n: 0, recall: 0, mrr: 0 });
      s.n++;
      s.recall += recall;
      s.mrr += mrr;
    }
    if (SHOW && pool === 'builder') {
      console.log(`\n${x.q}  [${x.split}] recall@10 ${(recall * 100).toFixed(0)}%, first hit at ${first >= 0 ? first + 1 : 'none'}`);
      top.slice(0, 10).forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r.s.toFixed(3)} ${want.has(family(r.id)) ? '*' : ' '} ${byId.get(r.id)?.name ?? r.id}`));
    }
  }
}
const missing = benchmarks.filter((b) => !vectors.ids.includes(b.id)).length;
console.log(FALLBACK ? `\nwords only (no model), name weight ${NAME_W}, prior ${PRIOR}${NO_ABS ? ', no abstracts' : ''}` : `\nvectors: ${VEC} (${vectors.ids.length} rows, ${missing} benchmarks without one), word weight ${W}, prior ${PRIOR}, name cap ${CAP}${NO_ABS ? ', no abstracts' : ''}`);
console.log('pool     split  requests  recall@10   MRR');
for (const [k, s] of Object.entries(sums).sort()) {
  const [pool, split] = k.split(' ');
  console.log(`${pool.padEnd(8)} ${split.padEnd(6)} ${String(s.n).padStart(8)}  ${((s.recall / s.n) * 100).toFixed(1).padStart(8)}%  ${(s.mrr / s.n).toFixed(3)}`);
}
