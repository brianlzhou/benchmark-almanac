import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/datasets/clinicalspace/Clinical3D-Bench/raw/main/leaderboard.csv';

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

const num = (s: string | undefined): number | undefined => {
  if (!s || s === '--' || s === '-') return undefined;
  const v = Number(s);
  return Number.isFinite(v) ? v : undefined;
};

const board: Leaderboard = {
  benchmark: 'clinical3d-bench',
  url: 'https://clinicalspace.github.io/clinical3d-bench/#leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face dataset leaderboard CSV published under CC BY 4.0.',
  static: 'paper',
  aliases: {
    'Llama-3.2-11B-Vision': 'llama-3-2-11b',
    'Qwen3-VL-32B': 'qwen3-vl-32b-instruct',
    'Qwen3-VL-8B': 'qwen3-vl-8b-instruct',
    'Qwen3-VL-4B': 'qwen3-vl-4b-instruct',
  },
  parts: {
    count: 'Count',
    reId: 'Re-ID',
    lightOwner: 'Light owner',
    patientFrame: 'Patient frame',
    deviceRef: 'Device reference',
    direction: 'Direction',
    route: 'Route',
    passability: 'Passability',
  },
  stats: {
    frames: {
      name: 'Input frames',
      unit: 'count',
      note: 'Number of sampled video frames supplied to the model.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lines = (await res.text()).split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const header = parseCsvLine(lines[0]);
    const col = (name: string) => header.indexOf(name);
    const iGroup = col('group');
    const iModel = col('model');
    const iFrames = col('frames');
    const iAvg = col('avg');
    const partCols: [string, number][] = [
      ['count', col('Count')],
      ['reId', col('Re-ID')],
      ['lightOwner', col('Light owner')],
      ['patientFrame', col('Patient frame')],
      ['deviceRef', col('Device ref.')],
      ['direction', col('Direction')],
      ['route', col('Route')],
      ['passability', col('Passability')],
    ];

    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const group = cells[iGroup] ?? '';
      if (group === 'References') continue;
      const rawModel = cells[iModel] ?? '';
      const model = rawModel.replace(/\s*\(ours\)\s*$/i, '').trim();
      const score = num(cells[iAvg]);
      if (!model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      for (const [key, idx] of partCols) {
        const v = idx >= 0 ? num(cells[idx]) : undefined;
        if (v !== undefined) metrics[key] = v;
      }
      const frames = iFrames >= 0 ? num(cells[iFrames]) : undefined;
      if (frames !== undefined) metrics.frames = frames;

      const row: LeaderboardRow = { model, score, metrics };
      if (group.startsWith('Fine-tuned')) row.setting = group;
      if (group.startsWith('Open-source')) row.open = true;
      else if (group.startsWith('Proprietary')) row.open = false;
      rows.push(row);
    }
    return rows;
  },
};

export default board;
