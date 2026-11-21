// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// RRG24 tests chest X-ray report generation. Tables 2 and 3 score Findings and Impression.
// The system papers in the same volume identify the models. The Chile-3&2 row merges two team identities.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.bionlp-1.7.pdf';
const identities: Record<string, string> = {
  'e-Health CSIRO': 'CXRMate-RRG24', MAIRA: 'MAIRA', AIRI: 'OpenBio-LLM-8B + in-house DINOv2',
  'Gla-AI4BioMed': 'Med-CXRGen-F + Med-CXRGen-I', SICAR: 'Phi-2 + SigLIP', CID: 'Swinv2-base + Roberta-base',
};
const fields = ['Overall Score', 'BLEU-4', 'ROUGE-L', 'BERTScore', 'F1-CheXbert', 'F1-RadGraph'];
const sections = ['Findings', 'Impression'];
const parts = Object.fromEntries(sections.flatMap(s => fields.map(f => [s + f, s + ': ' + f])));
const board: Leaderboard = {
  benchmark: 'rrg24', url: 'https://aclanthology.org/2024.bionlp-1.7/', feed, static: 'paper', parts,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  headline: 'The paper reports each report section separately, so the headline averages the Findings and Impression scores.',
  async fetch() {
    const pdf = await pdfText(feed);
    const byTeam = new Map<string, Record<string, number>>();
    for (const [i, section] of sections.entries()) {
      const table = pdf.split('RRG24 Leaderboard for the ' + section + ' Section')[1]?.trim().split(/\n\s*\n/).find(t => t.includes('F1-RadGraph'));
      if (!table || !fields.every(f => table.includes(f))) throw new Error('Missing section columns: ' + section);
      const rows = [...table.matchAll(/^\s*\d+\s+(.+?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*$/gm)];
      if (rows.length !== 8-i) throw new Error('Unexpected section row count');
      for (const [, team, ...values] of rows) {
        const metrics = byTeam.get(team) ?? {};
        fields.forEach((f, j) => { metrics[section+f] = Number(values[j]); });
        byTeam.set(team, metrics);
      }
    }
    return checked(Object.entries(identities).map(([submitter, model]) => {
      const metrics = byTeam.get(submitter);
      if (!metrics || sections.some(s => !(s+'Overall Score' in metrics))) throw new Error('Missing team ' + submitter);
      return { model, submitter, metrics, score: (metrics['FindingsOverall Score'] + metrics['ImpressionOverall Score']) / 2 };
    }), 6);
  },
};
export default board;
