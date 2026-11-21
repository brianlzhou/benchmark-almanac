// GTA (General Tool Agents benchmark, OpenCompass). The README's current leaderboards (2025-03, 2026-02 and
// the GTA-2 board of 2026-04) are images, but the project page (open-compass.github.io/GTA) loads its
// leaderboard from docs/static/csv/gta.csv in the repository: the July 2024 board of 16 models with step
// metrics and AnsAcc, the end-to-end answer accuracy the paper ranks by. AnsAcc is the score. The file was
// last changed on 2024-07-03, which is passed as the run date so the resolver picks the snapshots then
// current (for example GPT-4o of May 2024). The CSV also reports eight step measures and weight access.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/open-compass/GTA/main/docs/static/csv/gta.csv';
const DATE = '2024-07-03';

const board: Leaderboard = {
  benchmark: 'gta-tool-agents',
  url: 'https://open-compass.github.io/GTA/',
  feed: `${FEED} (AnsAcc)`,
  terms: 'CSV in the Apache-2.0 open-compass/GTA GitHub repository, also served by its GitHub Pages project page.',
  stats: {
    instAcc: { name: 'Instruction-following accuracy', unit: '%', better: 'higher' },
    toolAcc: { name: 'Tool selection accuracy', unit: '%', better: 'higher' },
    argAcc: { name: 'Argument name accuracy', unit: '%', better: 'higher' },
    summAcc: { name: 'Final answer summary accuracy', unit: '%', better: 'higher' },
    pF1: { name: 'Perception tool-selection F1', unit: '%', better: 'higher' },
    oF1: { name: 'Operation tool-selection F1', unit: '%', better: 'higher' },
    lF1: { name: 'Logic tool-selection F1', unit: '%', better: 'higher' },
    cF1: { name: 'Creativity tool-selection F1', unit: '%', better: 'higher' },
  },
  aliases: {
    'claude3-opus': 'claude-3-opus',
    'gpt-4-1106-preview': 'gpt-4-turbo-nov-2023',
    'mixtral-8x7b-instruct': 'mixtral-8x7b',
    'llama3-70b-instruct': 'llama-3-70b',
    'llama3-8b-instruct': 'llama-3-8b',
    'yi-34b-chat': 'yi-34b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.AnsAcc);
      const metrics: Record<string, number> = {};
      for (const [column, key] of Object.entries({"InstAcc":"instAcc","ToolAcc":"toolAcc","ArgAcc":"argAcc","SummAcc":"summAcc","P_F1":"pF1","O_F1":"oF1","L_F1":"lF1","C_F1":"cF1"})) {
        if (r[column]?.trim() && Number.isFinite(Number(r[column]))) metrics[key] = Number(r[column]);
      }
      const open = r.opensourced === 'TRUE' ? true : r.opensourced === 'FALSE' ? false : undefined;
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model, score, date: DATE, open, metrics });
    }
    if (!rows.length) throw new Error('no AnsAcc rows');
    return rows;
  },
};
export default board;
