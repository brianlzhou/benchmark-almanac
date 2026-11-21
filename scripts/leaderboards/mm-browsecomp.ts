// MM-BrowseComp: the main table's Overall OA is outcome accuracy over all 400 questions, in percent.
//  Keep outcome and strict accuracy by category, plus checklist scores by modality. Tool use and reasoning effort are whole-benchmark settings.
//  Named agent frameworks become harnesses. These are static paper results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2508.13186";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const categories = ['media', 'technology', 'society', 'geography', 'academics'];
const board: Leaderboard = {
  benchmark: "mm-browsecomp", static: 'paper',
  stats: {
    strictAccuracy: { name: 'Strict accuracy', unit: '%', better: 'higher' },
    checklistScore: { name: 'Checklist score', unit: '%', better: 'higher' },
    textChecklist: { name: 'Text checklist score', unit: '%', better: 'higher' },
    visualChecklist: { name: 'Visual checklist score', unit: '%', better: 'higher' },
    ...Object.fromEntries(categories.map(category => [`${category}Strict`, { name: `${category[0].toUpperCase() + category.slice(1)} strict accuracy`, unit: '%', better: 'higher' }]))
  },
  parts: Object.fromEntries(categories.map(key => [key, {name: key[0].toUpperCase() + key.slice(1), group: 'Category'}])),
  url: "https://github.com/MMBrowseComp/MM-BrowseComp",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const all = await paperTables(FEED);
    const t = all[1];
    if (!t?.[0]?.some(c => c.text === 'Overall')) throw new Error('MM-BrowseComp main table changed');
    let mode = '', harness: string | undefined;
    const out: LeaderboardRow[] = [];
    const details = new Map<string, Record<string, number>>();
    const checklist = all.find(table => table[1]?.[0]?.text === 'Text' && table[1]?.[1]?.text === 'Image & Video');
    for (const r of [...(checklist ?? []), ...t]) {
      const label = r[0]?.text ?? '';
      if (/^Tool-Free/.test(label)) {mode = 'tools off'; harness = undefined;}
      if (/^Tool-Augmented/.test(label)) {mode = 'tools on'; harness = undefined;}
      if (/^(Agent-R1|OWL|DeerFlow|WebDancer)$/.test(label)) {harness = label; mode = 'tools on';}
      const key = JSON.stringify([mode, harness, label]);
      if (r.length === 3 && num(r[1]?.text) !== undefined && num(r[2]?.text) !== undefined) {
        details.set(key, { textChecklist: num(r[1].text)!, visualChecklist: num(r[2].text)! });
      }
      if (r.length !== 14 || num(r[1]?.text) === undefined) continue;
      const high = /-high$/i.test(label);
      const model = paperModel(label.replace(/-high$/i, ''));
      const metrics: Record<string, number> = { ...details.get(key), strictAccuracy: num(r[2].text)!, checklistScore: num(r[3].text)! };
      for (const [i, category] of categories.entries()) {
        const oa = num(r[i + 4]?.text), sa = num(r[i + 9]?.text);
        if (oa !== undefined) metrics[category] = oa;
        if (sa !== undefined) metrics[category + 'Strict'] = sa;
      }
      out.push({model, score: num(r[1].text)!, setting: [mode, high ? 'high effort' : ''].filter(Boolean).join('; '), ...(harness ? {harness} : {}), metrics});
    }
    if (out.length !== 36) throw new Error(`MM-BrowseComp expected 36 rows, found ${out.length}`);
    return out;
  },
};
export default board;
