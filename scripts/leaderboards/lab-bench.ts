// LAB-Bench: mean accuracy on the full public and private dataset, in percent.
// The paper defines it as "average accuracy of models on all of LAB-Bench weighted equally by subtask".
// Apply that plain mean to all 31 task/subtask rows in the accuracy appendix, without counting any category twice.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2407.10362";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const SUBTASKS: [string, string, string][] = [
  ['LitQA2', 'LitQA2', 'Category'],
  ['SuppQA', 'SuppQA', 'Category'],
  ['FigQA', 'FigQA', 'Category'],
  ['TableQA', 'TableQA', 'Category'],
  ['DbQA_dga_task-v1', 'DGA', 'DbQA'],
  ['DbQA_gene_location_task-v1', 'Gene location', 'DbQA'],
  ['DbQA_mirna_targets_task-v1', 'miRNA targets', 'DbQA'],
  ['DbQA_mouse_tumor_gene_sets-v1', 'Mouse tumor gene sets', 'DbQA'],
  ['DbQA_oncogenic_signatures_task-v1', 'Oncogenic signatures', 'DbQA'],
  ['DbQA_tfbs_GTRD_task-v1', 'TFBS GTRD', 'DbQA'],
  ['DbQA_variant_from_sequence_task-v1', 'Variant from sequence', 'DbQA'],
  ['DbQA_variant_multi_sequence_task-v1', 'Variant multi sequence', 'DbQA'],
  ['DbQA_vax_response_task-v1', 'Vax response', 'DbQA'],
  ['DbQA_viral_ppi_task-v1', 'Viral PPI', 'DbQA'],
  ['ProtocolQA', 'ProtocolQA', 'Category'],
  ['SeqQA_ORF-seq-AAid-v1', 'ORF seq AA ID', 'SeqQA'],
  ['SeqQA_ORF-seq-AAseq-v1', 'ORF seq AA seq', 'SeqQA'],
  ['SeqQA_ORF-seq-numlen-v1', 'ORF seq num len', 'SeqQA'],
  ['SeqQA_ORF-transeff-v1', 'ORF trans eff', 'SeqQA'],
  ['SeqQA_PCR-gene-enzprimers-v1', 'PCR gene enz primers', 'SeqQA'],
  ['SeqQA_PCR-gene-gibshindprimers-v1', 'PCR gene gibs hind primers', 'SeqQA'],
  ['SeqQA_PCR-gene-gibssmaprimers-v1', 'PCR gene gibs sma primers', 'SeqQA'],
  ['SeqQA_PCR-geneprimers-enz-v1', 'PCR gene primers enz', 'SeqQA'],
  ['SeqQA_PCR-len-primers-v1', 'PCR len primers', 'SeqQA'],
  ['SeqQA_PCR-primers-len-v1', 'PCR primers len', 'SeqQA'],
  ['SeqQA_PCR-seq-enzprimers-v1', 'PCR seq enz primers', 'SeqQA'],
  ['SeqQA_PCR-seq-primers-v1', 'PCR seq primers', 'SeqQA'],
  ['SeqQA_Prop-seq-gcpercent-v1', 'Prop seq GC percent', 'SeqQA'],
  ['SeqQA_RE-seq-lenfrags-v1', 'RE seq len frags', 'SeqQA'],
  ['SeqQA_RE-seq-numfrags-v1', 'RE seq num frags', 'SeqQA'],
  ['CloningScenarios', 'CloningScenarios', 'Category'],
];

const board: Leaderboard = {
  benchmark: "lab-bench", static: 'paper',
  url: "https://www.futurehouse.org/research-announcements/lab-bench-measuring-capabilities-of-language-models-for-biology-research",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  parts: Object.fromEntries(SUBTASKS.map(([k, name, group]) => [k, { name, group }])),
  stats: {
    precision: { name: 'Mean precision', unit: '%', better: 'higher' },
    coverage: { name: 'Mean coverage', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const all = await paperTables(FEED);
    const [t, prec, cov] = [all[2], all[3], all[4]];
    if (t?.[0]?.[2]?.text !== 'claude-3-5-sonnet-20240620' || t.length !== 32) throw new Error('LAB accuracy table changed');
    if (prec?.length !== 32 || cov?.length !== 32) throw new Error('LAB precision or coverage table changed');
    return t[0].slice(2).map((c, i) => {
      const values = t.slice(1).map(r => num(r[i + 2]?.text));
      const pVals = prec.slice(1).map(r => num(r[i + 2]?.text));
      const cVals = cov.slice(1).map(r => num(r[i + 2]?.text));
      if (values.some(v => v === undefined) || pVals.some(v => v === undefined) || cVals.some(v => v === undefined)) throw new Error('LAB missing subtask');
      const metrics: Record<string, number> = {
        precision: Number((pVals.reduce((a, b) => a! + b!, 0)! / 31 * 100).toFixed(2)),
        coverage: Number((cVals.reduce((a, b) => a! + b!, 0)! / 31 * 100).toFixed(2)),
      };
      t.slice(1).forEach((r, idx) => {
        const key = r[0]?.text.trim();
        if (key && values[idx] !== undefined) metrics[key] = Number((values[idx]! * 100).toFixed(2));
      });
      return { model: paperModel(c.text), score: Number((values.reduce((a, b) => a! + b!, 0)! / 31 * 100).toFixed(4)), metrics };
    });
  },
};
export default board;
