// GUI-CEval tests Chinese mobile GUI understanding and interaction. Table 2
// reports a benchmark average and seven capability scores for full-coverage models.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://openaccess.thecvf.com/content/CVPR2026/papers/Li_GUI-CEval_A_Hierarchical_and_Comprehensive_Chinese_Benchmark_for_Mobile_GUI_CVPR_2026_paper.pdf';
const names=['Perception','Planning','Reflection','Evaluation','Grounding','Offline Agent','Online Agent'];
export default {
  benchmark:'gui-ceval-xiaomi',url:feed,feed,static:'paper',
  terms:'CVF Open Access, copyright retained by the authors or rights holders. https://openaccess.thecvf.com/',
  parts:Object.fromEntries(names.map(n=>[n.replaceAll(' ',''),n])),
  async fetch() {
    const paper=await pdfText(feed);
    const area=paper.split('Table 2. Performance comparison of general-purpose and GUI-specific models')[1];
    const table=area?.match(/Model\s+Perception\s+Planning\s+Reflection\s+Evaluation\s+Grounding\s+Offline Agent\s+Online Agent\s+Avg\s*\n([\s\S]+?)\n\s*\n/);
    if(!table) throw new Error('Missing GUI-CEval Table 2');
    const rows=table[1].trim().split('\n').map(line=>line.trim()).filter(line=>!line.endsWith(' models')).map(line=>{
      const cells=line.replace(/\s*\[\d+\]/,'').split(/\s+/);
      const values=cells.slice(1).map(Number);
      if(values.length!==8 || !values.every(Number.isFinite)) throw new Error('Invalid GUI-CEval result: '+line);
      return {model:cells[0],score:values[7],metrics:Object.fromEntries(names.map((n,i)=>[n.replaceAll(' ',''),values[i]]))};
    });
    return checked(rows,16);
  },
} satisfies Leaderboard;
