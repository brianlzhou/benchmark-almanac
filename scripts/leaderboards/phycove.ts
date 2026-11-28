import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://phycove.github.io/assets/data/leaderboard.json';

interface OverallRow {
  id: string;
  name: string;
  url?: string;
  group?: string;
  verified?: boolean;
  date?: string;
  hpwr?: number;
  cf?: number;
  ea?: number;
  pc?: number;
  joint?: number;
  miou?: number;
  psnr?: number;
  ssim?: number;
  lpips?: number;
  fvd?: number;
}

interface BreakdownRow {
  id: string;
  rem?: (number | null)[];
  chg?: (number | null)[];
  ins?: (number | null)[];
  pat?: (number | null)[] | null;
}

interface RigidRow {
  id: string;
  cf?: number;
}

interface Payload {
  overall?: OverallRow[];
  breakdown?: BreakdownRow[];
  rigid?: RigidRow[];
}

const board: Leaderboard = {
  benchmark: 'phycove',
  url: 'https://phycove.github.io/#leaderboard',
  feed: FEED,
  terms: 'Public leaderboard JSON published by the PhyCoVE authors at Fudan University.',
  verified: 'evaluated by the PhyCoVE team',
  aliases: {
    'Seedance 2.5': 'dreamina-seedance-2-5',
  },
  parts: {
    removeHpwr: { name: 'Remove edit HPWR', group: 'Edit type' },
    changeHpwr: { name: 'Change edit HPWR', group: 'Edit type' },
    insertHpwr: { name: 'Insert edit HPWR', group: 'Edit type' },
    rigidRigidCf: { name: 'Rigid and rigid CF', group: 'Material interaction', unit: 'score' },
    rigidElasticCf: { name: 'Rigid and elastic CF', group: 'Material interaction', unit: 'score' },
    rigidFluidCf: { name: 'Rigid and fluid CF', group: 'Material interaction', unit: 'score' },
    elasticFluidCf: { name: 'Elastic and fluid CF', group: 'Material interaction', unit: 'score' },
    elasticElasticCf: { name: 'Elastic and elastic CF', group: 'Material interaction', unit: 'score' },
  },
  stats: {
    cf: {
      name: 'Counterfactual fidelity',
      unit: 'score',
      better: 'higher',
      note: 'Fraction of the ground-truth physical change from source to target reproduced by the edited video.',
    },
    ea: {
      name: 'Edit adherence',
      unit: 'rating',
      better: 'higher',
      note: 'Human rating of how accurately the requested physical edit was applied.',
    },
    pc: {
      name: 'Physical consistency',
      unit: 'rating',
      better: 'higher',
      note: 'Human rating of physical plausibility across the edited sequence.',
    },
    joint: { name: 'Joint pass rate', unit: '%', better: 'higher' },
    miou: { name: 'Mask IoU', unit: 'score', better: 'higher' },
    psnr: { name: 'PSNR', unit: 'score', better: 'higher' },
    ssim: { name: 'SSIM', unit: 'score', better: 'higher' },
    lpips: { name: 'LPIPS', unit: 'score', better: 'lower' },
    fvd: { name: 'FVD', unit: 'score', better: 'lower' },
    removeCf: { name: 'Remove edit CF', unit: 'score', better: 'higher' },
    changeCf: { name: 'Change edit CF', unit: 'score', better: 'higher' },
    insertCf: { name: 'Insert edit CF', unit: 'score', better: 'higher' },
    rigidSubsetCf: { name: 'Rigid-subset CF', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Payload;
    const byBreakdown = new Map((data.breakdown ?? []).map((b) => [b.id, b]));
    const byRigid = new Map((data.rigid ?? []).map((r) => [r.id, r]));

    const rows: LeaderboardRow[] = [];
    for (const m of data.overall ?? []) {
      if (typeof m.hpwr !== 'number' || !Number.isFinite(m.hpwr)) continue;
      const metrics: Record<string, number> = {};
      const overallKeys: (keyof OverallRow)[] = ['cf', 'ea', 'pc', 'joint', 'miou', 'psnr', 'ssim', 'lpips', 'fvd'];
      for (const k of overallKeys) {
        const v = m[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      const b = byBreakdown.get(m.id);
      if (b) {
        if (typeof b.rem?.[0] === 'number') metrics.removeCf = b.rem[0];
        if (typeof b.rem?.[2] === 'number') metrics.removeHpwr = b.rem[2];
        if (typeof b.chg?.[0] === 'number') metrics.changeCf = b.chg[0];
        if (typeof b.chg?.[2] === 'number') metrics.changeHpwr = b.chg[2];
        if (typeof b.ins?.[0] === 'number') metrics.insertCf = b.ins[0];
        if (typeof b.ins?.[2] === 'number') metrics.insertHpwr = b.ins[2];
        const patKeys = ['rigidRigidCf', 'rigidElasticCf', 'rigidFluidCf', 'elasticFluidCf', 'elasticElasticCf'] as const;
        if (Array.isArray(b.pat)) {
          for (let i = 0; i < patKeys.length; i++) {
            const v = b.pat[i];
            if (typeof v === 'number' && Number.isFinite(v)) metrics[patKeys[i]] = v;
          }
        }
      }
      const r = byRigid.get(m.id);
      if (typeof r?.cf === 'number' && Number.isFinite(r.cf)) metrics.rigidSubsetCf = r.cf;

      const row: LeaderboardRow = {
        model: m.name.trim(),
        score: m.hpwr,
        metrics,
      };
      if (m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date)) row.date = m.date;
      if (m.verified === true) row.verified = true;
      if (m.group === 'open') row.open = true;
      else if (m.group === 'comm') row.open = false;
      if (m.url && /^https?:\/\//.test(m.url)) row.link = m.url;
      rows.push(row);
    }
    return rows;
  },
};

export default board;
