// The organizers detect food recalls and outbreaks in news and extract six entity types.
// Table 5 ranks detection by F1 and reports extraction accuracy alongside it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://workshop-proceedings.icwsm.org/pdf/2025_55.pdf';
const systems: Record<string, {model: string, models?: string[], harness?: string}> = {
  CareLab: { model: 'RoBERTa', harness: 'RoBERTa ensemble and spaCy dependency parser' },
  'LLM Pros': { model: 'OpenAI o3-mini' },
  WITM: { model: 'DistilBERT', models: ['DistilBERT', 'LLaMA-3.1-8B', 'Bi-LSTM'] },
  Baseline: { model: 'BERT-based CNN, BiLSTM, multi-task model' },
};
const keys = ['Detection accuracy','Detection precision','Detection recall','Detection F1','Extraction accuracy',
  'Organization','Product','Cause','Disease','Number of People Affected','Location'];
export default {
  benchmark: 'smm4h-2025-food-recalls-and-outbreaks', url: feed, feed, static: 'paper',
  terms: 'Public SMM4H-HeaRD workshop proceedings at ' + feed,
  aliases: { 'OpenAI o3-mini': 'o3-mini' }, harnesses: 'system',
  headline: 'The paper gives no combined score. The headline is detection F1, the first subtask’s primary measure.',
  parts: Object.fromEntries(keys.map(key => [key,key])),
  async fetch() {
    const body = (await pdfText(feed)).match(/Team\s+Subtask 1\s+Subtask 2\s+System Summary\s+Acc\s+P\s+R\s+F1 Avg O([\s\S]*?)Table 5:/)?.[1];
    if (!body) throw new Error('Missing Table 5');
    const rows: LeaderboardRow[] = [];
    for (const [submitter,system] of Object.entries(systems)) {
      const line = body.split('\n').find(s => s.trimStart().startsWith(submitter + ' '));
      const values = line?.trim().slice(submitter.length).trim().split(/\s+/).slice(0,keys.length);
      if (values?.length !== keys.length || values.some(v => !/^\d\.\d\d$/.test(v))) throw new Error('Incomplete row for ' + submitter);
      rows.push({ ...system, submitter: submitter === 'Baseline' ? 'Organizers' : submitter,
        score: Number(values[3]), metrics: Object.fromEntries(keys.map((k,i) => [k,Number(values[i])])) });
    }
    return checked(rows, 4);
  },
} satisfies Leaderboard;
