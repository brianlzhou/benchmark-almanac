// FAIR Chemistry Leaderboard — Meta FAIR atomistic and chemistry foundation model leaderboard.
// Reads the live OMol25 Overview dataframe from the public Gradio Space config at
// https://facebook-fairchem-leaderboard.hf.space/config across all 7 OMol25 energy MAE (meV) tasks.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://facebook-fairchem-leaderboard.hf.space/config';

interface GradioComponent {
  id: number;
  type?: string;
  props?: {
    value?: {
      headers?: string[];
      data?: unknown[][];
    };
  };
}

interface GradioConfig {
  components?: GradioComponent[];
}

const round2 = (v: number) => Math.round(v * 100) / 100;

const board: Leaderboard = {
  benchmark: 'fairchem-leaderboard',
  feed: FEED,
  url: 'https://huggingface.co/spaces/facebook/fairchem_leaderboard',
  terms: 'Public Hugging Face Gradio Space published by Meta FAIR.',
  headline: 'Mean energy MAE in meV across the seven OMol25 chemistry tasks (lower is better), computed over complete entries in the FAIR Chemistry Overview table.',
  parts: {
    ligandPocket: { name: 'Ligand pocket Ixn Energy MAE', group: 'OMol25 task' },
    ligandStrain: { name: 'Ligand strain Energy MAE', group: 'OMol25 task' },
    conformers: { name: 'Conformers Energy MAE', group: 'OMol25 task' },
    protonation: { name: 'Protonation Energy MAE', group: 'OMol25 task' },
    distanceScaling: { name: 'Distance scaling LR Energy MAE', group: 'OMol25 task' },
    ieEa: { name: 'IE/EA Energy MAE', group: 'OMol25 task' },
    spinGap: { name: 'Spin gap Energy MAE', group: 'OMol25 task' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const cfg = await fetchJson<GradioConfig>(FEED);
    const df = (cfg.components ?? []).find(
      (c) =>
        c.type === 'dataframe' &&
        Array.isArray(c.props?.value?.headers) &&
        c.props.value.headers.some((h) => /Ligand pocket/i.test(h)) &&
        c.props.value.headers.some((h) => /Spin gap/i.test(h)),
    );
    const data = df?.props?.value?.data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('FAIR Chemistry OMol25 Overview dataframe not found in Gradio config');
    }

    const keys = [
      'ligandPocket',
      'ligandStrain',
      'conformers',
      'protonation',
      'distanceScaling',
      'ieEa',
      'spinGap',
    ] as const;

    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (!Array.isArray(r) || r.length < 11) continue;
      const rawHtml = String(r[0] ?? '');
      const model = rawHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/📕/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!model) continue;

      const vals = r.slice(4, 11).map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null));
      // Keep only complete 7-task OMol25 rows so the mean MAE headline is apples-to-apples.
      if (vals.some((v) => v === null)) continue;
      const nums = vals as number[];

      const metrics: Record<string, number> = {};
      for (let i = 0; i < keys.length; i++) {
        metrics[keys[i]] = round2(nums[i]);
      }
      const meanMae = round2(nums.reduce((a, b) => a + b, 0) / nums.length);

      const org = String(r[1] ?? '').trim();
      const conserving = r[2] === true;
      const trainSet = String(r[3] ?? '').trim();
      const settingParts = [trainSet || undefined, conserving ? 'Energy conserving' : 'Direct forces'].filter(Boolean);

      const row: LeaderboardRow = {
        model,
        score: meanMae,
        setting: settingParts.join(', '),
        metrics,
      };
      if (org) row.submitter = org;
      const hrefMatch = rawHtml.match(/href="(https?:\/\/[^"]+)"/);
      if (hrefMatch) row.link = hrefMatch[1];
      rows.push(row);
    }

    if (rows.length < 15) throw new Error(`FAIR Chemistry parsed only ${rows.length} complete OMol25 rows`);
    return rows;
  },
};

export default board;
