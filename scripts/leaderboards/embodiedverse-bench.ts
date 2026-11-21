// EmbodiedVerse-Bench is a 2,042-question meta-dataset spanning ten embodied-vision evaluations.
// The leaderboard's Average is the arithmetic mean of the ten dataset overall scores.
// This importer reads the public results dataset used by the FlagEval-Robo leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const TREE = 'https://huggingface.co/api/datasets/open-cn-llm-leaderboard/EmbodiedVerse_results/tree/main?recursive=true';
const BASE = 'https://huggingface.co/datasets/open-cn-llm-leaderboard/EmbodiedVerse_results/resolve/main/';
const partNames: Record<string, string> = {
  where2Place: 'Where2Place', blink: 'Blink', cvBench: 'CVBench', roboSpatialHome: 'RoboSpatial-Home',
  embspatialBench: 'EmbspatialBench', allAnglesBench: 'All-Angles Bench', vsiBench: 'VSI-Bench', sat: 'SAT',
  egoPlanBench2: 'EgoPlan-Bench2', erqa: 'ERQA',
};
const aliases: Record<string, string> = {
  Where2Place: 'where2Place', Blink: 'blink', CVBench: 'cvBench', 'RoboSpatial-Home': 'roboSpatialHome',
  EmbspatialBench: 'embspatialBench', 'All-Angles Bench': 'allAnglesBench', 'VSI-Bench': 'vsiBench', SAT: 'sat',
  'EgoPlan-Bench2': 'egoPlanBench2', ERQA: 'erqa',
  where2place: 'where2Place', blink_val_ev: 'blink', cv_bench_test: 'cvBench', robo_spatial_home_all: 'roboSpatialHome',
  embspatial_bench: 'embspatialBench', all_angles_bench: 'allAnglesBench', vsi_bench_tiny: 'vsiBench',
  egoplan_bench2: 'egoPlanBench2', erqa: 'erqa',
};
const board: Leaderboard = {
  benchmark: 'embodiedverse-bench', url: 'https://huggingface.co/spaces/BAAI/FlagEval-Robo', feed: TREE,
  terms: 'The results dataset is published under Apache License 2.0. https://huggingface.co/datasets/open-cn-llm-leaderboard/EmbodiedVerse_results',
  headline: "The leaderboard's Average is the arithmetic mean of its ten dataset overall scores.",
  parts: Object.fromEntries(Object.entries(partNames).map(([key, name]) => [key, { name, group: 'Dataset', unit: '%' }])),
  stats: { Perception: { name: 'Perception', unit: '%', better: 'higher' }, SpatialReasoning: { name: 'Spatial reasoning', unit: '%', better: 'higher' }, Prediction: { name: 'Prediction', unit: '%', better: 'higher' }, Planning: { name: 'Planning', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const files = await fetchJson<{ path: string }[]>(TREE);
    const byModel = new Map<string, string[]>();
    for (const file of files) {
      const match = file.path.match(/^([^/]+)\/(results_collect\.json|results_[^/]+\.json)$/);
      if (!match) continue;
      const paths = byModel.get(match[1]) ?? [];
      paths.push(file.path);
      byModel.set(match[1], paths);
    }
    const rows: LeaderboardRow[] = [];
    for (const paths of byModel.values()) {
      const path = paths.find((value) => value.endsWith('/results_collect.json')) ?? paths.sort().at(-1);
      if (!path) continue;
      const data = await fetchJson<{ config_general?: { model_name?: string }; results?: Record<string, { overall?: number; acc?: number }> }>(BASE + path);
      const metrics: Record<string, number> = {};
      for (const [name, result] of Object.entries(data.results ?? {})) {
        const key = aliases[name];
        const value = result.overall ?? result.acc;
        if (key && typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      const values = Object.keys(partNames).map((key) => metrics[key]);
      if (values.length !== 10 || values.some((value) => !Number.isFinite(value))) throw new Error(`Incomplete EmbodiedVerse results in ${path}`);
      rows.push({ model: data.config_general?.model_name ?? path.split('/')[0], score: values.reduce((sum, value) => sum + value, 0) / values.length, metrics });
    }
    return checked(rows, 2);
  },
};
export default board;
