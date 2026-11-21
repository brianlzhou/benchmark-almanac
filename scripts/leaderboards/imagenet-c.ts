// ImageNet-C tests robustness to common image corruptions. The makers rank ResNet-50 methods by mean corruption error.
// The ImageNet-C leaderboard in their README also gives the error rate on clean images.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://raw.githubusercontent.com/hendrycks/robustness/HEAD/README.md';
const board:Leaderboard={
  benchmark:'imagenet-c',feed,url:'https://github.com/hendrycks/robustness#imagenet-c-leaderboard',
  terms:'Apache 2.0: https://github.com/hendrycks/robustness/blob/master/LICENSE',
  parts:{cleanError:{name:'Clean Error',unit:'%',better:'lower'}},
  async fetch(){
    const section=(await fetchText(feed)).split('## ImageNet-C Leaderboard')[1]?.split('\n##')[0];
    const lines=section?.split('\n').filter(line=>line.startsWith('|'));
    if(!lines || !/Method\s*\|\s*Reference\s*\|\s*Standalone\?\s*\|\s*mCE\s*\|\s*Clean Error/.test(lines[0])) throw Error('Missing ImageNet-C leaderboard');
    const rows=lines.slice(2).map(line=>{
      const [method,,,mce,clean]=line.slice(1).split('|').map(s=>s.trim());
      if(![mce,clean].every(s=>/^\d+(?:\.\d+)?%$/.test(s))) throw Error('Invalid ImageNet-C errors for '+method);
      const name=method.match(/^\[([^\]]+)\]/)?.[1]??method;
      return {model:'ResNet-50',setting:name,score:parseFloat(mce),metrics:{cleanError:parseFloat(clean)}};
    });
    return checked(rows,10);
  },
};
export default board;
