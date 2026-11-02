// Vectara Hallucination Leaderboard on its original dataset (about 1,000 short documents). The current
// vectara/hallucination-leaderboard README is the 2025 dataset (vectara-hallucination-leaderboard-2.ts) and
// points to the hhem-2.3-old-dataset branch as the most recent board on the previous dataset, scored with
// HHEM-2.1 and last updated in October 2025. That branch's README table is read: Hallucination Rate (lower is
// better, the ranking and the score), Factual Consistency Rate, Answer Rate and summary length. Names lead
// with the vendor ("Google Gemini-2.0-Flash-001", "OpenAI GPT-4o"), which is dropped when it is a known
// company word.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdRecords, mdTables } from './big-bench-extra-hard.ts';

const FEED = 'https://raw.githubusercontent.com/vectara/hallucination-leaderboard/hhem-2.3-old-dataset/README.md';
const VENDORS = /^(OpenAI|Google|Anthropic|Meta|Microsoft|Mistral|Mistral AI|Amazon|Cohere|xAI|DeepSeek|Qwen|Alibaba|Zhipu AI|Zhipu|IBM|Nvidia|NVIDIA|AI21|AI21 Labs|01-AI|Snowflake|Databricks|Moonshot AI|MiniMax|Baidu|Tencent|ByteDance|AntGroup|Ant Group|Apple|TII|Allen AI|Ai2|Intel|Salesforce|Liquid AI|Perplexity|Reka|Writer|Upstage|InternLM|THUDM|Xiaomi|Meituan|Inception|LG AI|LG|Naver|SKT|Kakao)\s+/;

const board: Leaderboard = {
  benchmark: 'vectara-hallucination-leaderboard-hhem',
  url: 'https://github.com/vectara/hallucination-leaderboard/tree/hhem-2.3-old-dataset',
  feed: `${FEED} (Hallucination Rate)`,
  terms: 'README table on a branch of the vectara/hallucination-leaderboard repository, licensed Apache-2.0.',
  aliases: {},
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.head[0] === 'Model' && x.head[1] === 'Hallucination Rate');
    if (!t) throw new Error('Vectara old-dataset table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of mdRecords(t)) {
      const score = num(r['Hallucination Rate']);
      const model = r.Model?.replace(VENDORS, '').trim();
      if (model && score !== undefined) rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
