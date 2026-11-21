// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// AgentClinic tests diagnostic accuracy in simulated consultations. Appendix D gives exact percentages and 95% intervals.
// NEJM has two image-availability settings. Each uses the same published MedQA and MIMIC-IV scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2405.07960';
function results(section: string) {
  const map = new Map<string, number[]>();
  for (const m of section.matchAll(/• ([^:•]+): ([\d.]+)% accuracy with a 95% CI of \[([\d.]+)%, ([\d.]+)%\]/g))
    map.set(m[1], m.slice(2).map(Number));
  if (!map.size) throw new Error('Missing Appendix D diagnostic accuracy values');
  return map;
}
const board: Leaderboard = {
  benchmark: 'agentclinic', static: 'paper', feed, url: feed,
  terms: 'The authors distribute their paper through arXiv, https://arxiv.org/licenses/nonexclusive-distrib/1.0/.',
  parts: { medQA: 'AgentClinic-MedQA', mimic: 'AgentClinic-MIMIC-IV', nejm: 'AgentClinic-NEJM' },
  headline: 'The paper reports no overall score, so this is the plain mean of diagnostic accuracy on its three datasets.',
  aliases: { 'GPT-4 (snapshot unspecified)': 'gpt-4-jun-2023', 'GPT-4o (snapshot unspecified)': 'gpt-4o-may-2024' },
  async fetch() {
    const appendix = text(await paperHtml(feed)).split('D.1 AgentClinic-MIMIC-IV').at(-1)!;
    const [mimicBlock, rest] = appendix.split('D.2 AgentClinic-MedQA');
    const [medqaBlock, nejmBlock] = rest.split('D.3 AgentClinic-NEJM');
    const [initial, requested] = nejmBlock.split('D.4 Interpretation')[0].split('Accuracy when images must be requested');
    const common = { mimic: results(mimicBlock), medQA: results(medqaBlock) };
    const rows: LeaderboardRow[] = [];
    for (const [setting, block] of [['Images supplied initially', initial], ['Images requested during consultation', requested]]) {
      for (const [model, values] of results(block)) {
        if (!common.mimic.has(model) || !common.medQA.has(model)) continue;
        const metrics: Record<string, number> = {};
        for (const [key, triple] of Object.entries({ mimic: common.mimic.get(model)!, medQA: common.medQA.get(model)!, nejm: values }))
          [metrics[key], metrics[key + 'Low'], metrics[key + 'High']] = triple;
        rows.push({ model, setting, score: (metrics.mimic + metrics.medQA + metrics.nejm) / 3, metrics });
      }
    }
    return checked(rows, 4);
  },
};
export default board;
