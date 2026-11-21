// JaNLI tests Japanese natural language inference with linguistically controlled phenomena.
// Table 7 reports overall JaNLI accuracy for Japanese BERT and multilingual BERT under four fine-tuning settings.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.blackboxnlp-1.26.pdf';
const board:Leaderboard={benchmark:'janli',static:'paper',url:'https://aclanthology.org/2021.blackboxnlp-1.26/',feed,terms:'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',async fetch(){const t=await pdfText(feed);if(!/JSICK \(5K\)\s+92\.1±0\.01\s+51\.3±0\.01/.test(t)||!/JSNLI \(533K\)\s+94\.6±0\.01\s+49\.7±0\.00/.test(t))throw new Error('Missing JaNLI Table 7');return checked([{model:'Japanese BERT',setting:'JSICK (5K)',score:51.3},{model:'Japanese BERT',setting:'JSICK +JaNLI (0.7K)',score:89.3},{model:'Japanese BERT',setting:'JSNLI (533K)',score:50.4},{model:'Japanese BERT',setting:'JSNLI +JaNLI (0.7K)',score:72.3},{model:'Multilingual BERT',setting:'JSICK (5K)',score:50.2},{model:'Multilingual BERT',setting:'JSICK +JaNLI (0.7K)',score:56.9},{model:'Multilingual BERT',setting:'JSNLI (533K)',score:49.7},{model:'Multilingual BERT',setting:'JSNLI +JaNLI (0.7K)',score:56.3}],8);}};export default board;
