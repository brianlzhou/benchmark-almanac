// FairFace evaluates face attribute prediction across demographic groups.
// Table 6 reports mean gender classification accuracy and its standard deviation across fourteen groups.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://openaccess.thecvf.com/content/WACV2021/papers/Karkkainen_FairFace_Face_Attribute_Dataset_for_Balanced_Race_Gender_and_Age_WACV_2021_paper.pdf';
const groups = ['White','Black','East Asian','SE Asian','Latino','Indian','Mid-Eastern'];
const labels = groups.flatMap(group => [group + ' F',group + ' M']);
const board: Leaderboard = {
  benchmark:'fairface', url:'https://github.com/joojs/fairface', feed, static:'paper',
  terms:'The authors provide the WACV paper through CVF Open Access. https://openaccess.thecvf.com/menu',
  headline:'The paper compares models by mean gender classification accuracy across its 14 demographic groups.',
  parts:Object.fromEntries(labels.map(label=>[label,label])),
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 6: Classification accuracy of commercial services on FairFace dataset.')[1]?.split('Table 7:')[0];
    if (!table || !groups.every(group=>table.includes(group)) || !/Mean\s+STD/.test(table)) throw new Error('Missing FairFace Table 6');
    const rows = table.split(/Mean\s+STD/)[1].trim().split('\n').map(line=>{
      const [name,...cells] = line.trim().split(/\s+/);
      if (cells.length !== 16 || !cells.every(c => /^\.\d{3}$/.test(c))) throw new Error('Invalid FairFace result: ' + line);
      const values = cells.map(c=>Number((100*Number(c)).toFixed(1)));
      return {model:name.replace(/^\*/,''), setting:name.startsWith('*')?'Detected faces':'All faces',
        score:values[14], metrics:{...Object.fromEntries(labels.map((label,i)=>[label,values[i]])),std:values[15]}};
    });
    return checked(rows,8);
  },
};
export default board;
