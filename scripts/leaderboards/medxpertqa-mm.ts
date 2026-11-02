// MedXpertQA-MM (Tsinghua C3I). medxpertqa.github.io is a static page with three leaderboard tables: the
// combined board, MedXpertQA Text and MedXpertQA MM. The MM table (the one whose models are all vision
// models, header "# | Model | Org | Date | Reasoning | Understanding | Avg ...") gives accuracy on the
// multimodal subset. Avg is the score. The Date column (YYYY-MM) is kept for snapshot matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://medxpertqa.github.io/';

const board: Leaderboard = {
  benchmark: 'medxpertqa-mm',
  url: URL,
  feed: `${URL} (static HTML table, MM subset, Avg)`,
  terms: 'Static GitHub Pages site; the MedXpertQA repository is MIT-licensed and the page states no other terms.',
  aliases: {
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    // dated 2024-12 on the board, the December 2024 experimental release
    'Gemini-2.0-Flash': 'gemini-2-0-flash-dec-2024',
  },
  async fetch() {
    // the two single-subset tables share one header. The MM one lists only multimodal (LMM) models
    const candidates = tables(await fetchText(URL)).filter((t) => {
      const head = t[0]?.map((c) => c.text);
      return head?.[1] === 'Model' && head.includes('Avg') && head.length < 13;
    });
    const t = candidates.find((rows) => rows.slice(1).every((r) => r.some((c) => c.text === 'LMM')));
    if (!t) throw new Error('MedXpertQA MM table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iDate, iAvg] = [head.indexOf('Model'), head.indexOf('Date'), head.indexOf('Avg')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text;
      const score = num(r[iAvg]?.text);
      const date = r[iDate]?.text;
      if (model && score !== undefined) rows.push({ model, score, date: /^\d{4}-\d\d$/.test(date ?? '') ? `${date}-01` : undefined });
    }
    return rows;
  },
};
export default board;
