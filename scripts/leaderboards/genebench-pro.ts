// GeneBench-Pro. The article publishes pass rate across reasoning efforts and a max-reasoning
// comparison. Join matching model/effort rows without losing other providers or Pro runs.
// nonmaskedSollen is the source's "Tokens used" axis, kept as a metric because its precise
// accounting is not specified as average output tokens per task in the article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, OPENAI_TERMS } from '../lib/boards/openai-cov8.ts';
const PAGE = 'https://openai.com/index/introducing-genebench-pro/';
const board: Leaderboard = {
  benchmark: 'genebench-pro', url: PAGE, feed: `${PAGE} (embedded passrate and scaling charts)`, terms: OPENAI_TERMS,
  chart: { title: 'GeneBench-Pro: Test-time compute scaling', x: { key: 'tokensUsed', label: 'Tokens used', better: 'lower' }, y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' } },
  async fetch() {
    const specs = await openaiSpecs(PAGE), rows = new Map<string, LeaderboardRow>();
    for (const r of chartValues(specs, 'GeneBench-Pro: Test-time compute scaling on GPT models')) {
      if (typeof r.model !== 'string' || typeof r.passrate !== 'number') continue;
      const setting = String(r.reasoning);
      rows.set(`${r.model}|${setting}`, { model: r.model, setting, score: r.passrate * 100, metrics: typeof r.nonmaskedSollen === 'number' ? { tokensUsed: r.nonmaskedSollen } : undefined });
    }
    for (const r of chartValues(specs, 'GeneBench-Pro: Model passrates at max reasoning')) {
      if (typeof r.model !== 'string' || typeof r.passrate !== 'number') continue;
      const match = r.model.match(/^(.*?) \(([^)]+)\)$/);
      const model = match?.[1] ?? r.model, setting = match?.[2].toLowerCase() ?? 'max available reasoning';
      const key = `${model}|${setting}`;
      if (rows.has(key)) {
        if (Math.abs(rows.get(key)!.score - r.passrate * 100) > 0.001) throw new Error(`GeneBench inconsistent charts for ${key}`);
      } else rows.set(key, { model, setting, score: r.passrate * 100 });
    }
    if (!rows.size) throw new Error('GeneBench-Pro has no pass rates');
    return [...rows.values()];
  },
};
export default board;
