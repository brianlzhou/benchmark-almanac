// ViLegalExpert evaluates Vietnamese legal question answering from authentic citizen-lawyer
// consultations across 34 legal domains. This importer reads Table 4 (Abstractive QA) of
// arXiv:2609.39189 via PDF text extraction, capturing ROUGE-L, METEOR, and BERTScore across
// all 16 pretrained seq2seq and open-weight LLM models on one consistent generative axis.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/pdf/2609.39189';

function parseQaTable(block: string): LeaderboardRow[] {
  const rows: LeaderboardRow[] = [];
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9][A-Za-z0-9.+_-]*(?:\s+[A-Za-z0-9.+_-]+)*)(?:\s*\[\d+\])?\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s*$/);
    if (!m) continue;
    const model = m[1].trim();
    if (/^(?:Method|Table|Best|MRC|Pre-trained|Open-source)$/i.test(model)) continue;
    rows.push({
      model,
      score: Number(m[2]),
      metrics: {
        meteor: Number(m[3]),
        bertScore: Number(m[4]),
      },
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'vilegalexpert',
  static: 'paper',
  url: 'https://arxiv.org/abs/2609.39189',
  feed: FEED,
  terms: 'arXiv permits these PDF paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is Abstractive QA ROUGE-L score from Table 4 of arXiv:2609.39189.',
  aliases: {
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Llama3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama3-8B-Instruct': 'llama-3-8b',
  },
  stats: {
    meteor: { name: 'METEOR', unit: 'score', better: 'higher' },
    bertScore: { name: 'BERTScore', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const t4Start = text.indexOf('Table 4.');
    const t4End = text.indexOf('Abstractive Question Answering.', t4Start);
    if (t4Start < 0 || t4End < 0) {
      throw new Error('ViLegalExpert Table 4 missing in PDF');
    }

    const abstractive = parseQaTable(text.slice(t4Start, t4End));
    if (abstractive.length !== 16) {
      throw new Error(`ViLegalExpert unexpected abstractive row count: ${abstractive.length}`);
    }

    return checked(abstractive, 16);
  },
};

export default board;
