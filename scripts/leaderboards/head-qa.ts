// HEAD-QA reports average accuracy on Spanish healthcare exams for supervised and unsupervised systems.
// The authors publish overall accuracy, points and discipline-level results in six HTML tables.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const url = 'https://aghie.github.io/head-qa/';
const disciplines = ['Biology', 'Medicine', 'Nursing', 'Pharmacology', 'Psychology', 'Chemistry'];
const board: Leaderboard = {
  benchmark: 'head-qa', url: url + '#leaderboard-general', feed: url,
  terms: 'Public result tables credited to the HEAD-QA authors. The project’s reuse conditions refer to the exam documents.',
  parts: Object.fromEntries(disciplines.map(d => [d, d])),
  async fetch() {
    const html = await fetchText(url);
    const tableAt = (id: string) => {
      const marker = `id="${id}"`;
      if (!html.includes(marker)) throw new Error('Missing HEAD-QA section ' + id);
      return tables(html.slice(html.indexOf(marker)))[0];
    };
    return ['unsupervised', 'supervised'].flatMap((setting, i) => {
      const general = tableAt(setting + '-setting');
      const suffix = i ? '-1' : '';
      const accuracy = tableAt('accuracy' + suffix), points = tableAt('points' + suffix);
      if (general.length < 3 || general[0][1]?.text !== 'Avg. accuracy' || general[0][2]?.text !== 'Avg. POINTS') throw new Error('Missing HEAD-QA overall scores');
      return general.slice(1).map(c => {
        const model = c[0].text, metrics: Record<string, number> = { points: Number(c[2].text) };
        for (const [t, key] of [[accuracy, ''], [points, ' Points']] as const) {
          const row = t.slice(1).find(r => r[0].text === model);
          for (const subject of disciplines) {
            const value = row?.[t[0].findIndex(h => h.text === subject)]?.text;
            if (!value || !Number.isFinite(Number(value))) throw new Error('Missing HEAD-QA discipline');
            metrics[subject + key] = Number(value);
          }
        }
        if (!c[1].text || !Number.isFinite(Number(c[1].text))) throw new Error('Missing HEAD-QA accuracy');
        return { model, setting, score: Number(c[1].text), metrics, link: c[0].html.match(/href="([^"]+)"/)?.[1] };
      });
    });
  },
};
export default board;
