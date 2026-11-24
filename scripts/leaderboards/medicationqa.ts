// MedicationQA evaluates consumer medication question answering with ROUGE-1 F1.
// This importer reads Table 12 of the July 2025 CLUE+ study (Corbeil et al., ACL 2025),
// which evaluates 14 medical and general language models on adapted MedicationQA questions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2025.acl-long.950.pdf';

const MODELS: ReadonlyArray<readonly [string, string]> = [
  ['Phi-3.5-mini-instruct', 'Phi-3.5-mini-instruct'],
  ['DataMix', 'MediPhi SLERP DataMix'],
  ['PubMed', 'MediPhi SLERP PubMed'],
  ['Clinical', 'MediPhi SLERP Clinical'],
  ['MedWiki', 'MediPhi SLERP MedWiki'],
  ['MedCode', 'MediPhi SLERP MedCode'],
  ['Guideline', 'MediPhi SLERP Guideline'],
  ['MediPhi', 'MediPhi'],
  ['MediPhi-SFT', 'MediPhi-SFT'],
  ['MediPhi-Instruct', 'MediPhi-Instruct'],
  ['Mistral-7B-Instruct-v0.1', 'Mistral-7B-Instruct-v0.1'],
  ['BioMistral-7B-DARE', 'BioMistral-7B-DARE'],
  ['Meta-Llama-3-8B-Instruct', 'Meta-Llama-3-8B-Instruct'],
  ['Llama3-Med42-8B', 'Llama3-Med42-8B'],
];

const board: Leaderboard = {
  benchmark: 'medicationqa',
  static: 'paper',
  host: 'CLUE+',
  url: 'https://aclanthology.org/2025.acl-long.950/',
  feed: FEED,
  terms: 'ACL Anthology open-access paper (CC BY 4.0). Scores remain credited to Corbeil et al. and MedicationQA.',
  headline: 'Headline is ROUGE-1 F1 score on adapted MedicationQA from Table 12 of the CLUE+ ACL 2025 study.',
  aliases: {
    'Phi-3.5-mini-instruct': 'phi-3-5-mini',
    'Mistral-7B-Instruct-v0.1': 'mistral-7b-instruct-v0-1',
    'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('Table 12:');
    const end = text.indexOf('Table 13:', start);
    if (start < 0 || end < 0) throw new Error('CLUE+ Table 12 missing in ACL 2025 PDF');
    const block = text.slice(start, end);

    const rows: LeaderboardRow[] = [];
    for (const [token, display] of MODELS) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|\\s)${escaped}\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)`, 'm');
      const m = block.match(re);
      if (!m) throw new Error(`MedicationQA missing row for ${token} in CLUE+ Table 12`);
      rows.push({
        model: display,
        score: Number(m[2]),
      });
    }

    return checked(rows, 14);
  },
};

export default board;
