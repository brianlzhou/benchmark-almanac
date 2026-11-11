// Legora BAR (Benchmark for Agentic Reasoning), October 2026 edition on legora.com/bar/oct26. The page is a
// Framer site; one of its page modules names the board's data file (dataFile: framerusercontent.com/assets/
// <hash>.json). That file lists the 17 models and, per filter slice, each metric as a relative index where
// 100 is the average of the models run. The score is the quality index of the unfiltered slice (all
// practice areas, jurisdictions, task families and lengths): Opus 5.5 at 106 is "6% above the 17-model
// average". The index compares within one edition only. Each edition has its own URL (bar/<mon><yy>).
// The same slice's cost per case, median time per case and citation grounding are relative indexes too (100
// is the average), kept as metrics.costIndex, metrics.timeIndex and metrics.grounding, not as dollars or
// seconds. The page plots quality against each of the first two; the time chart is redrawn here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://legora.com/bar/oct26';
const ALL = 'practice=all&jurisdiction=all&work=all&taskLength=short+medium+long';

interface Data {
  release: { id: string };
  models: { id: string; label: string }[];
  slices: Record<string, { quality: number[]; cost?: number[]; medianTime?: number[]; grounding?: number[] }>;
}

const board: Leaderboard = {
  benchmark: 'legora-bar',
  url: PAGE,
  feed: `${PAGE} (Framer dataFile JSON, unfiltered overall quality index)`,
  terms: 'Public page and its data file; legora.com robots.txt allows all agents and the page states no reuse limits for the results.',
  chart: {
    title: 'Quality vs. median time per case',
    note: 'Both axes are relative indexes where 100 is the average of the models run; lower time is faster.',
    x: { key: 'timeIndex', label: 'Median time per case vs average', unit: 'index', better: 'lower' },
    y: { key: 'score', label: 'Quality vs average', unit: 'index', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const modules = [...new Set(html.match(/https:\/\/framerusercontent\.com\/sites\/[\w./-]+\.mjs/g) ?? [])];
    let file: string | undefined;
    for (const m of modules) {
      await new Promise(r=>setTimeout(r,1100));
      file = (await fetchText(m)).match(/dataFile:`(https:\/\/framerusercontent\.com\/assets\/\w+\.json)`/)?.[1];
      if (file) break;
    }
    if (!file) throw new Error('dataFile not found in the page modules');
    const data = await fetchJson<Data>(file);
    const rows: LeaderboardRow[] = [];
    const slice = data.slices[ALL];
    const quality = slice?.quality;
    if (!quality || quality.length !== data.models.length) throw new Error('unfiltered quality slice missing or misaligned');
    // the other indexes, kept only when they line up with the models
    const aligned = (v?: number[]) => (v?.length === data.models.length ? v : undefined);
    const [cost, time, grounding] = [aligned(slice.cost), aligned(slice.medianTime), aligned(slice.grounding)];
    rows.push(...data.models.map((m, i): LeaderboardRow => {
      const metrics: Record<string, number> = {};
      if (typeof cost?.[i] === 'number') metrics.costIndex = cost[i];
      if (typeof time?.[i] === 'number') metrics.timeIndex = time[i];
      if (typeof grounding?.[i] === 'number') metrics.grounding = grounding[i];
      for (const [sliceKey, values] of Object.entries(data.slices)) {
        if (sliceKey === ALL) continue;
        for (const [metric, vector] of Object.entries(values)) {
          if (Array.isArray(vector) && vector.length === data.models.length && Number.isFinite(vector[i])) metrics[`${sliceKey}:${metric}`] = vector[i];
        }
      }
      return { model: m.label, score: quality[i], setting: data.release.id, ...(Object.keys(metrics).length ? { metrics } : {}) };
    }));
    return rows;
  },
};
export default board;
