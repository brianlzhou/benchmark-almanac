// Nejumi LLM Leaderboard 2 (Nejumi-leaderboard Neo) evaluates Japanese LLMs on two axes in the public W&B
// project wandb-japan/llm-leaderboard: jaster (llm-jp-eval language understanding, 0 to 1) and Japanese
// MT-Bench (generation judged on 0 to 10). Because the two axes have different scales and the board reports
// no single combined column, AVG_jaster is used as the headline score and AVG_mtbench plus all jaster and
// MT-Bench category and task scores are preserved in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const FEED = 'https://api.wandb.ai/graphql';
const PROJECT = 'wandb-japan/llm-leaderboard';
const QUERY = `query ($after: String, $filters: JSONString!) {
  project(entityName: "wandb-japan", name: "llm-leaderboard") {
    runs(first: 100, after: $after, filters: $filters) {
      edges { node { name displayName createdAt summaryMetrics } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

interface Run {
  name: string;
  displayName: string;
  createdAt: string;
  summaryMetrics: string;
}
interface Page {
  data: { project: { runs: { edges: { node: Run }[]; pageInfo: { hasNextPage: boolean; endCursor: string } } } };
}
interface Table {
  columns: string[];
  data: (string | number | null)[][];
}

const JASTER_CATS: Record<string, string> = {
  EL: 'Entity linking (EL)',
  FA: 'Fundamental analysis (FA)',
  MC: 'Multiple choice (MC)',
  MR: 'Mathematical reasoning (MR)',
  NLI: 'Natural language inference (NLI)',
  QA: 'Question answering (QA)',
  RC: 'Reading comprehension (RC)',
};
const JASTER_TASKS: Record<string, string> = {
  chabsa_set_f1: 'chABSA (set F1)',
  jamp_exact_match: 'JAMP (exact match)',
  janli_exact_match: 'JaNLI (exact match)',
  jcommonsenseqa_exact_match: 'JCommonsenseQA (exact match)',
  jemhopqa_char_f1: 'JEMHopQA (char F1)',
  jnli_exact_match: 'JNLI (exact match)',
  jsem_exact_match: 'JSeM (exact match)',
  jsick_exact_match: 'JSICK (exact match)',
  jsquad_char_f1: 'JSQuAD (char F1)',
  mawps_exact_match: 'MAWPS (exact match)',
  niilc_char_f1: 'NIILC (char F1)',
  wiki_coreference_set_f1: 'Wiki Coreference (set F1)',
  wiki_dependency_set_f1: 'Wiki Dependency (set F1)',
  wiki_ner_set_f1: 'Wiki NER (set F1)',
  wiki_pas_set_f1: 'Wiki PAS (set F1)',
  wiki_reading_char_f1: 'Wiki Reading (char F1)',
};
const MTBENCH_CATS: Record<string, string> = {
  AVG_mtbench: 'MT-Bench average',
  coding: 'MT-Bench coding',
  extraction: 'MT-Bench extraction',
  humanities: 'MT-Bench humanities',
  math: 'MT-Bench math',
  reasoning: 'MT-Bench reasoning',
  roleplay: 'MT-Bench roleplay',
  stem: 'MT-Bench STEM',
  writing: 'MT-Bench writing',
};

const parts: Record<string, BoardPart> = {
  ...Object.fromEntries(Object.entries(JASTER_CATS).map(([k, name]) => [k, { name, group: 'jaster category', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(JASTER_TASKS).map(([k, name]) => [k, { name, group: 'jaster task', unit: 'score' }])),
  ...Object.fromEntries(
    Object.entries(MTBENCH_CATS).map(([k, name]) => [
      k,
      { name, group: 'MT-Bench', unit: 'score', ...(k === 'AVG_mtbench' ? { note: 'Scored on a 0 to 10 scale.' } : {}) },
    ]),
  ),
};

const pause = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const board: Leaderboard = {
  benchmark: 'nejumi-llm-leaderboard-2',
  url: 'https://wandb.ai/wandb-japan/llm-leaderboard',
  feed: `${FEED} (${PROJECT}, leaderboard-tagged runs)`,
  terms: 'The tagged repository identifies this public W&B project and states no separate terms for its scores. https://github.com/wandb/llm-leaderboard/tree/v2.0.0',
  headline: 'The board reports jaster (0 to 1) and MT-Bench (0 to 10) on separate scales, so this is the AVG_jaster column, with AVG_mtbench and all category scores kept in parts.',
  aliases: {
    'anthropic.claude-3-opus-20240229-v1:0': 'claude-3-opus',
    'anthropic.claude-3-sonnet-20240229-v1:0': 'claude-3-sonnet',
    'anthropic.claude-3-haiku-20240307-v1:0': 'claude-3-haiku',
    'anthropic.claude-v2:1': 'claude-2-1',
    'anthropic.claude-v2': 'claude-2',
    'CohereForAI/c4ai-command-r-plus': 'command-r-plus',
    '01-ai/Yi-34B-Chat': 'yi-34b',
    'Qwen/Qwen1.5-72B-Chat': 'qwen1-5-72b',
    'Qwen/Qwen1.5-7B-Chat': 'qwen1-5-7b-chat',
    'meta-llama/Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'meta-llama/Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'meta-llama/Llama-2-70b-chat-hf': 'llama-2-70b',
    'meta-llama/Llama-2-13b-chat-hf': 'llama-2-13b',
    'meta-llama/Llama-2-7b-chat-hf': 'llama-2-7b',
    'mistralai/Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'mistralai/Mistral-7B-Instruct-v0.2': 'mistral-7b-instruct-v0-2',
    'mistralai/Mistral-7B-Instruct-v0.1': 'mistral-7b-instruct-v0-1',
    'google/gemma-7b-it': 'gemma-7b',
    'google/gemma-2b-it': 'gemma-2b',
    'gemini-pro': 'gemini-1-0-pro',
    'gpt-4-0613': 'gpt-4-jun-2023',
    'gpt-4-1106-preview': 'gpt-4-turbo-nov-2023',
    'gpt-4-0125-preview': 'gpt-4-turbo-jan-2024',
    'gpt-4-turbo-2024-04-09': 'gpt-4-turbo-apr-2024',
    'mistral-large-2402': 'mistral-large',
    'mistral-medium': 'mistral-medium',
  },
  parts,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    let after: string | null = null;
    do {
      const page: Page = await fetchJson(FEED, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { after, filters: JSON.stringify({ tags: { $in: ['leaderboard'] } }) } }),
      });
      const { edges, pageInfo } = page.data.project.runs;
      for (const { node } of edges) {
        const summary = JSON.parse(node.summaryMetrics || '{}') as Record<string, { path?: string }>;
        const path = summary.leaderboard_table?.path;
        if (!path?.startsWith('media/table/leaderboard_table_')) continue;
        await pause();
        const raw = await fetchText(`https://api.wandb.ai/files/${PROJECT}/${node.name}/${path}`);
        const table = JSON.parse(raw.replace(/([,\[]\s*)NaN(?=\s*[,\]])/g, '$1null')) as Table;
        if ((!table.columns.includes('AVG_jaster') && !table.columns.includes('AVG')) || !table.data.length) continue;
        for (const cells of table.data) {
          const rec = Object.fromEntries(table.columns.map((k, i) => [k, cells[i]]));
          const model = (typeof rec.basemodel_name === 'string' && rec.basemodel_name.trim()) || node.displayName.trim();
          const score = typeof rec.AVG_jaster === 'number' ? rec.AVG_jaster : rec.AVG;
          if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;
          const metrics: Record<string, number> = {};
          for (const k of Object.keys(parts)) {
            const v = rec[k];
            if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = Number(v.toFixed(6));
          }
          const shots = typeof rec.num_few_shots === 'number' ? `${rec.num_few_shots}-shot` : undefined;
          const dtype = typeof rec.data_type === 'string' && rec.data_type && rec.data_type !== 'None' ? rec.data_type : undefined;
          const setting = [shots, dtype].filter(Boolean).join(', ') || undefined;
          rows.push({
            model,
            score: Number(score.toFixed(6)),
            setting,
            date: node.createdAt.slice(0, 10),
            link: `https://wandb.ai/${PROJECT}/runs/${node.name}`,
            ...(Object.keys(metrics).length ? { metrics } : {}),
          });
        }
      }
      after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
      if (after) await pause(800);
    } while (after);
    if (rows.length < 50) throw new Error(`Expected at least 50 Nejumi 2 rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
