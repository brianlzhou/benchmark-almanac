// COCO-Stuff 164K measures pixel-level segmentation of things and stuff.
// MMSegmentation lists validation mean intersection over union for each model and training schedule.
// Only the full 164K release is read. The 10K release and the challenge have different splits or labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const base = 'https://raw.githubusercontent.com/open-mmlab/mmsegmentation/main/configs/';
const families = ['deeplabv3','pspnet','bisenetv1','san'];
const feed = base + 'deeplabv3/README.md';
const board: Leaderboard = {
  benchmark:'coco-stuff-164k', host:'MMSegmentation', url:'https://github.com/open-mmlab/mmsegmentation/tree/main/configs', feed,
  terms:'MMSegmentation uses Apache 2.0. https://github.com/open-mmlab/mmsegmentation/blob/main/LICENSE',
  stats:{
    memoryGB:{name:'Memory usage',unit:'gb',note:'Model memory usage in gigabytes.'},
    framesPerSecond:{name:'Inference speed',unit:'score',better:'higher',note:'Frames processed per second.'},
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [i,family] of families.entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve,1000));
      const md = await fetchText(base + family + '/README.md');
      const section = md.split(/^### COCO-Stuff\s*164k\s*$/im)[1]?.split(/\n#/)[0];
      if (!section) throw new Error('Missing COCO-Stuff 164K section in ' + family);
      const t = section.split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(c=>c.trim()));
      const required = ['Backbone','Method','Crop Size','Lr schd','mIoU','mIoU(ms+flip)','Mem (GB)','Inf time (fps)'];
      if (!required.every(h=>t[0]?.includes(h))) throw new Error('Missing MMSegmentation columns');
      for (const c of t.slice(2)) {
        const v = Object.fromEntries(t[0].map((h,j)=>[h,c[j]]));
        const model = v.Method + ' ' + v.Backbone;
        const setting = v['Lr schd'] + ' iterations, ' + v['Crop Size'] + ' crop' + (v.Pretrained ? ', ' + v.Pretrained + ' pretraining' : '');
        const metrics: Record<string,number> = {};
        for (const [key,header] of [['memoryGB','Mem (GB)'],['framesPerSecond','Inf time (fps)']]) {
          if (v[header] !== '-') metrics[key] = Number(v[header]);
        }
        for (const [label,header] of [['Single scale','mIoU'],['Multiscale and flip','mIoU(ms+flip)']]) {
          if (v[header] === '-') continue;
          if (!/^\d+(\.\d+)?$/.test(v[header])) throw new Error('Invalid mIoU');
          rows.push({ model, setting: setting + ', ' + label, score: Number(v[header]), metrics: label === 'Single scale' ? metrics : undefined });
        }
      }
    }
    return checked(rows,40);
  },
};
export default board;
