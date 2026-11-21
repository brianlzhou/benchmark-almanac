// This shared task tests dialect classification and transcription of Tamil speech.
// Table 4 ranks classifiers by macro F1. Table 5 adds transcription WER for the two explicitly shared multi-task models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.dravidianlangtech-1.9.pdf';
const classifiers: Record<string, string> = {
  Wise: 'Wav2Vec 2.0 Base', Wave2Word: 'Whisper Small', IITK_SpeechScape: 'WavLM', GigitAI: 'ECAPA-TDNN',
  CHMOD_777: 'Wav2Vec 2.0 Base', Sync2: 'ECAPA-TDNN', DLRG: 'Wav2Vec 2.0', SpokenRoots: 'HuBERT Base',
  AITamilDialect: 'Wav2Vec 2.0', CUET_InferX: 'MuRIL', CODERS: 'Wav2Vec 2.0', Azrael: 'Wav2Vec 2.0 Small',
};
const board: Leaderboard = {
  benchmark: 'dravidianlangtech-tamil-dialect-speech-2026', url: feed, feed, harnesses: 'system',
  terms: 'ACL Anthology publishes this workshop paper. https://aclanthology.org/2026.dravidianlangtech-1.9/',
  stats: { precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' }, recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' } },
  parts: { classification: 'Dialect Classification', asr: { name: 'Dialect-aware ASR', unit: 'score', better: 'lower', note: 'Word error rate' } },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Table 4: Official ranking[\s\S]*?Precision\s+Recall\s+F1_Score([\s\S]*?)Table 5: Official ranking/);
    const asr = paper.split('Table 5: Official ranking')[1];
    if (!table || !asr) throw new Error('Missing Tamil dialect rankings');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].trim().split('\n')) {
      const [rank, submitter, run, precision, recall, f1] = line.trim().split(/\s+/);
      const model = classifiers[submitter];
      if (!model || !/^\d+$/.test(rank) || ![precision, recall, f1].every(s => /^0\.\d+$/.test(s))) throw new Error('Invalid dialect classification row');
      const score = Number(f1);
      const metrics: Record<string, number> = { classification: score, precision: Number(precision), recall: Number(recall) };
      if (submitter === 'AITamilDialect' || submitter === 'CODERS') {
        const label = submitter === 'CODERS' ? 'CODERS_Run1' : 'AITamilDialect';
        const match = asr.match(new RegExp('^\\s*\\d+\\s+' + label + '\\s+(\\d+\\.\\d+)', 'm'));
        if (!match) throw new Error('Missing WER for ' + label);
        metrics.asr = Number(match[1]);
      }
      const harness = run === '–' ? submitter : submitter + ' ' + run;
      rows.push({ model, submitter, harness, score, metrics });
    }
    return checked(rows, 12);
  },
};
export default board;
