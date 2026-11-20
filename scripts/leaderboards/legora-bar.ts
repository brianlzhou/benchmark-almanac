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
  parts: {
    'practice=all&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Analyze and answer', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:compare&taskLength=short+medium+long:quality': { name: 'Compare', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Draft', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Edit', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Extract', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Review', group: 'Task type' },
    'practice=all&jurisdiction=all&work=family:summarise&taskLength=short+medium+long:quality': { name: 'Summarize', group: 'Task type' },
    'practice=area:real_estate&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Real estate', group: 'Domain' },
    'practice=area:real_estate&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Real estate: extract', group: 'Category' },
    'practice=area:governance&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Governance', group: 'Domain' },
    'practice=area:governance&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Governance: draft', group: 'Category' },
    'practice=area:litigation&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Litigation', group: 'Domain' },
    'practice=area:litigation&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Litigation: analyze and answer', group: 'Category' },
    'practice=area:litigation&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Litigation: edit', group: 'Category' },
    'practice=area:litigation&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Litigation: review', group: 'Category' },
    'practice=area:capital_markets&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Capital markets', group: 'Domain' },
    'practice=area:capital_markets&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Capital markets: analyze and answer', group: 'Category' },
    'practice=area:trusts_and_estates&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Trusts and estates', group: 'Domain' },
    'practice=area:trusts_and_estates&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Trusts and estates: draft', group: 'Category' },
    'practice=area:funds&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Funds', group: 'Domain' },
    'practice=area:funds&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Funds: draft', group: 'Category' },
    'practice=area:tax&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Tax', group: 'Domain' },
    'practice=area:tax&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Tax: analyze and answer', group: 'Category' },
    'practice=area:tax&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Tax: draft', group: 'Category' },
    'practice=area:commercial&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Commercial', group: 'Domain' },
    'practice=area:commercial&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Commercial: analyze and answer', group: 'Category' },
    'practice=area:commercial&jurisdiction=all&work=family:compare&taskLength=short+medium+long:quality': { name: 'Commercial: compare', group: 'Category' },
    'practice=area:commercial&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Commercial: edit', group: 'Category' },
    'practice=area:commercial&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Commercial: extract', group: 'Category' },
    'practice=area:data_and_cyber&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Data and cyber', group: 'Domain' },
    'practice=area:data_and_cyber&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Data and cyber: edit', group: 'Category' },
    'practice=area:data_and_cyber&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Data and cyber: review', group: 'Category' },
    'practice=area:life_sciences&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Life sciences', group: 'Domain' },
    'practice=area:life_sciences&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Life sciences: analyze and answer', group: 'Category' },
    'practice=area:patents&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Patents', group: 'Domain' },
    'practice=area:patents&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Patents: analyze and answer', group: 'Category' },
    'practice=area:competition&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Competition', group: 'Domain' },
    'practice=area:competition&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Competition: analyze and answer', group: 'Category' },
    'practice=area:restructuring&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Restructuring', group: 'Domain' },
    'practice=area:restructuring&jurisdiction=all&work=family:compare&taskLength=short+medium+long:quality': { name: 'Restructuring: compare', group: 'Category' },
    'practice=area:energy&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Energy', group: 'Domain' },
    'practice=area:energy&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Energy: draft', group: 'Category' },
    'practice=area:lending&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Lending', group: 'Domain' },
    'practice=area:lending&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Lending: analyze and answer', group: 'Category' },
    'practice=area:insurance&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Insurance', group: 'Domain' },
    'practice=area:insurance&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Insurance: review', group: 'Category' },
    'practice=area:white_collar&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'White collar', group: 'Domain' },
    'practice=area:white_collar&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'White collar: draft', group: 'Category' },
    'practice=area:employment&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Employment', group: 'Domain' },
    'practice=area:employment&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Employment: draft', group: 'Category' },
    'practice=area:employment&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Employment: edit', group: 'Category' },
    'practice=area:arbitration&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Arbitration', group: 'Domain' },
    'practice=area:arbitration&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Arbitration: analyze and answer', group: 'Category' },
    'practice=area:arbitration&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Arbitration: draft', group: 'Category' },
    'practice=area:arbitration&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Arbitration: extract', group: 'Category' },
    'practice=area:arbitration&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Arbitration: review', group: 'Category' },
    'practice=area:arbitration&jurisdiction=all&work=family:summarise&taskLength=short+medium+long:quality': { name: 'Arbitration: summarize', group: 'Category' },
    'practice=area:structured_finance&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Structured finance', group: 'Domain' },
    'practice=area:structured_finance&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Structured finance: review', group: 'Category' },
    'practice=area:immigration&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Immigration', group: 'Domain' },
    'practice=area:immigration&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Immigration: review', group: 'Category' },
    'practice=area:trade&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Trade', group: 'Domain' },
    'practice=area:trade&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Trade: draft', group: 'Category' },
    'practice=area:transfer_pricing&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Transfer pricing', group: 'Domain' },
    'practice=area:transfer_pricing&jurisdiction=all&work=family:draft&taskLength=short+medium+long:quality': { name: 'Transfer pricing: draft', group: 'Category' },
    'practice=area:transfer_pricing&jurisdiction=all&work=family:edit&taskLength=short+medium+long:quality': { name: 'Transfer pricing: edit', group: 'Category' },
    'practice=area:sanctions&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Sanctions', group: 'Domain' },
    'practice=area:sanctions&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Sanctions: extract', group: 'Category' },
    'practice=area:audit&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'Audit', group: 'Domain' },
    'practice=area:audit&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'Audit: analyze and answer', group: 'Category' },
    'practice=area:audit&jurisdiction=all&work=family:extract&taskLength=short+medium+long:quality': { name: 'Audit: extract', group: 'Category' },
    'practice=area:audit&jurisdiction=all&work=family:review&taskLength=short+medium+long:quality': { name: 'Audit: review', group: 'Category' },
    'practice=area:in_house&jurisdiction=all&work=all&taskLength=short+medium+long:quality': { name: 'In house', group: 'Domain' },
    'practice=area:in_house&jurisdiction=all&work=family:analyse_answer&taskLength=short+medium+long:quality': { name: 'In house: analyze and answer', group: 'Category' },
  },
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
