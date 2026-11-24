// The source reports no overall score. The headline is the plain mean of the 26 parts, computed by this importer.
// Figure 3 prints context-aware spBLEU for 13 dialects translated in both directions.
// Figure C.3 prints chrF++ for the same configurations with a different dialect order.
import type { Leaderboard, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2026.acl-long.1503.pdf';
function panel(pdf:string,caption:string) {
  const end = pdf.indexOf(caption);
  const start = pdf.lastIndexOf('gemini-2.5-pro_1024',end);
  if (end<0 || start<0) throw new Error('Missing '+caption);
  const lines = pdf.slice(start,end).split('\n');
  const codes = lines.find(line=>/^\s*SA\s+[A-Z]{2}\s/.test(line))?.trim().split(/\s+/);
  if (codes?.length!==26 || new Set(codes.slice(0,13)).size!==13 || new Set(codes.slice(13)).size!==13) throw new Error('Missing dialect labels');
  const values = new Map<string,Record<string,number>>();
  for (const line of lines) {
    const match = line.match(/^\s*(?:Model\s+)?([\w.-]+)\s+(\d+\.\d+\s+.*)$/);
    if (!match) continue;
    // Color-bar tick labels are integers. Every annotated heatmap cell has one decimal.
    const cells = match[2].trim().split(/\s+/).filter(c=>!/^\d+$/.test(c));
    if (cells.length!==26 || cells.some(c=>!/^\d+\.\d$/.test(c)) || values.has(match[1])) throw new Error('Heatmap row changed');
    values.set(match[1],Object.fromEntries(codes.map((code,i)=>[i<13?'English to '+code:code+' to English',Number(cells[i])])));
  }
  return values;
}
const board: Leaderboard = {
  benchmark:'alexandria-arabic-translation',static:'paper',url:'https://aclanthology.org/2026.acl-long.1503/',feed,
  terms:'ACL Anthology publishes the paper and license at https://aclanthology.org/2026.acl-long.1503/.',
  headline:'The headline is the plain mean of context-aware spBLEU across 13 dialects in both translation directions.',
  aliases:{'c4ai-command-a-03-2025':'cohere-command-a','command-a-reasoning-08-2025':'command-a-reasoning',
    'command-a-translate-08-2025':'command-a-translate','gemini-3-flash-preview':'gemini-3-flash','gemini-3-pro-preview':'gemini-3-pro'},
  async fetch() {
    const pdf = await pdfText(feed);
    const bleu = panel(pdf,'Figure 3: Context-aware MT performance');
    const chrf = panel(pdf,'Figure C.3: chrF++ scores');
    const parts: Record<string,BoardPart> = {};
    const rows = [...bleu].map(([label,scores])=>{
      const metrics = {...scores};
      const other = chrf.get(label);
      if (!other) throw new Error('Missing chrF++ configuration');
      for (const key of Object.keys(scores)) {
        if (!(key in other)) throw new Error('Missing chrF++ dialect');
        parts[key] = {name:key,group:'spBLEU',unit:'score'};
        parts['chrF++ '+key] = {name:key,group:'chrF++',unit:'score'};
        metrics['chrF++ '+key] = other[key];
      }
      const [model,thinking] = label.split('_');
      return {model,setting:'Context-aware'+(thinking?', thinking '+thinking:''),metrics,
        score:Object.values(scores).reduce((a,b)=>a+b,0)/26};
    });
    board.parts = parts;
    return checked(rows,24);
  },
};
export default board;
