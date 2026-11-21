// Neptune evaluates long-video question answering. Tables 3 and 4 report Neptune-Full multiple-choice accuracy.
// Table 6 gives per-task accuracies for the configurations it evaluates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2412.09582';
const board: Leaderboard = {
  benchmark: 'neptune', static: 'paper', url: 'https://arxiv.org/abs/2412.09582', feed, terms: PAPER_TERMS,
  aliases: { 'GPT-4o': 'gpt-4o-may-2024', 'Gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024', 'MiniCPM-v': 'minicpm-v-2-6' },
  stats: {
    gem: { name: 'Gemma Equivalence Metric score', unit: '%', better: 'higher', note: 'Gemma Equivalence Metric for open-ended answers on Neptune.' },
    mmhGem: { name: 'Multimodal human-annotated Gemma metric score', unit: '%', better: 'higher', note: 'Gemma Equivalence Metric on the multimodal human-annotated subset.' },
  },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'Method|Modalities|Neptune-Full|Neptune-Full|Neptune-MMH|Neptune-MMH');
    const variants = tables.find(t => t[0]?.slice(0,4).join('|') === 'Method|ASR|Num. frames|Neptune-Full');
    const tasks = tables.find(t => t[0]?.at(-1) === 'Task-avg');
    if (!main || !variants || !tasks || tasks[0].length !== 15 || main[1][2] !== 'Acc. %' || variants[1][3] !== 'Acc. %') throw new Error('Missing Neptune result columns');
    const keys = tasks[0].slice(2,-1);
    board.parts = { mmh: 'Neptune-MMH', ...Object.fromEntries(keys.map(k => [k,k])) };
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, cells: string[], detail?: string[]) {
      if (cells.length !== 4) throw new Error('Incomplete Neptune row');
      const [acc, gem, mmh, mmhGem] = cells;
      const metrics: Record<string, number> = {mmh: numberCell(mmh)};
      if (gem !== 'N/A') metrics.gem = numberCell(gem.replace(/^\*/, ''));
      if (mmhGem !== 'N/A') metrics.mmhGem = numberCell(mmhGem);
      if (detail) keys.forEach((k,i) => { metrics[k] = numberCell(detail[i+2]); });
      rows.push({model, setting, score: numberCell(acc.replace(/^\\ddagger/, '')), metrics});
    }
    for (const [name, setting, ...values] of main.slice(2)) {
      if (!setting || name === 'Random') continue;
      const alias = name.startsWith('MA-LMM') ? 'MA-LMM' : name.startsWith('VLM captions') ? 'JCEF' : name === 'MiniCPM-v' ? 'MiniCPM-V 2.6' : name;
      const detail = tasks.find(r => r[0] === alias && r[1] === setting);
      add(name.replace(/ 4$/, ''), setting, values, detail);
    }
    for (const [name, asr, frames, ...values] of variants.slice(2)) {
      if (!asr) continue;
      const model = name.replace(/\s*\\dagger$/, '');
      const setting = 'RGB (' + frames + ' frames)' + (asr === 'Yes' ? ' + ASR' : '');
      if (!rows.some(r => r.model === model && r.setting === setting)) add(model, setting, values);
    }
    if (rows.length < 26) throw new Error('Missing Neptune configurations');
    return rows;
  },
};
export default board;
