// LiveSecBench: read the current edition's CSV from the homepage's Dataset distribution metadata.
// overall_score is the published safety score from 0 to 100, not the original paper's Elo rating.
// Area scores remain metrics. Provider model ids identify snapshots more precisely than display names.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://livesecbench.intokentech.cn/';
const board: Leaderboard = {
  benchmark: 'livesecbench', url: PAGE,
  feed: `${PAGE} (current Dataset distribution CSV, overall_score)`,
  terms: 'Intoken permits crawling under robots.txt and publishes this results CSV, with attribution retained and no separate score reuse license stated.',
  aliases: {
    'Kimi-K2-0711': 'kimi-k2-jul-2025',
    'mistralai/mistral-large-2411': 'mistral-large-2-nov-2024',
    'mistralai/mistral-large-2512': 'mistral-large-3',
    'deepseek/deepseek-chat-v3-0324': 'deepseek-v3-mar-2025',
    // The CSV's model_url identifies Qwen's Instruct-2507 repository.
    'qwen/qwen3-235b-a22b-2507': 'qwen3-235b-a22b-instruct-jul-2025',
  },
  async fetch() {
    const page = await fetchText(PAGE);
    const path = page.match(/"contentUrl"\s*:\s*"(\/data\/[\w.-]+\.csv)"/)?.[1];
    if (!path) throw new Error('LiveSecBench current CSV link missing');
    await new Promise(resolve => setTimeout(resolve, 1100));
    const source = parseCsv(await fetchText(new URL(path, PAGE).href));
    if (!source.length || !('overall_score' in source[0])) throw new Error('LiveSecBench overall_score column missing');
    return source.filter(r => r.model_name && r.overall_score.trim() && Number.isFinite(Number(r.overall_score))).map(r => {
      // Keep a dated display name when the provider id omits that snapshot.
      let model = /20\d\d-\d\d-\d\d/.test(r.model_name) || (/-\d{4}$/.test(r.model_name) && !/-\d{4}$/.test(r.model_id))
        ? r.model_name : (r.model_id || r.model_name);
      // The resolver otherwise strips these tags and assigns different catalog releases.
      if (/^(?:Ernie-5\.0-Preview-1022|hunyuan-t1-20250822)$/i.test(model)) model += ' (snapshot not cataloged)';
      if (/^(?:gpt-4o|gpt-4-turbo|gemini-2\.5-(?:pro|flash)|deepseek-(?:r1|v3))$/i.test(model.replace(/^[\w.-]+\//, ''))) model += ' (snapshot unspecified)';
      const dateParts = r.evaluation_date?.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
      return { model, score: Number(r.overall_score),
        date: dateParts ? `${dateParts[1]}-${dateParts[2].padStart(2, '0')}-${dateParts[3].padStart(2, '0')}` : undefined,
        metrics: Object.fromEntries(['ethics', 'legality', 'privacy', 'factuality', 'psychological_health'].flatMap(k =>
          r[k]?.trim() && Number.isFinite(Number(r[k])) ? [[k, Number(r[k])]] : [])),
      };
    });
  },
};
export default board;
