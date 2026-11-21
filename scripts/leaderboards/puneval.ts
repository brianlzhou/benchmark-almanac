// PunEval tests pun recognition, explanation and generation. These tasks use different measures.
// The headline is Table 2's first measure, homographic true positive rate with the pun-biased prompt.
// The authors' results files give all recognition settings. Model-level explanation and generation
// results appear beside the basic prompt row, labeled with their own evaluation conditions.
import type { BoardPart, Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://raw.githubusercontent.com/Zhijun-Xu/PunEval/main/results/';
const feed = base + 'pun_recognition_metrics.json';
const parts: Record<string,BoardPart> = {};
const staticGroups = {
  Explanationpunchlinecheck: ['Homographicpun_punword', 'Homographicpun_alterword', 'Homographicpun_punsense', 'Homographicpun_altersense', 'Heterographicpun_punword', 'Heterographicpun_alterword', 'Heterographicpun_punsense', 'Heterographicpun_altersense', 'Nonpun_rationality', 'Nonpun_informativeness', 'Nonpun_R1I0', 'Nonpun_R0I1'],
  Explanationcomparisonwithhumans: ['Homographic_tie', 'Homographic_humanwin', 'Homographic_modelwin', 'Heterographic_tie', 'Heterographic_humanwin', 'Heterographic_modelwin'],
  Generation: ['text1_Homographic_avglen', 'text1_Homographic_avgambiguity', 'text1_Homographic_avgdistinctiveness', 'text1_Homographic_avgsurprise', 'text1_Homographic_avgunusualness', 'text1_Homographic_avgincorppun', 'text1_Homographic_avgincorponepun', 'text1_Homographic_avgoverlap', 'text1_Homographic_avgsuccess', 'text1_Homographic_avgstrictsuccess', 'text1_Homographic_avgcoherence', 'text1_Homographic_avgfunniness', 'text1_Heterographic_avglen', 'text1_Heterographic_avgambiguity', 'text1_Heterographic_avgdistinctiveness', 'text1_Heterographic_avgsurprise', 'text1_Heterographic_avgunusualness', 'text1_Heterographic_avgincorppun', 'text1_Heterographic_avgincorponepun', 'text1_Heterographic_avgoverlap', 'text1_Heterographic_avgsuccess', 'text1_Heterographic_avgstrictsuccess', 'text1_Heterographic_avgcoherence', 'text1_Heterographic_avgfunniness', 'text2_Homographic_avglen', 'text2_Homographic_avgambiguity', 'text2_Homographic_avgdistinctiveness', 'text2_Homographic_avgsurprise', 'text2_Homographic_avgunusualness', 'text2_Homographic_avgincorppun', 'text2_Homographic_avgincorponepun', 'text2_Homographic_avgincorpcontexts', 'text2_Homographic_avgoverlap', 'text2_Homographic_avgsuccess', 'text2_Homographic_avgstrictsuccess', 'text2_Homographic_avgcoherence', 'text2_Homographic_avgfunniness', 'text2_Heterographic_avglen', 'text2_Heterographic_avgambiguity', 'text2_Heterographic_avgdistinctiveness', 'text2_Heterographic_avgsurprise', 'text2_Heterographic_avgunusualness', 'text2_Heterographic_avgincorppun', 'text2_Heterographic_avgincorponepun', 'text2_Heterographic_avgincorpcontexts', 'text2_Heterographic_avgoverlap', 'text2_Heterographic_avgsuccess', 'text2_Heterographic_avgstrictsuccess', 'text2_Heterographic_avgcoherence', 'text2_Heterographic_avgfunniness'],
  Recognition: ['Homographic_biasedtopun_TPR', 'Homographic_biasedtopun_TNR', 'Homographic_biasedtononpun_TPR', 'Homographic_biasedtononpun_TNR', 'Homographic_Kappa', 'Heterographic_biasedtopun_TPR', 'Heterographic_biasedtopun_TNR', 'Heterographic_biasedtononpun_TPR', 'Heterographic_biasedtononpun_TNR', 'Heterographic_Kappa'],
};
for (const [group, keys] of Object.entries(staticGroups)) for (const key of keys) parts[group + '_' + key] = { name: (group + ' ' + key).replaceAll('_', ' '), unit: 'score', better: 'higher' };
const categories = { hom: 'Homographic', het: 'Heterographic', hom_pun: 'Homographic pun', het_pun: 'Heterographic pun', non_pun: 'Non-pun' };
type Tree = { [key: string]: number | null | Tree };
const board: Leaderboard = {
  benchmark: 'puneval', url: 'https://github.com/Zhijun-Xu/PunEval/tree/main/results', feed, parts,
  terms: 'The authors publish the metrics on GitHub (https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).',
  headline: 'The tasks use different metrics, so the headline is the homographic pun recognition true positive rate with the pun-biased prompt.',
  aliases: { 'gemini-pro': 'gemini-1-0-pro', 'claude-3-opus-20240229': 'claude-3-opus' },
  async fetch() {
    const scores = await fetchJson<Record<string,Tree>>(feed);
    const supplement = new Map<string,Record<string,number>>();
    function collect(node: Tree, labels: string[], metrics: Record<string,number>) {
      for (const [name,value] of Object.entries(node)) {
        if (value === null) continue;
        const label = categories[name as keyof typeof categories] ?? name.replaceAll('_',' ');
        const path = [...labels, label];
        if (typeof value === 'object') collect(value, path, metrics);
        else {
          if (!Number.isFinite(value)) throw new Error('Missing metric in ' + path.join(' '));
          const key = path.join('_').replace(/[^a-z0-9_]/gi,'');
          metrics[key] = value;
          parts[key] = { name: path.slice(1).join(': '), group: labels[0], unit: 'score' };
        }
      }
    }
    for (const [file,group,pattern] of [
      ['pun_explanation_punchline_check_metrics','Explanation: punchline check',/^human_eval (.+)_explanation$/],
      ['pun_explanation_pairwise_comparison_metrics','Explanation: comparison with humans',/^gpt-4-0613_eval human_vs_(.+)$/],
      ['pun_generation_metrics','Generation',/^(.+)_text(\d+)$/],
    ] as const) {
      const extra = await fetchJson<Record<string,Tree>>(base + file + '.json');
      for (const [label,node] of Object.entries(extra)) {
        if (label === 'human_text' || label === 'human_eval human_explanation') continue;
        const match = label.match(pattern);
        if (!match) throw new Error('Unknown evaluation: ' + label);
        const metrics = supplement.get(match[1]) ?? {};
        supplement.set(match[1], metrics);
        collect(node, match[2] ? [group,'text' + match[2]] : [group], metrics);
      }
    }
    const rows = Object.entries(scores).map(([label,node]) => {
      const m = label.match(/^(.+)_judge def_(true|false) CoT_(true|false) examples_(true|false)$/);
      if (!m) throw new Error('Unknown recognition prompt: ' + label);
      const [model,def,cot,ex] = m.slice(1);
      const setting = [ex === 'true' ? 'Six examples' : 'Zero-shot',def === 'true' ? 'with definition' : 'without definition',
        cot === 'true' ? 'chain of thought' : 'direct answer'].join(', ');
      const metrics: Record<string,number> = {};
      if (def === 'false' && cot === 'false' && ex === 'false') Object.assign(metrics,supplement.get(model));
      collect(node, ['Recognition'], metrics);
      const score = metrics.Recognition_Homographic_biasedtopun_TPR;
      return { model, setting, metrics, score };
    });
    return checked(rows,60);
  },
};
export default board;
