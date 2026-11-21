// Maker-published overall average. Read the JavaScript assignment as data only.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://opencausalab.github.io/CaLM/calm_website/tables/model_overview.js';
const board:Leaderboard={benchmark:'calm', parts: {
  EN: { name: 'English', group: 'Language' },
  CN: { name: 'Chinese', group: 'Language' },
},url:'https://opencausalab.github.io/CaLM/calm_website/pages/leaderboard.html',feed:FEED,
 stats: {
  Basic: { name: 'Basic prompt accuracy', unit: '%', better: 'higher' },
  Doubt: { name: 'Adversarial doubt accuracy', unit: '%', better: 'higher' },
  Ignore: { name: 'Adversarial ignore accuracy', unit: '%', better: 'higher' },
  '0-shot IcL': { name: 'Zero-shot in-context learning accuracy', unit: '%', better: 'higher' },
  '1-shot IcL': { name: 'One-shot in-context learning accuracy', unit: '%', better: 'higher' },
  '3-shot IcL': { name: 'Three-shot in-context learning accuracy', unit: '%', better: 'higher' },
  '0-shot CoT': { name: 'Zero-shot chain-of-thought accuracy', unit: '%', better: 'higher' },
  'Manual CoT': { name: 'Manual chain-of-thought accuracy', unit: '%', better: 'higher' },
  EF: { name: 'Explicit-function accuracy', unit: '%', better: 'higher' },
  Robustness: { name: 'Robustness', unit: '%', better: 'higher', note: 'Stability when faced with adversarial inputs or disturbances.' },
 },
 terms:'Public maker results on GitHub Pages; robots.txt has no restriction on this path.',
 async fetch(){const s=await fetchText(FEED);const i=s.indexOf('[',s.indexOf('model_data'));if(i<0)throw new Error('Data missing');
 const data=jsLiteral<Record<string,unknown>[]>(s,i);return checked(data.map(r=>({model:String(r.Model),score:Number(r.Average),metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>typeof v==='number'&&!['Rank','Average'].includes(k))) as Record<string,number>})),3);
 }};export default board;
