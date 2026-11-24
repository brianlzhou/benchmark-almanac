// FilBench evaluates large language models across 12 tasks in Philippine languages (Tagalog/Filipino and
// Cebuano) spanning four categories: Cultural Knowledge, Classical NLP, Reading Comprehension and Generation.
// The headline score is the overall FilBench Score in percent. Because the linked Hugging Face Space depends
// on a private results dataset, this importer reads Table 8 (all 27 models with overall and four category
// scores plus standard errors) and Table 6 (parameter counts and licenses) from the official FilBench paper
// on arXiv (2508.03523).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2508.03523';

function parsePm(cell: string, label: string): [number, number] {
  const m = cell.replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)(?:±|\\pm)(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`FilBench unexpected score cell for ${label}: "${cell}"`);
  return [Number(m[1]), Number(m[2])];
}

const board: Leaderboard = {
  benchmark: 'filbench',
  static: 'paper',
  url: 'https://arxiv.org/abs/2508.03523',
  feed: FEED,
  terms: PAPER_TERMS.replace(/;/g, ','),
  aliases: {
    'meta-llama/Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Qwen/Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'google/gemma-2-27b-it': 'gemma-2-27b',
    'mistralai/Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'google/gemma-2-9b-it': 'gemma-2-9b',
    'Qwen/Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Qwen/Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'mistralai/Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'meta-llama/Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'mistralai/Ministral-8B-Instruct-2410': 'ministral-8b',
    'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini',
  },
  parts: {
    culturalKnowledge: { name: 'Cultural Knowledge', group: 'Category', unit: '%' },
    classicalNlp: { name: 'Classical NLP', group: 'Category', unit: '%' },
    readingComp: { name: 'Reading Comprehension', group: 'Category', unit: '%' },
    generation: { name: 'Generation', group: 'Category', unit: '%' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const metaTable = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === '# Params (B)' && t[0]?.[3] === 'License');
    const scoreTables = tables.filter((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'FilBench Score');
    // Table 2 shows a 10-model highlight, Table 8 shows all 27 evaluated models
    const fullTable = scoreTables.sort((a, b) => b.length - a.length)[0];
    if (!metaTable || !fullTable || fullTable.length < 28) {
      throw new Error('FilBench paper Table 6 or Table 8 missing or incomplete');
    }

    const metaByModel = new Map<string, { params?: number; license?: string; open?: boolean }>();
    for (const r of metaTable.slice(1)) {
      const name = r[0]?.trim();
      if (!name) continue;
      const pMatch = r[1]?.trim().match(/^(\d+(?:\.\d+)?)/);
      const params = pMatch ? Number(pMatch[1]) : undefined;
      const lic = r[3]?.trim();
      const license = lic && lic !== '-' ? lic : undefined;
      const open = license ? !/ToS/i.test(license) : undefined;
      metaByModel.set(name, { params, license, open });
    }

    const rows: LeaderboardRow[] = [];
    for (const r of fullTable.slice(1)) {
      const rawModel = r[0]?.trim();
      if (!rawModel) continue;
      const [score, stderr] = parsePm(r[1] ?? '', `${rawModel} overall`);
      const [culturalKnowledge, culturalKnowledgeStderr] = parsePm(r[2] ?? '', `${rawModel} CK`);
      const [classicalNlp, classicalNlpStderr] = parsePm(r[3] ?? '', `${rawModel} CN`);
      const [readingComp, readingCompStderr] = parsePm(r[4] ?? '', `${rawModel} RC`);
      const [generation, generationStderr] = parsePm(r[5] ?? '', `${rawModel} GN`);

      const meta = metaByModel.get(rawModel);

      rows.push({
        model: rawModel,
        score,
        ...(meta?.params !== undefined ? { params: meta.params } : {}),
        ...(meta?.license ? { license: meta.license } : {}),
        ...(meta?.open !== undefined ? { open: meta.open } : {}),
        metrics: {
          stderr,
          culturalKnowledge,
          culturalKnowledgeStderr,
          classicalNlp,
          classicalNlpStderr,
          readingComp,
          readingCompStderr,
          generation,
          generationStderr,
        },
      });
    }

    return checked(rows, 27);
  },
};

export default board;
