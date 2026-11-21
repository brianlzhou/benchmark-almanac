// POPE tests whether a vision-language model reports objects that are absent from an image.
// OpenCompass ranks models by the average F1 percentage across random, popular and adversarial questions.
// Its Space reads OpenVLM.json, which also supplies accuracy, precision, recall and the evaluation date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_URL } from './openvlm-leaderboard.ts';
import { OPENVLM_FEED, openvlmInfo, type OpenVlmEntry } from '../lib/boards/openvlm.ts';
import { fetchJson } from '../lib/util.ts';

interface Entry {
  META: NonNullable<OpenVlmEntry['META']>;
  POPE?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'pope',
  host: 'OpenCompass',
  url: OPENVLM_URL,
  feed: OPENVLM_FEED,
  verified: 'marked verified by OpenCompass',
  stats: {
    acc: { name: 'Accuracy', unit: '%', better: 'higher' },
    precision: { name: 'Precision', unit: '%', better: 'higher' },
    recall: { name: 'Recall', unit: '%', better: 'higher' },
  },
  terms: 'The Space declares Apache 2.0. Hugging Face permits the page in robots.txt. The feed states no data license and its host returns HTTP 403 for robots.txt.',
  aliases: {
    ...OPENVLM_ALIASES,
    'GPT-4o (0513, detail-high)': 'gpt-4o-may-2024',
    'GPT-4o (0513, detail-low)': 'gpt-4o-may-2024',
    'GPT-4o (0806, detail-high)': 'gpt-4o-aug-2024',
    'GPT-4o-mini (0718, detail-high)': 'gpt-4o-mini',
    'GPT-4v (0409, detail-high)': 'gpt-4-turbo-apr-2024',
    'GPT-4v (1106, detail-low)': 'gpt-4v',
    'InternLM-XComposer2': 'internlm-xcomposer2-vl-7b',
    'Slime-8B': 'slime-llama3-8b',
  },
  async fetch() {
    const { results } = await fetchJson<{ results: Record<string, Entry> }>(OPENVLM_FEED);
    const rows: LeaderboardRow[] = [];
    for (const { META, POPE } of Object.values(results)) {
      if (!POPE) continue;
      const model = META.Method?.[0]?.trim();
      const date = META.Time?.split('/').map(n => n.padStart(2, '0')).join('-');
      if (!model || !date?.match(/^\d{4}-\d{2}-\d{2}$/))
        throw new Error('OpenCompass: missing POPE model name or evaluation date');
      const { Overall, acc, precision, recall } = POPE;
      if (![Overall, acc, precision, recall].every(n => Number.isFinite(n) && n >= 0 && n <= 100))
        throw new Error('OpenCompass: invalid POPE score or metric for ' + model);
      rows.push({
        // The registry's Reka Edge is a 2026 model. Qualify the 2024 entry to keep its score separate.
        model: model === 'RekaEdge' && date.startsWith('2024-') ? 'RekaEdge (2024)' : model,
        score: Overall,
        metrics: { acc, precision, recall },
        date,
        setting: model.match(/\b(detail-\w+)\)/)?.[1],
        link: META.Method?.[1],
        ...openvlmInfo(META),
      });
    }
    if (rows.length < 216) throw new Error('OpenCompass: expected at least 216 POPE scores, found ' + rows.length);
    return rows;
  },
};
export default board;
