// MHPP (Mostly Hard Python Problems). The makers' leaderboard at sparksofagi.github.io/MHPP (linked from the
// SparksofAGI/MHPP README) loads new_mhpp.csv and ranks models by "Greedy", pass@1 with greedy decoding over the
// 210 problems (0 to 100). Greedy is the score. The sampled overall pass@1 and pass@5 columns are kept as
// metrics.passAt1 and metrics.passAt5 (%). Names carry the snapshot date ("GPT-4o-2024-05-13"), which the
// resolver reads, or the size. The row "Claude 3 Haiku 20241022" names Claude 3 Haiku with the date of Claude
// 3.5 Haiku, so it remains unlisted with an explicit inconsistent-identity label.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://sparksofagi.github.io/MHPP/new_mhpp.csv';

const board: Leaderboard = {
  benchmark: 'mhpp',
  url: 'https://sparksofagi.github.io/MHPP/',
  feed: `${FEED} (Greedy)`,
  terms: 'Static CSV on the MHPP GitHub Pages site, which states no license; scores are cited to the MHPP authors.',
  aliases: {
    'Claude 3.5 Sonnet 20241022': 'claude-3-5-sonnet-october-2024',
    'Mistral Large 2': 'mistral-large-2-jul-2024',
    'GPT-3.5-Turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'Phi-3-small 7B': 'phi-3-small-7-4b',
    'Gemma2 IT 2B': 'gemma-2-2b-it',
    'Gemma2 IT 9B': 'gemma-2-9b',
    'Gemma2 IT 27B': 'gemma-2-27b',
    'Mixtral 8x22b Instruct v0.1': 'mixtral-8x22b',
    'Mixtral 8x7B Instruct v0.1': 'mixtral-8x7b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Greedy);
      let model = r.Model?.trim();
      if (model === 'Claude 3 Haiku 20241022') model += ' (inconsistent source identity)';
      if (!model || !r.Greedy?.trim() || !Number.isFinite(score)) continue;
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      const metrics: Record<string, number> = {};
      for (const [k, col] of [['passAt1', 'pass@1'], ['passAt5', 'pass@5']] as const) {
        const v = r[col]?.trim() ? Number(r[col]) : NaN;
        if (Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({ model, score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
