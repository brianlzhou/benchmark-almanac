// Video-MME-v2, with-subtitles setting. video-mme-v2.netlify.app holds its leaderboard as a literal array in
// the page script (leaderboardDataRaw): per model, each metric is a [with subtitles, without subtitles]
// pair. The page sorts by overall (the group-based non-linear score, 0 to 100, which penalizes guessing
// across related questions), so the with-subtitles overall is the score here. Rows with no with-subtitles
// value, and the human expert row, are skipped. The frame budget ("1fps", "64") and the "-Think" or
// "-Instruct" mode in a name become the setting. The array is read as data, never run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://video-mme-v2.netlify.app/';

interface Item {
  name: string;
  type?: string;
  frames?: string;
  overall?: [number | null, number | null];
}

const board: Leaderboard = {
  benchmark: 'videomme-v2-with-subtitles',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (inline leaderboardDataRaw, overall with subtitles)`,
  terms: 'Static page that states no terms; the Video-MME-v2 dataset card on Hugging Face is MIT.',
  aliases: {
    'GLM-4.5V': 'glm-4-5v',
    'GLM-4.1V': 'glm-4-1v-9b-thinking',
    // the 2026-02-15 snapshot of Seed 2.0 Pro (registry release 2026-02-14)
    'Doubao-Seed-2.0-Pro-260215': 'seed-2-0-pro',
    'VITA-1.5-7B': 'vita-1-5',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const at = html.indexOf('const leaderboardDataRaw = [');
    if (at < 0) throw new Error('no leaderboardDataRaw array on the Video-MME-v2 page');
    const items = jsLiteral<Item[]>(html, html.indexOf('[', at));
    const rows: LeaderboardRow[] = [];
    for (const it of items) {
      const score = it.overall?.[0];
      if (it.type === 'human' || typeof score !== 'number') continue;
      // "Qwen2-5-VL-72B-Instruct", "InternVL-3-5-4B-Instruct": dotted versions written with dashes
      let model = it.name
        .replace(/^Qwen2-5-/, 'Qwen2.5-')
        .replace(/^InternVL-?3-5-/, 'InternVL3.5-')
        .replace(/^Keye-VL-1-5-/, 'Keye-VL-1.5-')
        .replace(/^GLM(\d)/, 'GLM-$1');
      // "-Think" and "-Instruct" mark the two modes of one model (Qwen3.5, Qwen3-VL, Qwen3-Omni)
      let mode: string | undefined;
      const m = model.match(/-(Think|Instruct)$/);
      if (m) {
        model = model.slice(0, m.index);
        mode = m[1] === 'Think' ? 'thinking' : 'non-thinking';
      }
      const frames = it.frames ? (/fps$/.test(it.frames) ? it.frames.replace('fps', ' fps') : `${it.frames} frames`) : undefined;
      rows.push({ model, score, setting: [mode, frames].filter(Boolean).join(', ') || undefined });
    }
    return rows;
  },
};
export default board;
