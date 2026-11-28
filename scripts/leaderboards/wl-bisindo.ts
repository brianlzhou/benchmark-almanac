// WL-BISINDO evaluates word-level Indonesian Sign Language (BISINDO) recognition across 1,600 videos
// of 32 isolated signs from five signers. This importer reads the Signer-Dependent Top-1 accuracy
// table and Signer-Independent per-signer accuracy table from the official repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/AceKinnn/WL-BISINDO/main/README.md';

function parsePct(s: string): number {
  const m = s.replace(/\*\*/g, '').trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!m) throw new Error(`WL-BISINDO unexpected percentage: "${s}"`);
  return Number(m[1]);
}

function parseTable(md: string, heading: string): string[][] {
  const idx = md.indexOf(heading);
  if (idx < 0) throw new Error(`WL-BISINDO section missing: ${heading}`);
  const out: string[][] = [];
  for (const line of md.slice(idx).split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      if (out.length > 0) break;
      continue;
    }
    const cells = t.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;
    out.push(cells);
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'wl-bisindo',
  url: 'https://github.com/AceKinnn/WL-BISINDO#results-summary',
  feed: FEED,
  terms: 'The WL-BISINDO authors publish the baseline results publicly in their GitHub repository.',
  headline: 'Headline is Signer-Dependent Top-1 accuracy in percent, with Signer-Independent held-out signer accuracies as parts.',
  parts: {
    signer1: { name: 'Signer 1 (SI)', group: 'Signer-Independent', unit: '%', better: 'higher' },
    signer2: { name: 'Signer 2 (SI)', group: 'Signer-Independent', unit: '%', better: 'higher' },
    signer3: { name: 'Signer 3 (SI)', group: 'Signer-Independent', unit: '%', better: 'higher' },
    signer4: { name: 'Signer 4 (SI)', group: 'Signer-Independent', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const sd = parseTable(md, '### Signer-Dependent (SD) Setting');
    const si = parseTable(md, '### Signer-Independent (SI) Setting');
    if (sd.length < 4 || si.length < 3) throw new Error('WL-BISINDO result tables incomplete');

    const siMap = new Map<string, Record<string, number>>();
    for (const r of si.slice(1)) {
      const model = r[0]?.replace(/\*\*/g, '').trim();
      if (!model) continue;
      siMap.set(model, {
        signer1: parsePct(r[1] ?? ''),
        signer2: parsePct(r[2] ?? ''),
        signer3: parsePct(r[3] ?? ''),
        signer4: parsePct(r[4] ?? ''),
      });
    }

    const rows: LeaderboardRow[] = [];
    for (const r of sd.slice(1)) {
      const model = r[0]?.replace(/\*\*/g, '').trim();
      const modality = r[1]?.trim();
      if (!model) continue;
      const metrics = siMap.get(model);
      rows.push({
        model,
        ...(modality ? { setting: `${modality} modality` } : {}),
        score: parsePct(r[2] ?? ''),
        ...(metrics ? { metrics } : {}),
      });
    }

    return checked(rows, 3);
  },
};

export default board;
