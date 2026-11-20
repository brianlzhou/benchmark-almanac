// QIMMA published average percentage and component scores from the public Space API. Preserve checkpoint and precision, without mapping community fine-tunes to their bases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://qimma-leaderboard.hf.space/api/leaderboard";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "qimma",
  parts: {
    'AraDiCE-Culture': { name: 'AraDiCE-Culture', group: 'Split' },
    ArabicMMLU: { name: 'ArabicMMLU', group: 'Split' },
    ArabCulture: { name: 'ArabCulture', group: 'Split' },
    PALMX: { name: 'PALMX', group: 'Split' },
    '3LM STEM': { name: '3LM STEM', group: 'Split' },
    AraTrust: { name: 'AraTrust', group: 'Split' },
    MizanQA: { name: 'MizanQA', group: 'Split' },
    MedArabiQ: { name: 'MedArabiQ', group: 'Split' },
    ArabLegalQA: { name: 'ArabLegalQA', group: 'Split' },
    GAT: { name: 'GAT', group: 'Split' },
    MedAraBench: { name: 'MedAraBench', group: 'Split' },
    'HumanEval+': { name: 'HumanEval+', group: 'Split' },
    'MBPP+': { name: 'MBPP+', group: 'Split' },
    FannOrFlop: { name: 'FannOrFlop', group: 'Split' },
    MedArabiQ_MCQ: { name: 'MedArabiQ multiple choice', group: 'Split' },
    MedArabiQ_QA: { name: 'MedArabiQ QA', group: 'Split', note: 'Generative QA scored with BERTScore F1.' },
  },
  url: "https://huggingface.co/spaces/qimma/leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at qimma-leaderboard.hf.space; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const data = await fetchJson<{data: Record<string, any>[]}>(FEED);
    const makers = new Set(['Qwen','meta-llama','google','microsoft','mistralai','deepseek-ai','CohereForAI','CohereLabs','nvidia','allenai','tiiuae','ibm-granite','01-ai','inceptionai','QCRI','ALLaM-AI','Applied-Innovation-Center']);
    const out: LeaderboardRow[] = [];
    for (const r of data.data) {
      const name = r['Model Name']; if (!name || typeof r.Average !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [k,v] of Object.entries(r)) if (typeof v === 'number' && !['Rank','Average','Model Size','Hub ❤️'].includes(k)) metrics[k] = v;
      out.push({model: makers.has(name.split('/')[0]) ? name : name.replace('/', ' '), score: r.Average, setting: [r['Full Type'],r.Precision,`checkpoint ${r.Revision}`].filter(Boolean).join('; '), metrics});
    }
    if (!out.length) throw new Error('QIMMA leaderboard missing');
    return out;
  },
};
export default board;
