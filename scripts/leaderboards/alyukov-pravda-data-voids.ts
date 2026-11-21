// The Pravda audit measures the percentage of answers that endorse disinformation. Read the authors’ coded responses in Dataverse and calculate the rates for each chatbot and country.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://dataverse.harvard.edu/api/access/datafile/12101101?format=original";
const board: Leaderboard = {
  benchmark: "alyukov-pravda-data-voids",
  url: "https://misinforeview.hks.harvard.edu/article/llms-grooming-or-data-voids-llm-powered-chatbot-references-to-kremlin-disinformation-reflect-information-gaps-not-manipulation/",
  feed: FEED,
  terms: "The authors released the Harvard Dataverse replication data under CC0 1.0. https://doi.org/10.7910/DVN/LHGU1O The host has no published robots directives at /robots.txt.",
  aliases: { Gemini: 'gemini-2-5-flash-jun-2025' },
  parts: { pravda: 'Referenced Pravda', both: 'Endorsed disinformation and referenced Pravda', responses: { name: 'Responses', unit: 'score' } },
  async fetch() {
    // Keep quoted answers intact while adapting the source separator for parseCsv.
    const csv = (await fetchText(FEED)).replace(/^\uFEFF/, '').replace(/"(?:[^"]|"")*"|[;,]/g, token => token === ';' ? ',' : token === ',' ? '\\uE000' : token);
    const groups = new Map<string, { model: string; setting: string; count: number; fake: number; pravda: number; both: number }>();
    for (const r of parseCsv(csv)) {
      const model = r.model, setting = r.country;
      const labels = [r.fake, r.pravda].map(v => v?.trim().toLowerCase());
      if (!model || !setting || !labels.every(v => v === 'yes' || v === 'no')) throw new Error('Missing audit code');
      const key = JSON.stringify([model,setting]);
      const g = groups.get(key) ?? { model, setting, count: 0, fake: 0, pravda: 0, both: 0 };
      g.count++; g.fake += Number(labels[0] === 'yes'); g.pravda += Number(labels[1] === 'yes'); g.both += Number(labels.every(v => v === 'yes'));
      groups.set(key,g);
    }
    if (groups.size < 8 || [...groups.values()].some(g => g.count < 52)) throw new Error('Missing model or country responses');
    return [...groups.values()].map(g => ({ model: g.model, setting: g.setting, score: 100 * g.fake / g.count,
      metrics: { pravda: 100 * g.pravda / g.count, both: 100 * g.both / g.count, responses: g.count } }));
  },
};
export default board;
