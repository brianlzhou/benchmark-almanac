// SEA-HELM. AI Singapore keeps the live SEA-HELM leaderboard at leaderboard.sea-lion.ai (the HELM copy on
// crfm.stanford.edu stopped at v1.2.0 in April 2025 and has no overall score). The site is a TanStack Start
// app that renders on the server and ships its route data in a hydration script (`$R[n]={...}` objects).
// The /detailed/SEA page's loader data has `seaRows`: per model run its id ("gemma-4-31B-it"), whether it
// ran with reasoning, and `mean`, the SEA Overall score (mean of 2,000 bootstraps over the SEA languages),
// which is the headline. The page filters by size and openness in its query string, so the importer asks
// for every size and closed models too. A model run both with and without reasoning gets the settings
// "thinking" and "non-thinking". Quantization suffixes (FP8, BF16, NVFP4) are dropped from the name. The
// bootstrap 95% interval (ci95Lower, ci95Upper) is kept as its half-width in metrics "ci".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://leaderboard.sea-lion.ai/';
const FEED = `${SITE}detailed/SEA?minSize=0&maxSize=1000000&showClosedSourceModels=true&showNonReasoningModels=true&showQuantizedModels=false`;

const board: Leaderboard = {
  benchmark: 'sea-helm',
  url: SITE,
  feed: `${FEED} (server-rendered loader data, seaRows: SEA Overall)`,
  terms: 'Public leaderboard by AI Singapore, server-rendered (no robots.txt, no terms page); the SEA-HELM code is MIT-licensed.',
  aliases: {
    'Llama-4-Maverick-17B-128E-Instruct': 'llama-4-maverick',
    'Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'gemma-4-26B-A4B-it': 'gemma-4-26b-a4b',
    'gemma-3-12b-it': 'gemma-3-12b',
    'gemma-3-4b-it': 'gemma-3-4b',
    'Mistral-Small-4-119B-2603': 'mistral-small-4',
    'NVIDIA-Nemotron-3-Super-120B-A12B': 'nemotron-3-super',
    'NVIDIA-Nemotron-3-Ultra-550B-A55B': 'nemotron-3-ultra',
    'command-a-plus-05-2026': 'command-a-plus',
    'Muse-Glimmer-30B': 'muse-glimmer',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const start = html.indexOf('seaRows:');
    const end = html.indexOf('],langRows:', start);
    if (start < 0 || end < 0) throw new Error('seaRows not found in the SEA-HELM page');
    const languages: Record<string, string> = { my: 'Burmese', tl: 'Tagalog', id: 'Indonesian', ms: 'Malay', ta: 'Tamil', th: 'Thai', vi: 'Vietnamese' };
    board.parts = Object.fromEntries(Object.entries(languages).map(([key, name]) => [key, { name, group: 'Language' }]));
    const perLanguage = new Map<string, Record<string, number>>();
    for (const chunk of html.slice(end + 2).split('],', 1)[0].split(/\$R\[\d+\]=\{/).slice(1)) {
      const model = chunk.match(/,model:"([^"]+)"/)?.[1];
      const lang = chunk.match(/,language:"([^"]+)"/)?.[1];
      if (!model || !lang || !languages[lang]) continue;
      const key = model + ':' + /isReasoning:1/.test(chunk);
      const metrics = perLanguage.get(key) ?? {};
      for (const [field, suffix] of [['mean', ''], ['ci95Lower', 'Low'], ['ci95Upper', 'High']]) {
        const value = Number(chunk.match(new RegExp(',' + field + ':([\\d.]+)'))?.[1]);
        if (Number.isFinite(value)) metrics[lang + suffix] = value;
      }
      perLanguage.set(key, metrics);
    }
    const runs: { raw: string; params?: number; model: string; reasoning: boolean; score: number; ci?: number; low?: number; high?: number }[] = [];
    for (const chunk of html.slice(start, end).split(/\$R\[\d+\]=\{/).slice(1)) {
      const model = chunk.match(/(?:^|,)model:"([^"]+)"/)?.[1];
      const mean = Number(chunk.match(/,mean:([\d.]+)/)?.[1]);
      if (!model || !Number.isFinite(mean)) continue;
      const lo = Number(chunk.match(/,ci95Lower:([\d.]+)/)?.[1]);
      const hi = Number(chunk.match(/,ci95Upper:([\d.]+)/)?.[1]);
      const ci = Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo ? (hi - lo) / 2 : undefined;
      const size = Number(chunk.match(/,modelSize:([\d.]+)/)?.[1]);
      runs.push({ raw: model, params: Number.isFinite(size) ? size : undefined, model: model.replace(/[-_](FP8|BF16|NVFP4|bf16|fp8)$/i, ''), reasoning: /isReasoning:1/.test(chunk), score: mean, ci, ...(ci !== undefined ? { low: lo, high: hi } : {}) });
    }
    if (!runs.length) throw new Error('no SEA-HELM rows');
    return runs.map((r) => ({
      model: r.model,
      params: r.params, low: r.low, high: r.high,
      score: Math.round(r.score * 100) / 100,
      setting: r.reasoning ? 'thinking' : 'non-thinking',
      metrics: { ...perLanguage.get(r.raw + ':' + r.reasoning), ...(r.ci !== undefined ? { ci: r.ci } : {}) },
    }));
  },
};
export default board;
