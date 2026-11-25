// WorldLeague, the xML Lab (National University of Singapore) benchmark of physical agency: 60 simulated robot tasks
// in three suites, WorldSeek (explore to gather evidence), WorldShape (rearrange objects) and WorldShift (adapt to
// changes). The headline is the Interactive Score, the mean credit across each task's goal items scaled to 100, read
// from the trajectory. Physical success counts episodes where the whole goal and every constraint hold.
// The project page's leaderboard is a static table. Each row carries its six capability scores in data-dimensions as
// [Interactive Score, physical success] pairs, in the order the page's script names them.
// Vision-language models act through the board's own WorldHarness. VLAs and world-action models (WAMs) use their
// native controls through the checkpoints the repository's presets name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const PAGE = 'https://xyangzhou.github.io/WorldLeague/';
const DIMENSIONS = [
  { key: 'navigation', name: 'Navigation', group: 'WorldSeek' },
  { key: 'grounding', name: 'Grounding', group: 'WorldSeek' },
  { key: 'geometry', name: 'Geometry', group: 'WorldShape' },
  { key: 'physics', name: 'Physics', group: 'WorldShape' },
  { key: 'memory', name: 'Memory', group: 'WorldShift' },
  { key: 'constraints', name: 'Constraints', group: 'WorldShift' },
];
// The checkpoint each VLA or WAM row ran (README presets, configs/continuous/policies in the repository)
const CHECKPOINT: Record<string, { model: string; setting: string }> = {
  'π0.5 (R1Pro SFT)': { model: 'π0.5', setting: 'fine-tuned on R1Pro' },
  'GR00T-N1.5': { model: 'GR00T-N1.5', setting: 'RoboCasa365 checkpoint' },
  'Xiaomi XR-1': { model: 'Xiaomi-Robotics-1', setting: 'RoboCasa365 checkpoint' },
  'Awomo-0.5I': { model: 'Awomo-0.5I', setting: 'RoboCasa365 checkpoint' },
  'OpenWAM-Alpha': { model: 'OpenWAM-Alpha', setting: 'RoboCasa365 checkpoint' },
};

const board: Leaderboard = {
  benchmark: 'worldleague',
  url: PAGE,
  feed: PAGE,
  terms: 'The project page publishes the leaderboard openly, and the code and benchmark materials are under the MIT license. Results are credited to WorldLeague.',
  reference: ['WorldHarness'],
  parts: Object.fromEntries(DIMENSIONS.map((d) => [d.key, { name: d.name, group: d.group }])),
  stats: {
    success: { name: 'Physical success', unit: '%', better: 'higher', note: 'Share of episodes where the full goal and every task constraint hold.' },
    ...Object.fromEntries(DIMENSIONS.map((d) => [`${d.key}Success`, { name: `${d.name} physical success`, unit: '%', better: 'higher' }])),
    tasks: { name: 'Tasks run', unit: 'count', note: 'The continuous-control evaluation of VLAs and WAMs covers 59 of the 60 tasks.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const table = tables(html).find((t) => t[0]?.some((c) => c.text.includes('Embodied AI system')));
    if (!table) throw new Error('WorldLeague: leaderboard table missing');
    const rows: LeaderboardRow[] = [];
    for (const tr of [...html.matchAll(/<tr\b([^>]*data-dimensions="[^"]*"[^>]*)>([\s\S]*?)<\/tr>/g)]) {
      const attr = (k: string) => tr[1].match(new RegExp(`${k}="([^"]*)"`))?.[1];
      const cells = [...tr[2].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1]);
      const name = tr[2].match(/class="model-name">([^<]+)</)?.[1]?.trim();
      const dims = JSON.parse(attr('data-dimensions')!.replace(/&quot;/g, '"')) as [number, number][];
      const score = num(cells[2]?.replace(/<[^>]+>/g, '')), success = num(cells[4]?.replace(/<[^>]+>/g, ''));
      const family = attr('data-family'), tasks = Number(attr('data-tasks'));
      if (!name || score === undefined || success === undefined || dims.length !== DIMENSIONS.length || !family) throw new Error(`WorldLeague: row changed shape (${name})`);
      const metrics: Record<string, number> = { success, tasks };
      DIMENSIONS.forEach((d, i) => { metrics[d.key] = dims[i][0]; metrics[`${d.key}Success`] = dims[i][1]; });
      const vlm = family === 'VLM';
      const native = CHECKPOINT[name];
      if (!vlm && !native) throw new Error(`WorldLeague: no checkpoint known for ${name}`);
      rows.push({
        model: native?.model ?? name,
        setting: native?.setting,
        harness: vlm ? 'WorldHarness' : undefined,
        score,
        metrics,
      });
    }
    if (rows.length < 10) throw new Error(`WorldLeague: only ${rows.length} rows`);
    return rows;
  },
};
export default board;
