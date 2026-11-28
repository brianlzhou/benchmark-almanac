// AxE (Agent-Environment Generalization of Video World Models): evaluates 20 text-to-video and camera-conditioned
// video world models on paired original and controlled variant prompts using the AxE Score (event Fidelity weighted
// by Stability, plus Timing and Content submetrics). Reads the inline JSON AXE_DATA array from AxEBench.github.io.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://AxEBench.github.io/';

interface AxeEntry {
  m: string;
  g: string;
  fid: number;
  tim: number;
  con: number;
  stab: number;
  axe: number;
}

const board: Leaderboard = {
  benchmark: 'axe-world-models',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by the AxE authors with no robots.txt restrictions.',
  aliases: {
    'Seedance 2.5': 'dreamina-seedance-2-5',
  },
  stats: {
    fidelity: { name: 'Fidelity', unit: 'score', better: 'higher', note: 'Grounded event fidelity across original and variant generations.' },
    stability: { name: 'Stability', unit: 'score', better: 'higher', note: 'Consistency of event execution across controlled agent and environment variants.' },
    timing: { name: 'Timing', unit: 'score', better: 'higher', note: 'Temporal alignment of generated physical events.' },
    content: { name: 'Content', unit: 'score', better: 'higher', note: 'Semantic content accuracy of generated events.' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const m = html.match(/const AXE_DATA\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) throw new Error('AxE inline AXE_DATA array not found');
    const entries = JSON.parse(m[1]) as AxeEntry[];
    const out: LeaderboardRow[] = entries.map((x) => {
      if (![x.axe, x.fid, x.stab, x.tim, x.con].every(Number.isFinite)) {
        throw new Error(`Invalid AxE scores for ${x.m}`);
      }
      return {
        model: x.m.trim(),
        setting: x.g === 't2v' ? 'Text-to-video' : 'Camera-conditioned',
        score: x.axe,
        metrics: {
          fidelity: x.fid,
          stability: x.stab,
          timing: x.tim,
          content: x.con,
        },
      };
    });
    if (out.length < 15) throw new Error(`AxE returned only ${out.length} rows`);
    return out;
  },
};
export default board;
