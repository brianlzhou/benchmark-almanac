// The source reports no overall score for the comparison models. The headline is the plain mean of the 2 language parts.
// ArtEdit-Bench-Lr tests Lightroom editing. Table 1 gives GPT-4o's overall rating on each language set.
// Table 3 reports the bilingual JarvisEvo scores directly, including its final training stage.
import type { Leaderboard,LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,flatPaperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2511.23002';
const languages=['English','Chinese'];
const columns=['L1','L2','SC','PQ','O'];
const board:Leaderboard={
  benchmark:'artedit-bench-lr',url:feed,feed,static:'paper',terms:PAPER_TERMS,
  headline:'The headline averages English and Chinese overall ratings, using the published bilingual rating when available.',
  parts:Object.fromEntries(languages.flatMap(l=>columns.map(k=>[l+k,{name:l+': '+k,unit:'score' as const,
    better:k==='L1'||k==='L2'?'lower' as const:'higher' as const,
    note:k==='L1'?'Reported L1 multiplied by 100.':k==='L2'?'Reported L2 multiplied by 1,000.':undefined}]))),
  stats:Object.fromEntries(columns.map(k=>[k,{name:k==='L1'?'L1 loss':k==='L2'?'L2 loss':k==='SC'?'Semantic consistency':k==='PQ'?'Perceptual quality':'Overall rating',unit:'score',better:k==='L1'||k==='L2'?'lower':'higher'}])),
  aliases:{'Nano-Banana':'gemini-2-5-flash-image-preview-nano-banana','FLUX-1-Kontext':'flux-1-kontext-dev'},
  async fetch(){
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0][0]==='Method' && t[0][1]==='Open-Source' && t[0][6]?.startsWith('O\\uparrow'));
    const a=ts.find(t=>t[0][0]==='Configurations' && t[0][5]?.startsWith('O\\uparrow'));
    if (!t || !a) throw new Error('Missing ArtEdit-Bench-Lr comparison or ablation table');
    const models=new Map<string,LeaderboardRow>();
    let language='';
    for (const [label,open,...cells] of t.slice(1)){
      if (label.endsWith(' Set')) {language=label.split(' ')[0];continue;}
      if (cells.every(v=>v==='-')) continue;
      if (!languages.includes(language) || cells.length!==5 || !cells.every(v=>/^\d+\.\d+$/.test(v))) throw new Error('Invalid editing score');
      const model=label.replace(/\s*(?:∗\s*)?\(.*$/,'');
      const row=models.get(model) ?? {model,open:open==='✓',score:0,metrics:{}};
      columns.forEach((k,i)=>{row.metrics![language+k]=Number(cells[i]);});
      models.set(model,row);
    }
    const rows=[...models.values()].filter(r=>languages.every(l=>l+'O' in r.metrics!));
    rows.forEach(r=>{r.score=(r.metrics!.EnglishO+r.metrics!.ChineseO)/2;});
    const seen=new Set<string>();
    for (const [label,...values] of a.slice(1)){
      if (values[0]===label || ['Intrinsic reward','Pairwise preference reward'].includes(label) || seen.has(label)) continue;
      if (values.length!==5 || !values.every(v=>/^\d+\.\d+$/.test(v))) throw new Error('Invalid ablation scores');
      seen.add(label);
      const metrics=Object.fromEntries(columns.map((k,i)=>[k,Number(values[i])]));
      if (label==='+ Full SEPO + RFT'){
        const final=rows.find(r=>r.model==='JarvisEvo');
        if(!final) throw new Error('Missing final JarvisEvo');
        final.score=metrics.O;
        Object.assign(final.metrics!,metrics);
      } else rows.push({model:'JarvisEvo',setting:label,score:metrics.O,metrics,open:true});
    }
    return checked(rows,18);
  },
};
export default board;
