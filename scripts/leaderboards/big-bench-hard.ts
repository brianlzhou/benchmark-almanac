// BIG-Bench Hard: Table 2 reports BBH all (23 tasks), in percent, for three models and two prompting modes.
//  These are the paper's static results and will not refresh with new model releases.
//  The main table gives PaLM CoT 65.2, while appendix Table 3 says 63.3. Keep the main headline table.
//  Keep both task groups, the 23 appendix task scores, and the count above the average human rater. Human and composite prior-best rows are not model runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { tables, num } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2210.09261";

const board: Leaderboard = {
  benchmark: "big-bench-hard", static: 'paper',
  parts: {
    nlp: { name: 'NLP', group: 'Task type' },
    algorithmic: { name: 'Algorithmic', group: 'Task type' },
  },
  url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const appendix = flatPaperTables(html).map(grid).find(t => t[1]?.[0] === 'BIG-Bench Hard Task');
    const t = tables(html).find(t => t[0]?.some(c => c.text.includes('BBH all')));
    if (!t) throw new Error('BBH main results table missing');
    let model = '';
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const label = r[0]?.text ?? '';
      if (/^PaLM|^InstructGPT|^Codex/.test(label)) model = label;
      if (!model || !/^[-−] (Answer-only|CoT) prompting/.test(label)) continue;
      const score = num(r[1]?.text);
      if (score === undefined) throw new Error('BBH score missing');
      const metrics: Record<string, number> = { nlp: num(r[2].text)!, algorithmic: num(r[3].text)! };
      const above = r[4]?.text.match(/^(\d+) \/ 23$/);
      if (above) metrics.tasksAboveHumanAverage = Number(above[1]);
      const column = appendix?.[0].findIndex((name, i) => model.startsWith(name) && appendix[1][i] === (label.includes('CoT') ? 'CoT' : 'AO'));
      if (appendix && column !== undefined && column >= 0) {
        for (const task of appendix.slice(2)) {
          if (/^(?:NLP Task|Algorithmic Task|All Tasks)/.test(task[0])) continue;
          const name = task[0].replace(/\s*λ/g, '').replace(/\s*\( avg \)/g, '').trim();
          const value = num(task[column]);
          if (value !== undefined) {
            metrics[name] = value;
            board.parts![name] = { name, group: 'Task' };
          }
        }
      }
      rows.push({ model, score, setting: label.replace(/^[-−] /, ''), metrics });
    }
    if (rows.length !== 6) throw new Error(`BBH expected six paper rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
