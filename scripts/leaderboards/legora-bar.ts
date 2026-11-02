// Legora BAR (Benchmark for Agentic Reasoning), October 2026 edition on legora.com/bar/oct26. The page is a
// Framer site; one of its page modules names the board's data file (dataFile: framerusercontent.com/assets/
// <hash>.json). That file lists the 17 models and, per filter slice, each metric as a relative index where
// 100 is the average of the models run. The score is the overall quality index of the unfiltered slice (all
// practice areas, jurisdictions, task families and lengths): Opus 5.5 at 106 is "6% above the 17-model
// average". The index compares within one edition only. Each edition has its own URL (bar/<mon><yy>).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://legora.com/bar/oct26';
const ALL = 'practice=all&jurisdiction=all&work=all&taskLength=short+medium+long';

interface Data {
  release: { id: string };
  models: { id: string; label: string }[];
  slices: Record<string, { quality: number[] }>;
}

const board: Leaderboard = {
  benchmark: 'legora-bar',
  url: PAGE,
  feed: `${PAGE} (Framer dataFile JSON, unfiltered slice, quality index)`,
  terms: 'Public page and its data file; legora.com robots.txt allows all agents and the page states no reuse limits for the results.',
  aliases: {
    'Muse Wonder': 'muse-wonder',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const modules = [...new Set(html.match(/https:\/\/framerusercontent\.com\/sites\/[\w./-]+\.mjs/g) ?? [])];
    let file: string | undefined;
    for (const m of modules) {
      file = (await fetchText(m)).match(/dataFile:`(https:\/\/framerusercontent\.com\/assets\/\w+\.json)`/)?.[1];
      if (file) break;
    }
    if (!file) throw new Error('dataFile not found in the page modules');
    const data = await fetchJson<Data>(file);
    const quality = data.slices[ALL]?.quality;
    if (!quality || quality.length !== data.models.length) throw new Error('unfiltered quality slice missing or misaligned');
    return data.models.map((m, i): LeaderboardRow => ({ model: m.label, score: quality[i] }));
  },
};
export default board;
