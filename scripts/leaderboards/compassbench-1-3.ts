// CompassBench v1.3 is the July 2024 edition of OpenCompass's CompassRank LLM benchmark suite,
// covering Language, Knowledge, Reasoning, Math, Code, Instruction following and Agent tasks in
// English and Chinese. This importer reads OpenCompass's published 2024-07 CDN JSON file directly
// and preserves the overall Average score alongside every domain and subtask breakdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://cdn.opencompass.org.cn/assets/llm-rank/llm-data-v2.24-07.20240805.json';

interface TableRow {
  model?: string;
  time?: string;
  update_time?: string;
  chat_or_base?: string;
  Average?: number;
  [k: string]: unknown;
}

const board: Leaderboard = {
  benchmark: 'compassbench-1-3',
  url: 'https://rank.opencompass.org.cn/leaderboard-llm',
  feed: FEED,
  terms: 'OpenCompass robots restrictions include leaderboard data paths. The Almanac credits OpenCompass and links the source.',
  aliases: {
    'Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
    'Llama3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama3.1-8B-Instruct': 'llama-3-1-8b',
    'Gemma-2-27B-it': 'gemma-2-27b',
    'Gemma-2-9B-it': 'gemma-2-9b',
    'Qwen1.5-110B-Chat': 'qwen1-5-110b',
    'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'DBRX-Instruct': 'dbrx',
  },
  parts: {
    Average_CN: { name: 'Chinese average', group: 'Language split' },
    Average_EN: { name: 'English average', group: 'Language split' },
    Language: { name: 'Language', group: 'Domain' },
    Language_CN: { name: 'Language (Chinese)', group: 'Domain' },
    Language_EN: { name: 'Language (English)', group: 'Domain' },
    Knowledge: { name: 'Knowledge', group: 'Domain' },
    Knowledge_CN: { name: 'Knowledge (Chinese)', group: 'Domain' },
    Knowledge_EN: { name: 'Knowledge (English)', group: 'Domain' },
    Reasoning: { name: 'Reasoning', group: 'Domain' },
    Reasoning_CN: { name: 'Reasoning (Chinese)', group: 'Domain' },
    Reasoning_EN: { name: 'Reasoning (English)', group: 'Domain' },
    Math: { name: 'Math', group: 'Domain' },
    Math_CN: { name: 'Math (Chinese)', group: 'Domain' },
    Math_EN: { name: 'Math (English)', group: 'Domain' },
    Code: { name: 'Code', group: 'Domain' },
    Code_CN: { name: 'Code (Chinese)', group: 'Domain' },
    Code_EN: { name: 'Code (English)', group: 'Domain' },
    Instruct: { name: 'Instruction following', group: 'Domain' },
    Instruct_CN: { name: 'Instruction following (Chinese)', group: 'Domain' },
    Instruct_EN: { name: 'Instruction following (English)', group: 'Domain' },
    Agent: { name: 'Agent', group: 'Domain' },
    Agent_CN: { name: 'Agent (Chinese)', group: 'Domain' },
    Agent_EN: { name: 'Agent (English)', group: 'Domain' },
    NLP_CN_CE: { name: 'NLP (Chinese)', group: 'Subtask' },
    Creation_CN_CE: { name: 'Creation (Chinese)', group: 'Subtask' },
    Dialogue_CN_CE: { name: 'Dialogue (Chinese)', group: 'Subtask' },
    NLP_EN_CE: { name: 'NLP (English)', group: 'Subtask' },
    Creation_EN_CE: { name: 'Creation (English)', group: 'Subtask' },
    Dialogue_EN_CE: { name: 'Dialogue (English)', group: 'Subtask' },
    Knowledge_Humanity_EN_CE: { name: 'Humanities knowledge (English)', group: 'Subtask' },
    Knowledge_Social_Science_EN_CE: { name: 'Social science knowledge (English)', group: 'Subtask' },
    Knowledge_Engineering_EN_CE: { name: 'Engineering knowledge (English)', group: 'Subtask' },
    Knowledge_Science_EN_CE: { name: 'Science knowledge (English)', group: 'Subtask' },
    Knowledge_Humanity_CN_CE: { name: 'Humanities knowledge (Chinese)', group: 'Subtask' },
    Knowledge_Social_Science_CN_CE: { name: 'Social science knowledge (Chinese)', group: 'Subtask' },
    Knowledge_Engineering_CN_CE: { name: 'Engineering knowledge (Chinese)', group: 'Subtask' },
    Knowledge_Science_CN_CE: { name: 'Science knowledge (Chinese)', group: 'Subtask' },
    Reason_Common_Sense_CN_CE: { name: 'Commonsense reasoning (Chinese)', group: 'Subtask' },
    Reason_Social_CN_CE: { name: 'Social reasoning (Chinese)', group: 'Subtask' },
    Reason_Humanities_CN_CE: { name: 'Humanities reasoning (Chinese)', group: 'Subtask' },
    Reason_Science_Engineering_CN_CE: { name: 'Science and engineering reasoning (Chinese)', group: 'Subtask' },
    Reason_Common_Sense_EN_CE: { name: 'Commonsense reasoning (English)', group: 'Subtask' },
    Reason_Social_EN_CE: { name: 'Social reasoning (English)', group: 'Subtask' },
    Reason_Humanities_EN_CE: { name: 'Humanities reasoning (English)', group: 'Subtask' },
    Reason_Science_Engineering_EN_CE: { name: 'Science and engineering reasoning (English)', group: 'Subtask' },
    Math_College_CN: { name: 'College math (Chinese)', group: 'Subtask' },
    Math_College_EN: { name: 'College math (English)', group: 'Subtask' },
    Math_Arith: { name: 'Arithmetic', group: 'Subtask' },
    HumanEval_CN: { name: 'HumanEval (Chinese)', group: 'Subtask' },
    HumanEval_Plus_EN: { name: 'HumanEval+ (English)', group: 'Subtask' },
    LCBench_CN: { name: 'LiveCodeBench (Chinese)', group: 'Subtask' },
    LCBench_EN: { name: 'LiveCodeBench (English)', group: 'Subtask' },
    Code_QA_CN: { name: 'Code QA (Chinese)', group: 'Subtask' },
    Code_QA_EN: { name: 'Code QA (English)', group: 'Subtask' },
    TEval_CN: { name: 'T-Eval (Chinese)', group: 'Subtask' },
    TEval_EN: { name: 'T-Eval (English)', group: 'Subtask' },
  },
  async fetch() {
    const data = await fetchJson<Record<string, TableRow[]>>(FEED);
    const overall = data.OverallTable ?? [];
    if (overall.length < 30) throw new Error(`Expected at least 30 CompassBench v1.3 rows, got ${overall.length}`);
    const subTables = ['LanguageTable', 'KnowledgeTable', 'ReasonTable', 'MathTable', 'CodeTable', 'InstructTable', 'AgentTable'];
    const skip = new Set(['key', 'Average', 'Average_CN', 'Average_EN']);
    const rows: LeaderboardRow[] = [];
    for (const r of overall) {
      if (!r.model || typeof r.Average !== 'number' || !Number.isFinite(r.Average)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(r)) {
        if (k !== 'key' && k !== 'Average' && typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const tbl of subTables) {
        const match = (data[tbl] ?? []).find((s) => s.model === r.model);
        if (!match) continue;
        for (const [k, v] of Object.entries(match)) {
          if (!skip.has(k) && typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
        }
      }
      rows.push({
        model: r.model.trim(),
        score: r.Average,
        setting: r.chat_or_base?.trim() || undefined,
        metrics,
      });
    }
    if (rows.length < 30) throw new Error(`Parsed only ${rows.length} CompassBench v1.3 rows`);
    return rows;
  },
};
export default board;
