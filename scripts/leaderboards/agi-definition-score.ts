// AGI Score from "A Definition of AGI" (Hendrycks et al.), shown under Automation on the CAIS AI Dashboard
// (dashboard.safe.ai). The page draws a radar of the ten cognitive domains for GPT-4 and GPT-5 from the
// paper; the per-domain points (each domain is worth 10) are the default props of that chart component,
// gpt4Data:{K:..,RW:..,..} and gpt5Data:{..}, in one of the page's JS chunks. The AGI Score is their sum
// (GPT-4 27%, GPT-5 57% in the paper). Only these two models have scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { CAIS_PAGE, CAIS_TERMS } from './cais-text-capabilities-index.ts';

const DOMAINS = ['K', 'RW', 'M', 'R', 'WM', 'MS', 'MR', 'V', 'A', 'S'];
const MODELS: Record<string, string> = { gpt4Data: 'GPT-4 (snapshot unspecified)', gpt5Data: 'GPT-5' };

const board: Leaderboard = {
  benchmark: 'agi-definition-score',
  url: `${CAIS_PAGE}#automation`,
  feed: `${CAIS_PAGE} (page JS chunk, AGI radar gpt4Data and gpt5Data, sum of ten domains)`,
  terms: CAIS_TERMS,
  async fetch() {
    const html = await fetchText(CAIS_PAGE);
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[\w-]+\.js/g)].map((m) => m[0]))];
    for (const c of chunks) {
      const js = await fetchText(new URL(c, CAIS_PAGE).href);
      if (!js.includes('gpt5Data:')) continue;
      const rows: LeaderboardRow[] = [];
      for (const [prop, model] of Object.entries(MODELS)) {
        const at = js.search(new RegExp(`${prop}:\\w+=\\{`));
        if (at < 0) throw new Error(`${prop} not found`);
        const d = jsLiteral<Record<string, number>>(js, js.indexOf('{', at));
        if (!DOMAINS.every((k) => typeof d[k] === 'number')) throw new Error(`unexpected ${prop} domains: ${Object.keys(d).join(', ')}`);
        rows.push({ model, score: DOMAINS.reduce((a, k) => a + d[k], 0) });
      }
      return rows;
    }
    throw new Error('AGI radar chunk not found');
  },
};
export default board;
