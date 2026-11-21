// First Proof's second batch tests ten original mathematical problems. The headline counts problems with a passing grade.
// The report defines a pass as "rated as essentially flawless or requiring only minor revisions".
// Section 5 provides each editorial decision, and Table 4 gives total tokens and cost.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://1stproof.org/assets/docs/report.pdf';
const systems = [
  {id:'A',model:'gpt-5.5 pro',harness:'ProofCouncil',models:['gpt-5.5 pro','gpt-5.5','gemini-3.1-pro-preview','claude-opus-4-7']},
  {id:'B',model:'gpt-5.5 pro',harness:'UCLA Moonshot Harness'},
  {id:'C',model:'gpt-5.5 pro',harness:undefined},
  {id:'D',model:'gemini-3.1-pro-preview',harness:'Princeton Momus'},
];
const board: Leaderboard = {
  benchmark:'first-proof-batch-2', url:'https://1stproof.org/second-batch.html', feed, static:'paper', harnesses:'system',
  terms:'The First Proof Foundation publishes the editorial decisions in its benchmark report. https://1stproof.org/second-batch.html',
  headline:'The score counts how many of the ten problems received an essentially flawless or minor revisions decision.',
  costPer:'run',
  stats: {
    Reject: { name: 'Reject decisions', unit: 'count' },
    'Minor Revisions': { name: 'Minor revisions decisions', unit: 'count' },
    'Essentially Flawless': { name: 'Essentially flawless decisions', unit: 'count' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    outputTokens: { name: 'Output tokens', unit: 'tokens' },
  },
  parts:Object.fromEntries(Array.from({length:10},(_,i)=>['p'+(i+1),'Problem '+(i+1)])),
  async fetch() {
    const paper = await pdfText(feed);
    const decisions = [...paper.matchAll(/Submission ([A-D])\. Editorial Decision: (Minor Revisions|Major Revisions|Essentially Flawless|Reject)\.\s+submission-(\d+)([A-D])-reviews\.pdf/g)];
    const costs = paper.match(/\n Total\s+([\d. ]+)\s*\n Wall clock/)?.[1].trim().split(/\s+/).map(Number);
    if (decisions.length !== 39 || costs?.length !== 12 || !paper.includes('System A did not produce a solution on Problem 6'))
      throw new Error('First Proof decisions or cost table changed');
    return checked(systems.map(({id,...system},i) => {
      const metrics: Record<string,number> = {};
      const counts: Record<string,number> = {};
      let score = 0;
      for (const [,letter,grade,num,fileLetter] of decisions) {
        if (letter !== id) continue;
        if (letter !== fileLetter || 'p'+num in metrics) throw new Error('Invalid editorial decision');
        const pass = Number(grade === 'Essentially Flawless' || grade === 'Minor Revisions');
        metrics['p'+num] = pass;
        counts[grade] = (counts[grade] ?? 0)+1;
        score += pass;
      }
      if (id === 'A') metrics.p6 = 0;
      if (Object.keys(metrics).length !== 10) throw new Error('Incomplete decision set for System ' + id);
      return {...system, score, cost:costs[3*i+2],
        metrics:{...metrics,...counts, inputTokens:costs[3*i]*1e6,outputTokens:costs[3*i+1]*1e6}};
    }),4);
  },
};
export default board;
