// Video-Oasis: read model groups, parameter counts and Overall accuracy from the main video-native challenge table.
// Diagnostic grounding, shortcut, oracle and training studies are not additional leaderboard settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://limgeuntaekk.github.io/Video-Oasis/";
const board: Leaderboard = {
  benchmark: "video-oasis", parts: {
  'Fine-Grained Perception': { name: 'Fine-grained perception', group: 'Task type' },
  'Spatial World': { name: 'Spatial world', group: 'Task type' },
  'Temporal Dynamics': { name: 'Temporal dynamics', group: 'Task type' },
  'Causal Reasoning': { name: 'Causal reasoning', group: 'Task type' },
  'Global Narrative': { name: 'Global narrative', group: 'Task type' },
}, url: "https://limgeuntaekk.github.io/Video-Oasis/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const [header, ...results] = all[0] ?? [];
    let open: boolean | undefined;
    for (const r of results) {
      if (r.length === 1) {
        open = r[0] === 'Open-Source Video-LLMs' ? true : r[0] === 'Proprietary LLMs' ? false : undefined;
        continue;
      }
      const score = num(r[6]);
      if (score === undefined) continue;
      const model = r[0];
      const size = model.match(/\(([\d.]+)B\)/i);
      const mode = model.match(/\b(Think|Inst)\./);
      const metrics: Record<string, number> = {};
      for (let i = 1; i < 6; i++) {
        const value = num(r[i]);
        if (value !== undefined) metrics[header[i]] = value;
      }
      rows.push({model, score, metrics, open, params: size ? Number(size[1]) : undefined, setting: mode?.[0]});
    }
    if (!rows.length) throw new Error("No video-oasis score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

