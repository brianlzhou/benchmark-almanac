// WorkRB ranks systems by macro nDCG at 100 across five skill datasets. The organizers link to the paper for results beyond the podium.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2611.03525v1";
const board: Leaderboard = {
  benchmark: "workrb-skill-extraction-challenge-2026", static: 'paper',
  url: "https://workrb.techwolf.ai/challenges/recsys-hr-2026.html#results",
  feed,
  terms: "Participants consented to public scores. The organizers specify CC BY 4.0 for graded annotations. The workshop host permits crawling and arXiv permits HTML with a 15-second crawl delay.",
  stats: { backbones: { name: 'Backbones', unit: 'count' } },
  parts: { House:'House', Tech:'Tech', TechWolf:'TechWolf', SkillSkape:'SkillSkape', SkillNorm:'SkillNorm' },
  async fetch() {
    const data = tables(await fetchText(feed));
    const parts = ['House','Tech','TechWolf','SkillSkape','SkillNorm'];
    const main = data.find(t => t[0].map(c => c.text).join('|') === ['#','Team','Macro',...parts].join('|'));
    const details = data.find(t => t[0][0].text === 'System' && t[0][1]?.text === 'nDCG@100');
    if (!main || main.length < 15 || !details || details.length < 15) throw new Error('Missing WorkRB result tables');
    type Row = {model:string; score:number; params?:number; metrics:Record<string,number>};
    const runs = new Map<string,Row>();
    const number = (s:string) => {
      if (!s || !Number.isFinite(Number(s))) throw new Error('Invalid WorkRB score');
      return Number(s);
    };
    for (const r of main.slice(1)) {
      const model = r[1].text.replace(/ s$/, '');
      runs.set(model,{model,score:number(r[2].text),metrics:Object.fromEntries(parts.map((p,i) => [p,number(r[i+3].text)]))});
    }
    for (const r of details.slice(1)) {
      const model = r[0].text.split(/ [∗†]/)[0];
      const score = number(r[1].text);
      const run = runs.get(model) ?? {model,score,metrics:{} as Record<string,number>};
      if (run.score !== score) throw new Error('Conflicting WorkRB score for '+model);
      run.metrics.backbones = number(r[2].text);
      if (r[3].text !== '–') run.params = number(r[3].text);
      runs.set(model,run);
    }
    return [...runs.values()].map(r => ({ ...r, submitter: ['CurriculumMatch','ConTeXT-match','TF-IDF','BM25'].includes(r.model) ? undefined : r.model }));
  },
};
export default board;
