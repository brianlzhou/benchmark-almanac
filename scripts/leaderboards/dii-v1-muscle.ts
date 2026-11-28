// Data Intelligence Index (DII) v1.0 Muscle (HKU BIRD Team): 500 sandboxed data-agent tasks across 9 benchmarks.
// Reads results/leaderboard.jsonl on Hugging Face (all-500 headline joined with public-200 and hidden-300 split indices).
// Live dashboard at livesqlbench.ai/data-intelligence-index/dashboard draws a log-scale Cost vs Performance scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://livesqlbench.ai/data-intelligence-index/dashboard';
const FEED = 'https://huggingface.co/datasets/birdsql/dii-v1-muscle/raw/main/results/leaderboard.jsonl';

interface DiiRow {
  task_set: string;
  model: string;
  index: number;
  db_qa?: number;
  db_analysis_ops?: number;
  app_debug?: number;
  human_centric?: number;
  data_science?: number;
  query_opt?: number;
  computer_use?: number;
  mini_dev?: number;
  livesqlbench?: number;
  bird_critic?: number;
  bird_critic_15?: number;
  bird_interact?: number;
  ds_codetrans?: number;
  dare_bench?: number;
  effi_sql?: number;
  workspace_bench?: number;
  cost_per_task_usd?: number;
}

function splitModelSetting(raw: string): { model: string; setting?: string } {
  const m = raw.match(/^(.+?)\s+\(([^()]+)\)$/);
  if (!m) return { model: raw.trim() };
  return { model: m[1].trim(), setting: m[2].trim() };
}

const board: Leaderboard = {
  benchmark: 'dii-v1-muscle',
  url: PAGE,
  feed: FEED,
  terms: 'Public Hugging Face dataset and live dashboard published by the HKU BIRD team.',
  chart: {
    title: 'Cost vs Performance',
    x: { key: 'cost', label: 'Average cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Data Intelligence Index', unit: '%', better: 'higher' },
    note: 'Overall Data Intelligence Index across all 500 tasks against average API cost per task.',
  },
  parts: {
    public200: { name: 'Public 200', group: 'Split' },
    hidden300: { name: 'Hidden 300', group: 'Split' },
    dbQa: { name: 'Database QA', group: 'Category' },
    dbAnalysisOps: { name: 'Database analysis and ops', group: 'Category' },
    appDebug: { name: 'App debugging', group: 'Category' },
    humanCentric: { name: 'Human-centric interaction', group: 'Category' },
    dataScience: { name: 'Data science', group: 'Category' },
    queryOpt: { name: 'Query optimization', group: 'Category' },
    computerUse: { name: 'Computer use', group: 'Category' },
    miniDev: { name: 'BIRD Mini-Dev', group: 'Benchmark' },
    liveSqlBench: { name: 'LiveSQLBench', group: 'Benchmark' },
    birdCritic: { name: 'BIRD-Critic', group: 'Benchmark' },
    birdCritic15: { name: 'BIRD-Critic 1.5', group: 'Benchmark' },
    birdInteract: { name: 'BIRD-Interact', group: 'Benchmark' },
    dsCodeTrans: { name: 'DS-CodeTrans', group: 'Benchmark' },
    dareBench: { name: 'DARE-Bench', group: 'Benchmark' },
    effiSql: { name: 'EffiSQL', group: 'Benchmark' },
    workspaceBench: { name: 'WorkspaceBench', group: 'Benchmark' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`DII v1.0 Muscle JSONL: ${res.status}`);
    const text = await res.text();
    const parsed = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as DiiRow);

    const pubByModel = new Map<string, number>();
    const hidByModel = new Map<string, number>();
    for (const r of parsed) {
      if (r.task_set === 'public-200') pubByModel.set(r.model, r.index);
      else if (r.task_set === 'hidden-300') hidByModel.set(r.model, r.index);
    }

    const rows: LeaderboardRow[] = [];
    for (const r of parsed) {
      if (r.task_set !== 'all-500') continue;
      if (typeof r.index !== 'number' || !Number.isFinite(r.index)) continue;
      const { model, setting } = splitModelSetting(r.model);
      const metrics: Record<string, number> = {};
      const pub = pubByModel.get(r.model);
      const hid = hidByModel.get(r.model);
      if (typeof pub === 'number' && Number.isFinite(pub)) metrics.public200 = pub;
      if (typeof hid === 'number' && Number.isFinite(hid)) metrics.hidden300 = hid;
      const mapFields: Array<[keyof DiiRow, string]> = [
        ['db_qa', 'dbQa'],
        ['db_analysis_ops', 'dbAnalysisOps'],
        ['app_debug', 'appDebug'],
        ['human_centric', 'humanCentric'],
        ['data_science', 'dataScience'],
        ['query_opt', 'queryOpt'],
        ['computer_use', 'computerUse'],
        ['mini_dev', 'miniDev'],
        ['livesqlbench', 'liveSqlBench'],
        ['bird_critic', 'birdCritic'],
        ['bird_critic_15', 'birdCritic15'],
        ['bird_interact', 'birdInteract'],
        ['ds_codetrans', 'dsCodeTrans'],
        ['dare_bench', 'dareBench'],
        ['effi_sql', 'effiSql'],
        ['workspace_bench', 'workspaceBench'],
      ];
      for (const [srcKey, dstKey] of mapFields) {
        const val = r[srcKey];
        if (typeof val === 'number' && Number.isFinite(val)) metrics[dstKey] = val;
      }

      const row: LeaderboardRow = {
        model,
        score: r.index,
        metrics,
      };
      if (setting) row.setting = setting;
      if (typeof r.cost_per_task_usd === 'number' && Number.isFinite(r.cost_per_task_usd)) {
        row.cost = r.cost_per_task_usd;
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('DII v1.0 Muscle: parsed zero all-500 rows');
    return rows;
  },
};

export default board;
