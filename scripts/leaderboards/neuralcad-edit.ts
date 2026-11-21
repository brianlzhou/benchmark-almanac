// Autodesk compares CAD edits. The results table reports expert acceptance plus human and automatic measures.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://autodeskailab.github.io/neuralCAD-Edit/";
const board: Leaderboard = {
  benchmark: "neuralcad-edit",
  url: "https://autodeskailab.github.io/neuralCAD-Edit/",
  feed,
  terms: "Autodesk reserves rights on the leaderboard. The dataset uses CC BY-NC 4.0. The host returns 404 for robots.txt.",
  parts: { chamfer: { name: 'Chamfer-dist', better: 'lower' }, iou: 'Voxel-IoU', dino: 'DINO-sim', validity: 'Validity', instruction: 'Instruction', quality: 'Quality' },
  async fetch() {
    const source = (await fetchText(feed)).replace(/<!--[\s\S]*?-->/g, '');
    const table = tables(source).find(t => t[0]?.some(c => c.text === 'Human eval'));
    const columns = ['Chamfer-dist ↓','Voxel-IoU ↑','DINO-sim ↑','Validity ↑','Instruction ↑','Quality ↑','Acceptance ↑'];
    if (!table || columns.some((name,i) => table[1]?.[i]?.text !== name)) throw new Error('Missing CAD measures');
    const rows = table.slice(2).filter(r => !['Human baseline','GT Human requestor'].includes(r[0].text)).map(r => {
      if (r.length !== 8 || r.slice(1).some(c => !c.text || !Number.isFinite(Number(c.text)))) throw new Error('Incomplete CAD result');
      const [chamfer, iou, dino, validity, instruction, quality, score] = r.slice(1).map(c => Number(c.text));
      return { model: r[0].text, score, metrics: { chamfer, iou, dino, validity, instruction, quality } };
    });
    if (rows.length < 3) throw new Error('Missing CAD models');
    return rows;
  },
};
export default board;
