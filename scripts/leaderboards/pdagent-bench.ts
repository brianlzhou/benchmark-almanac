// PDAGENT-BENCH ranks chip design models by overall pass@1. The dashboard links a JSON file with both pass rates and the category coverage for each evaluation round.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://fenggev56.github.io/PDAGENT-BENCH/data/leaderboard.json";
const board: Leaderboard = {
  benchmark: "pdagent-bench",
  url: "https://fenggev56.github.io/PDAGENT-BENCH/",
  feed: FEED,
  terms: "The leaderboard repository lists no license. The open dataset has mixed upstream terms. https://huggingface.co/datasets/fenggev566/PDAgent-Bench_open#licensing The host has no published robots directives at /robots.txt.",
  stats: { foundational_p5_best: { name: 'Foundational Knowledge best pass@5', unit: '%', better: 'higher' }, root_cause_p5_best: { name: 'Root-Cause Analysis best pass@5', unit: '%', better: 'higher' }, report_p5_best: { name: 'Report Comprehension best pass@5', unit: '%', better: 'higher' } },
  parts: {
  "foundational_p1": {
    "name": "Foundational Knowledge pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "foundational_p5": {
    "name": "Foundational Knowledge pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "foundational_p1_human": {
    "name": "Foundational Knowledge human pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "foundational_p5_human": {
    "name": "Foundational Knowledge human pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "root_cause_p1": {
    "name": "Root-Cause Analysis pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "root_cause_p5": {
    "name": "Root-Cause Analysis pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "root_cause_p1_human": {
    "name": "Root-Cause Analysis human pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "root_cause_p5_human": {
    "name": "Root-Cause Analysis human pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "report_p1": {
    "name": "Report Comprehension pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "report_p5": {
    "name": "Report Comprehension pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "report_p1_human": {
    "name": "Report Comprehension human pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "report_p5_human": {
    "name": "Report Comprehension human pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "sta_p1": {
    "name": "Static Timing Analysis pass@1",
    "group": "Understanding",
    "unit": "%"
  },
  "sta_p5": {
    "name": "Static Timing Analysis pass@5",
    "group": "Understanding",
    "unit": "%"
  },
  "fm_p1": {
    "name": "Formal Verification pass@1",
    "group": "Script Generation",
    "unit": "%"
  },
  "fm_p5": {
    "name": "Formal Verification pass@5",
    "group": "Script Generation",
    "unit": "%"
  },
  "eco_p1": {
    "name": "ECO pass@1",
    "group": "Script Generation",
    "unit": "%"
  },
  "eco_p5": {
    "name": "ECO pass@5",
    "group": "Script Generation",
    "unit": "%"
  },
  "pr_vendor1_p1": {
    "name": "P&R Vendor 1 pass@1",
    "group": "Script Generation",
    "unit": "%"
  },
  "pr_vendor1_p5": {
    "name": "P&R Vendor 1 pass@5",
    "group": "Script Generation",
    "unit": "%"
  },
  "pr_vendor2_p1": {
    "name": "P&R Vendor 2 pass@1",
    "group": "Script Generation",
    "unit": "%"
  },
  "pr_vendor2_p5": {
    "name": "P&R Vendor 2 pass@5",
    "group": "Script Generation",
    "unit": "%"
  },
  "pass5": {
    "name": "Overall pass@5",
    "unit": "%"
  }
},
  async fetch() {
    type Entry = { name: string; round: string; open_weights: boolean; n_categories: number; scores: Record<string, Record<string, number> | null>; overall: { p1: number; p5: number } };
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    if (models.length < 16) throw new Error('Missing PDAGENT-BENCH models');
    return models.map(m => {
      const metrics: Record<string, number> = { pass5: 100 * m.overall.p5 };
      let categories = 0;
      for (const [category, values] of Object.entries(m.scores)) {
        if (!values || values.p1 == null) continue;
        if (!Number.isFinite(values.p5)) throw new Error('Missing category pass@5');
        categories++;
        for (const [key, value] of Object.entries(values)) if (value != null) metrics[category + '_' + key] = 100 * value;
      }
      if (!m.name || categories !== m.n_categories || categories < 6 || !Number.isFinite(m.overall.p1) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete PDAGENT-BENCH result');
      return { model: m.name, score: 100 * m.overall.p1, setting: m.round + ', ' + categories + ' categories', open: m.open_weights, metrics };
    });
  },
};
export default board;
