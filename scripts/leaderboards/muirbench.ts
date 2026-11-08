// MuirBench: the main table's Overall accuracy covers all 2,600 answerable and unanswerable questions.
//  These are the paper's static results and will not refresh with new model releases.
//  The paper splits twelve task columns across two tables. They remain metrics on the overall row.
//  Nested header tables are flattened before using the shared HTML reader. Undated API models stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2406.09411";

const board: Leaderboard = {
  benchmark: "muirbench",
  url: "https://arxiv.org/abs/2406.09411",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    let depth = 0;
    const html = (await fetchText(FEED)).replace(/<\/?table\b[^>]*>/gi, tag => {
      if (tag.startsWith('</')) return --depth === 0 ? tag : '';
      return ++depth === 1 ? tag : '';
    });
    const ts = tables(html);
    const t = ts.find(t => t.some(r => r.some(c => c.text === 'Overall')) && t.some(r => r[0]?.text.startsWith('GPT-4o')));
    const second = ts.find(t => t.some(r => r.some(c => c.text === 'Difference.')) && t.some(r => r[0]?.text.startsWith('GPT-4o')));
    if (!t || !second) throw new Error('MuirBench results tables missing');
    const clean = (s: string) => s.replace(/\s*\[\s*\d+\s*\]/g, '').replace(/^(Yi-VL-6B) 6$/, '$1');
    const rows = t.filter(r => r.length === 8 && num(r[1]?.text) !== undefined && !/^(Human|Random)/.test(r[0].text)).map(r => {
      const model = clean(r[0].text);
      const metrics: Record<string, number> = {};
      ['counting', 'action', 'grounding', 'matching', 'ordering', 'scene'].forEach((k, i) => {metrics[k] = num(r[i + 2].text)!;});
      const s = second.find(s => clean(s[0]?.text ?? '') === model);
      if (!s || s.length !== 7) throw new Error(`MuirBench secondary metrics missing for ${model}`);
      ['difference', 'cartoon', 'diagram', 'geographic', 'attribute', 'retrieval'].forEach((k, i) => {metrics[k] = num(s[i + 1].text)!;});
      return {model: /^(GPT-4o|GPT-4-Turbo|Gemini Pro)$/.test(model) ? `${model} (snapshot unspecified)` : model, score: num(r[1].text)!, metrics};
    });
    if (rows.length !== 20) throw new Error(`MuirBench expected 20 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
