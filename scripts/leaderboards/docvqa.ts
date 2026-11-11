// DocVQA: live RRC Task 1 submissions plus the retained paper baselines, with ANLS multiplied by 100.
// The live table keeps every submission and its category scores. Paper baseline rows remain for continuity. The M4C and BERT tables publish model variants with distinct training configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { rrcPage } from '../lib/boards/rrc-cov5.ts';

const FEED = "https://arxiv.org/html/2007.00398";
const RRC = 'https://rrc.cvc.uab.es/?ch=17&com=evaluation&task=1';
const board: Leaderboard = {
  benchmark: "docvqa",
  url: RRC,
  feed: `${RRC} + ${FEED}`,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const ts=tables(await fetchText(FEED));
      const out: LeaderboardRow[]=[];
      const t=ts.find(t=>t[1]?.[0]?.text==='Method' && t[1]?.[1]?.text.includes('Objects'));
      if(!t) throw new Error('DocVQA model table missing');
      let previous='';
      for(const raw of t.slice(2)) { const r=raw.length===7?[{text:previous},...raw]:raw; if(r[0]?.text) previous=r[0].text; else r[0]={...r[0],text:previous}; if(r.length!==8 || num(r[6].text)===undefined) continue;
        out.push({model:r[0].text.replace(/\s*\[\d+\]/g,''),setting:`objects ${r[1].text}, fixed vocab ${r[2].text}, dynamic vocab ${r[3].text}`,score:num(r[6].text)!*100,metrics:{accuracy:num(r[7].text)!,valAnls:num(r[4].text)!*100}});
      }
      const b=ts.find(t=>t[1]?.[0]?.text==='Pretrained model');
      if(!b) throw new Error('DocVQA BERT table missing');
      for(const r of b.slice(2)) if(r.length===6 && num(r[4].text)!==undefined)out.push({model:r[0].text,setting:`DocVQA finetune ${r[1].text}`,score:num(r[4].text)!*100,metrics:{accuracy:num(r[5].text)!}});
      return out;
    })();
    const t = tables(await rrcPage(RRC)).find(t => t[0]?.some(c => c.text === 'Method') && t[0]?.some(c => c.text === 'Score'));
    if (!t) throw new Error('DocVQA live ranking table missing');
    const head = t[0].map(c => c.text);
    const nameCol = head.indexOf('Method'), scoreCol = head.indexOf('Score'), dateCol = head.indexOf('Date');
    for (const [index, r] of t.slice(1).entries()) {
      const model = r[nameCol]?.text, value = num(r[scoreCol]?.text);
      if (!model || /^Human Performance$/i.test(model) || value === undefined) continue;
      const metrics: Record<string, number> = {};
      for (let i = scoreCol + 1; i < head.length; i++) {
        const v = num(r[i]?.text);
        if (v !== undefined) metrics[head[i]] = v * 100;
      }
      rows.push({model: /^\d+$/.test(model) ? `RRC method ${model}` : model, score: value * 100, date: r[dateCol]?.text,
        setting: `RRC Task 1 submission ${index + 1}`, metrics});
    }
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
