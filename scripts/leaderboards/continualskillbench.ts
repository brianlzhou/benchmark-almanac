// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// Table 1 gives raw rewards across all 100 tasks per domain. Normalized rewards cover only mutually valid outputs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2608.03874';
const domains = ['Law','Finance','Healthcare','Office','Math'];
const board: Leaderboard = {
  benchmark:'continualskillbench', static:'paper', url:feed, feed,
  terms:'The authors publish the benchmark under Apache 2.0. https://github.com/gtynnn060110-hash/continual-skill-bench-final/blob/main/LICENSE',
  headline:'The paper reports no overall score, so this is the plain mean of raw rewards across five equally sized domains, expressed as a percentage.',
  parts:Object.fromEntries(domains.map(d => [d,d])),
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [figure] of html.matchAll(/<figure id="S3\.T1\.st\d+"[^>]*>[\s\S]*?<\/figure>/g)) {
      const caption = figure.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1];
      const table = paperTables(figure)[0];
      if (!caption || !table) throw new Error('Missing Table 1 panel');
      const model = text(caption).replace(/^\([a-z]\)\s*/,'');
      const [,header,...data] = grid(table);
      if (header.join() !== 'Domain,Setting,EM,F1,Num.,Prog.,Rubric,Raw,Norm.' || data.length !== 10) throw new Error('Changed domain reward table');
      for (const [offset, setting] of ['Independent','Sequential'].entries()) {
        const metrics: Record<string,number> = {};
        for (let i=0; i<data.length; i+=2) {
          const domain = data[i][0] || data[i+1][0];
          const row = data[i+offset];
          if (!domains.includes(domain) || row[1] !== ['Ind.','Seq.'][offset]) throw new Error('Changed domain or setting');
          for (let j=2; j<header.length; j++) {
            if (/^[-–]$/.test(row[j])) continue;
            const n = /^(\d+\.\d+)(?:\s|$)/.exec(row[j]);
            if (!n) throw new Error('Invalid reward for ' + domain);
            metrics[j===7 ? domain : domain+' '+header[j]] = 100*Number(n[1]);
          }
        }
        if (!domains.every(d => d in metrics)) throw new Error('Incomplete domain coverage');
        rows.push({model, setting, score:domains.reduce((s,d) => s+metrics[d],0)/domains.length, metrics});
      }
    }
    return checked(rows,6);
  },
};
export default board;
