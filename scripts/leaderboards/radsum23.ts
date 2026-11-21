// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// RadSum23 ranks radiology report summaries by F1-RadGraph on the open and hidden splits of two datasets.
// KnowLab Tables 3 and 4 identify the model on each split. CXR uses a second round of fine-tuning.
// The shs-nlp paper identifies its organizer Table 2 entry as RadBloomz: https://aclanthology.org/2023.bionlp-1.57/
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.bionlp-1.54.pdf';
const organizer = 'https://aclanthology.org/2023.bionlp-1.45.pdf';
const splits = ['iiiOpen', 'iiiHidden', 'cxrOpen', 'cxrHidden'];
const board: Leaderboard = {
  benchmark: 'radsum23', static: 'paper', url: organizer, feed,
  terms: 'ACL Anthology publishes these 2023 papers under CC BY 4.0. https://aclanthology.org/faq/copyright/',
  headline: 'The papers report no overall score, so the headline is the plain mean of F1-RadGraph across the four test sets.',
  aliases: { T5: 't5-base' },
  parts: { iiiOpen: 'MIMIC-III test set', iiiHidden: 'MIMIC-III hidden test set', cxrOpen: 'MIMIC-CXR test set', cxrHidden: 'MIMIC-CXR hidden test set' },
  stats: {
    iiiOpenBLEU4: { name: 'MIMIC-III open BLEU4', unit: '%', better: 'higher' }, iiiOpenROUGEL: { name: 'MIMIC-III open ROUGE-L', unit: '%', better: 'higher' }, iiiOpenBertScore: { name: 'MIMIC-III open BERTScore', unit: '%', better: 'higher' },
    iiiHiddenBLEU4: { name: 'MIMIC-III hidden BLEU4', unit: '%', better: 'higher' }, iiiHiddenROUGEL: { name: 'MIMIC-III hidden ROUGE-L', unit: '%', better: 'higher' }, iiiHiddenBertScore: { name: 'MIMIC-III hidden BERTScore', unit: '%', better: 'higher' },
    cxrOpenBLEU4: { name: 'MIMIC-CXR open BLEU4', unit: '%', better: 'higher' }, cxrOpenROUGEL: { name: 'MIMIC-CXR open ROUGE-L', unit: '%', better: 'higher' }, cxrOpenBertScore: { name: 'MIMIC-CXR open BERTScore', unit: '%', better: 'higher' }, cxrOpenF1CheXbert: { name: 'MIMIC-CXR open F1 CheXbert', unit: '%', better: 'higher' },
    cxrHiddenBLEU4: { name: 'MIMIC-CXR hidden BLEU4', unit: '%', better: 'higher' }, cxrHiddenROUGEL: { name: 'MIMIC-CXR hidden ROUGE-L', unit: '%', better: 'higher' }, cxrHiddenBertScore: { name: 'MIMIC-CXR hidden BERTScore', unit: '%', better: 'higher' }, cxrHiddenF1CheXbert: { name: 'MIMIC-CXR hidden F1 CheXbert', unit: '%', better: 'higher' },
  },
  async fetch() {
    const knowlab = await pdfText(feed);
    const tables = Array.from(knowlab.matchAll(/Models\s+BLEU4\s+RougeL\s+Bertscore\s+(?:F1-CheXbert\s+)?F1-RadGraph([^]*?)Table [34]: MIMIC-(?:III|CXR) test results/g), m => m[1]);
    if (tables.length !== 2) throw new Error('Missing KnowLab test tables');
    const rows: LeaderboardRow[] = [];
    function add(model: string, submitter: string, setting: string, cells: number[][]) {
      const metrics: Record<string, number> = {};
      cells.forEach((v, i) => {
        if (v.length !== (i < 2 ? 4 : 5) || !v.every(Number.isFinite)) throw new Error('Missing scores for ' + model);
        const split = splits[i];
        metrics[split] = v.at(-1)!;
        ['BLEU4', 'ROUGEL', 'BertScore'].forEach((k, j) => { metrics[split + k] = v[j]; });
        if (i >= 2) metrics[split + 'F1CheXbert'] = v[3];
      });
      rows.push({ model, submitter, setting, metrics, score: splits.reduce((sum, k) => sum + metrics[k], 0) / 4 });
    }
    for (const model of ['BART', 'T5']) {
      const cells = tables.flatMap(t => ['', '(hidden)'].map(suffix => {
        const row = t.trim().split('\n').map(l => l.trim().split(/\s+/)).find(r => r[0] === model + suffix);
        if (!row) throw new Error('Missing KnowLab model or split');
        return row.slice(1).map(Number);
      }));
      add(model, 'KnowLab', 'Fine-tuned on MIMIC-III with further fine-tuning for MIMIC-CXR', cells);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const paper = await pdfText(organizer);
    const section = paper.split(/Team\s+BLEU4\s+ROUGEL\s+Bertscore\s+F1-cheXbert\s+F1-RadGraph/)[1]?.split('Table 2: Leaderboard results')[0];
    const cells = [...(section ?? '').matchAll(/shs-nlp\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(N\/A|[\d.]+)\s+([\d.]+)/g)].map(m => m.slice(1).filter(v => v !== 'N/A').map(Number));
    if (cells.length !== 4) throw new Error('Expected four RadBloomz results');
    add('RadBloomz', 'shs-nlp', 'Zero-shot', [cells[2], cells[0], cells[3], cells[1]]);
    return checked(rows, 3);
  },
};
export default board;
