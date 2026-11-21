// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// The benchmark evaluates geometry and simulation file generation for two mechanical assemblies.
// Tables 1 to 4 in the authors' README give a percentage score for each deliverable, separate from solver accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/Ossama-Shafiq/LLM-CAE-Benchmark';
const feed = 'https://raw.githubusercontent.com/Ossama-Shafiq/LLM-CAE-Benchmark/main/README.md';
const parts = { barGeometry:'Square Bar Geometry', wheelGeometry:'Wheel & Axle Assembly', barSim:'Square Bar Simulation', wheelSim:'Wheel & Axle Simulation' };
const board: Leaderboard = {
  benchmark:'llm-cae-benchmark',url:repo+'#-results-summary',feed,parts,
  terms:'MIT. '+repo+'/blob/main/LICENSE',
  async fetch(){
    const readme = await fetchText(feed);
    const models = new Map<string,Record<string,number>>();
    for (const [i,[key,title]] of Object.entries(parts).entries()) {
      const section = readme.split('#### Table '+(i+1)+': '+title+' Evaluation')[1]?.trimStart().split(/\n\s*\n/)[0];
      if (!section) throw new Error('Missing CAE table for '+title);
      const [header,,...rows] = section.split('\n').map(l=>l.split('|').slice(1,-1).map(c=>c.trim()));
      const idx = header.indexOf('Score');
      if (idx<0 || header[0]!=='Model') throw new Error('Missing CAE score columns');
      for(const r of rows) {
        if(!/^\d+(\.\d+)?%$/.test(r[idx])) throw new Error('Invalid CAE score');
        const metrics = models.get(r[0]) ?? {};
        metrics[key] = Number(r[idx].slice(0,-1));
        models.set(r[0],metrics);
      }
    }
    return checked([...models].filter(([,m])=>Object.keys(m).length===4).map(([model,metrics])=>({
      model,metrics,score:Object.values(metrics).reduce((a,b)=>a+b,0)/4
    })),9);
  },
};
export default board;
