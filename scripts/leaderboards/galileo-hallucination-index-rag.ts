// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Galileo tests whether answers adhere to supplied context. Four models have scores in all three context ranges.
// The overall winners and three context snapshots were transcribed twice and compared. Image 3 identifies the snapshots.
// Each source image has a SHA-256 guard so updated charts require a new transcription.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const root='https://raw.githubusercontent.com/rungalileo/hallucination-index/HEAD/images/';
const hashes:Record<string,string>={
  '3':'f59296cf4f40b3c3756d85f9d9dd141aeabffee52642fa3e6f090185f96bd20a',
  '5':'ea0a535c8bdabc2403e1f1ad1c804fcc561ad099ba00996e6c00cec36602bdcf',
  '6':'db24ecb5c0cfc95abd97587a6bebb97049552a92b0a76da16de0d260596acb04',
  '7':'b6eae11e6620ce2c97c6dd8cbd2124847c0f262a3e0d200ecfe64d6bbd42e77a',
  '8':'50ea15e3c4cbe7e1365dd81cb4c5f75638d8ae296620d5811fcc11baaeac8d92',
};
const board:Leaderboard={
  benchmark:'galileo-hallucination-index-rag',url:'https://github.com/rungalileo/hallucination-index',feed:root+'5.png',
  terms:'Galileo publishes the result snapshots at https://github.com/rungalileo/hallucination-index. The authors retain their rights.',
  parts:{short:'Short Context RAG',medium:'Medium Context RAG',long:'Long Context RAG'},
  async fetch(){
    for (const [number,hash] of Object.entries(hashes)) {
      await chartRows(root+number+'.png',hash,[]);
      if(number!=='8') await new Promise(resolve=>setTimeout(resolve,1000));
    }
    const scores:[string,number,number,number][]=[
      ['claude-3-5-sonnet-20240620',0.97,1,1],['claude-3-opus-20240229',0.97,1,1],
      ['gpt-4o-2024-05-13',0.96,1,1],['gemini-1.5-flash-001',0.94,1,0.92],
    ];
    return checked(scores.map(([model,short,medium,long])=>({model,score:(short+medium+long)/3,metrics:{short,medium,long}})),4);
  },
};
export default board;
