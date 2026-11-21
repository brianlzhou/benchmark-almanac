// Hume's Voice Replication Leaderboard measures how well text-to-speech systems reproduce reference speakers.
// The headline score is the Overall tab's mean human same-speaker rating on a 1 to 5 scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://humeai-voice-replication-leaderboard.hf.space/';
const SCOPES = ['overall', 'standard', 'emotional', 'accent'] as const;
const rowRe = /<tr[^>]*>.*?<td class='prov'>(.*?)<\/td>(.*?)<\/tr>/gs;

const board: Leaderboard = {
  benchmark: 'voice-replication-hume',
  url: 'https://huggingface.co/spaces/HumeAI/voice-replication-leaderboard',
  feed: PAGE,
  parts: {
    standard: { name: 'Standard', group: 'Reference type' },
    emotional: { name: 'Emotional', group: 'Reference type' },
    accent: { name: 'Accent', group: 'Reference type' },
  },
  terms: 'The Space is Apache-2.0. Its backing dataset is private, while the public Space renders the leaderboard table. https://huggingface.co/spaces/HumeAI/voice-replication-leaderboard',
  stats: { quality: {name: 'Quality', unit: 'score', better: 'higher'}, naturalness: {name: 'Naturalness', unit: 'score', better: 'higher'}, titanet: {name: 'TitaNet similarity', unit: 'score', better: 'higher'}, differentPerson: {name: 'Different-person similarity', unit: 'score', better: 'lower'} },
  async fetch() {
    let html = await fetchText(PAGE);
    for (const [from, to] of [['\\u003c', '<'], ['\\u003e', '>'], ['\\u0027', "'"], ['\\u0026', '&']] as const) html = html.replaceAll(from, to);
    const tables = [...html.matchAll(/<table class='lb'>.*?<\/table>/gs)].map((m) => m[0]);
    if (tables.length !== 4) throw new Error(`Voice Replication: expected four tabs, found ${tables.length}`);
    const byModel = new Map<string, LeaderboardRow>();
    for (let ti = 0; ti < tables.length; ti++) {
      for (const m of tables[ti].matchAll(rowRe)) {
        const values = [...m[2].matchAll(/data-v='([^']+)'/g)].map((x) => Number(x[1]));
        if (values.length !== 5 || values.some((x) => !Number.isFinite(x))) throw new Error('Voice Replication: malformed score row');
        const model = m[1];
        let row = byModel.get(model);
        if (!row) {
          row = { model, score: values[0], metrics: { quality: values[1], naturalness: values[2], titanet: values[3], differentPerson: values[4] } };
          byModel.set(model, row);
        }
        if (ti > 0) row.metrics![SCOPES[ti]] = values[0];
      }
    }
    if (byModel.size !== 13) throw new Error(`Voice Replication: expected 13 models, found ${byModel.size}`);
    return [...byModel.values()];
  },
};
export default board;
