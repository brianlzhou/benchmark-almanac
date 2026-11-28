// BLiMP publishes per-paradigm accuracy for four model families.
// Use the explicit overall score. Exclude 13 aggregate rows from the 67-paradigm category means.
// Linguistic-category means remain metrics; family labels are not guessed checkpoint IDs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/alexwarstadt/blimp/master/raw_results/summary/models_summary.jsonl";
const board: Leaderboard = {
 benchmark: "blimp", parts: {
  anaphor_agreement: { name: 'Anaphor agreement', group: 'Category' },
  argument_structure: { name: 'Argument structure', group: 'Category' },
  binding: { name: 'Binding', group: 'Category' },
  control_raising: { name: 'Control raising', group: 'Category' },
  determiner_noun_agreement: { name: 'Determiner noun agreement', group: 'Category' },
  ellipsis: { name: 'Ellipsis', group: 'Category' },
  filler_gap_dependency: { name: 'Filler gap dependency', group: 'Category' },
  irregular_forms: { name: 'Irregular forms', group: 'Category' },
  island_effects: { name: 'Island effects', group: 'Category' },
  quantifiers: { name: 'Quantifiers', group: 'Category' },
  subject_verb_agreement: { name: 'Subject verb agreement', group: 'Category' },
  npi_licensing: { name: 'Negative polarity item licensing', group: 'Category' },
}, url: "https://raw.githubusercontent.com/alexwarstadt/blimp/master/raw_results/summary/models_summary.jsonl", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const all=(await fetchText(FEED)).trim().split(/\r?\n/).map(line=>JSON.parse(line));const data=all.filter(r=>r.UID!=='overall');const overall=all.find(r=>r.UID==='overall'&&r.linguistics_term==='overall');if(!overall||data.length!==67)throw new Error('BLiMP aggregate or 67 paradigms missing');return ['ngram','lstm','txl','gpt2'].map(key=>{const groups=new Map<string,number[]>();for(const r of data){if(typeof r[key]!=='number')throw new Error('Missing model accuracy');const a=groups.get(r.linguistics_term)??[];a.push(r[key]);groups.set(r.linguistics_term,a);}return {model:`BLiMP ${key} family`,score:overall[key]*100,setting:'Equal-weight paradigm mean',metrics:Object.fromEntries([...groups].map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length*100]))};});
 },
};
export default board;
