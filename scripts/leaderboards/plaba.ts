// PLABA tests plain-language adaptation of biomedical abstracts.
// The paper's Table 5 reports ROUGE, BLEU, BERTScore and SARI for six named models.
// The headline is SARI, the metric designed for text simplification.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC9811873/unicode';
type BioC = { documents: { passages: { text?: string }[] }[] }[];
const board: Leaderboard = {
  benchmark: 'plaba', static: 'paper', url: 'https://www.nature.com/articles/s41597-022-01920-3', feed: FEED,
  terms: 'The paper is CC BY 4.0. https://creativecommons.org/licenses/by/4.0/ Source attribution applies.',
  async fetch(): Promise<LeaderboardRow[]> {
    const body = await fetchJson<BioC>(FEED);
    const text = body.flatMap(c => c.documents.flatMap(d => d.passages.map(p => p.text ?? ''))).join('\n');
    const line = text.split('\n').find(x => x.startsWith('Algorithm Type') && x.includes('SARI'));
    if (!line) throw new Error('PLABA Table 5 missing');
    const rows: LeaderboardRow[] = [];
    const cells = line.split(/\t+/).map(x => x.trim()).filter(Boolean);
    const models = ['T5', 'PEGASUS', 'BART-Base', 'BART-Large-CNN', 'T5-No-Fine-Tune', 'T0PP'];
    for (const model of models) {
      const at = cells.indexOf(model);
      if (at < 0) continue;
      const values = cells.slice(at + 1, at + 7).map(x => x.split('/').map(Number).reduce((a, b) => a + b, 0) / x.split('/').length);
      if (values.length !== 6 || values.some(n => !Number.isFinite(n))) continue;
      rows.push({ model, trials: cells[at + 1].includes('/') ? 3 : undefined, score: values[5], metrics: { rouge1: values[0], rouge2: values[1], rougeL: values[2], bleu4: values[3], bertScoreF1: values[4] } });
    }
    if (rows.length !== 6) throw new Error(`Expected six PLABA rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
