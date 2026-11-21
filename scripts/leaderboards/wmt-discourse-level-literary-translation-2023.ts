// The WMT literary translation task ranks systems within each submission group by human MQM score.
// Tables 2 and 3 of the organizers' report give automatic metrics and the human ranking.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2023.wmt-1.3.pdf#page=7";

const board: Leaderboard = {
  benchmark: "wmt-discourse-level-literary-translation-2023", static: 'paper',
  url: "https://aclanthology.org/2023.wmt-1.3.pdf#page=7",
  feed: FEED,
  terms: "Table 3 ranks primary systems and baselines within separate groups. ACL publishes the paper under CC BY 4.0. https://aclanthology.org/faq/copyright/ The robots URL returns HTML.",
  async fetch() {
    const pdf = await pdfText(FEED);
    const human = pdf.split(/Type\s+System\s+MQM\s+Rank/)[1]?.split('Table 3:')[0];
    const automatic = pdf.split('Table 2: Evaluation results')[0].split('d-BLEU↑').at(-1);
    if (!human || !automatic) throw new Error('Missing WMT score tables');
    const metricsByModel = new Map<string, Record<string, number>>();
    for (const match of automatic.matchAll(/([\w-]+)⋆?\s+((?:(?:\d+\.\d+|n\/a)\s+){4}\d+\.\d+)\s*$/gm)) {
      const metrics: Record<string, number> = {};
      match[2].trim().split(/\s+/).forEach((s, i) => { if (s !== 'n/a') metrics[['BLEU', 'chrF', 'COMET', 'TER', 'd-BLEU'][i]] = Number(s); });
      metricsByModel.set(match[1], metrics);
    }
    const rows = [...human.matchAll(/^ *(?:(?:Baselines|Primary|\(con\)|\(uncon\))\s+)?([\w-]+)(⋆?)\s+(\d+\.\d+)\s+(\d+)\b/gm)].map(([, model, star, score, rank]) => {
      const metrics = metricsByModel.get(model);
      if (!metrics) throw new Error('Missing automatic scores for ' + model);
      const setting = ['GPT-4', 'Google', 'Llama-MT'].includes(model) ? 'Baselines' : star ? 'Primary (unconstrained)' : 'Primary (constrained)';
      return { model, setting, score: Number(score), metrics: { ...metrics, groupRank: Number(rank) } };
    });
    if (rows.length < 10) throw new Error('Missing WMT primary systems or baselines');
    return rows;
  },
};
export default board;
