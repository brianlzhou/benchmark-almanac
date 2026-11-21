// 3DGen-Arena ranks text and image generation systems by their average arena Elo.
// Read the four tables from the same Gradio configuration as the live Space.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import type { LeaderboardRow } from './types.ts';

const url = "https://huggingface.co/spaces/3DTopia/3DGen-Arena";
const feed = "https://3dtopia-3dgen-arena.hf.space/config";

const board: Leaderboard = {
  benchmark: '3dgen-bench', url, feed,
  terms: "The leaderboard page gives no separate reuse license. https://huggingface.co/spaces/ZhangYuhan/3DGen-Arena" ,
  stats: { votes: { name: 'Votes', unit: 'count' } },
  async fetch() {
    type Table = { headers: string[]; data: (string | number)[][] };
    type Component = { type: string; props: { label?: string; value?: Table | string } };
    const { components } = await fetchJson<{components: Component[]}>(feed);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    let track = '', arena = '', date: string | undefined;
    const settings = new Set<string>();
    for (const c of components) {
      const { label, value } = c.props;
      if (c.type === 'tabitem' && label?.endsWith(' Leaderboard')) track = label.replace(' Leaderboard', '');
      if (c.type === 'tabitem' && ['Anony. Arena', 'Full Arena'].includes(label ?? '')) { arena = label!; date = undefined; }
      if (c.type === 'markdown' && typeof value === 'string' && value.includes('Last updated:')) date = value.match(/Last updated:\s*(\d{4}-\d\d-\d\d)/)?.[1];
      if (c.type !== 'dataframe' || !value || typeof value === 'string') continue;
      const {headers, data} = value;
      const setting = track + ' · ' + arena;
      if (!track || !arena || !date || settings.has(setting) || data.length < (track === 'Text-to-3D' ? 9 : 14)) throw new Error('Incomplete arena ' + setting);
      settings.add(setting);
      const labels = headers.map(h => h.replace(/^[^A-Za-z]+/, ''));
      if (labels[1] !== 'Model' || labels[7] !== 'Avg. Arena Elo Ranking' || labels[8] !== 'Votes' || labels.slice(2,7).some(s => !s.endsWith(' Elo'))) throw new Error('Unexpected arena columns');
      for (const row of data) {
        if (row.length !== headers.length || !row.slice(2).every(Number.isFinite)) throw new Error('Invalid arena row');
        const metrics: Record<string, number> = { votes: Number(row[8]) };
        for (let i = 2; i <= 6; i++) { parts[labels[i]] = labels[i]; metrics[labels[i]] = Number(row[i]); }
        rows.push({ model: String(row[1]).replace(/^[🥇🥈🥉]\s*/u,''), setting, score: Number(row[7]), metrics, date });
      }
    }
    if (settings.size !== 4) throw new Error('Expected four arena tables');
    board.parts = parts;
    return rows;
  },
};
export default board;
