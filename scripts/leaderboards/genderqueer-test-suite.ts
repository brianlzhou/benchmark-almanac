// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The paper tests Icelandic pronouns, adjectives and terminology. Figures 2 and 6 print pronoun and adjective accuracy.
// Figure 5 prints no values for terminology, only bars, so the importer leaves terminology out rather than estimate it.
// A second transcription checked the printed cells. The PDF hash guards them.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2024.wmt-1.26.pdf';
const values: [string,number,number][]=[
  ['Claude-3.5',88.5,88.9],['GPT-4',87.8,47.5],['Unbabel-Tower70B',81.8,70.6],
  ['Llama3-70B',68.5,20.6],['CommandR-plus',54.7,5.9],['Aya23',25.2,2.9],
];
const board: Leaderboard={
  benchmark:'genderqueer-test-suite',static:'paper',url:'https://aclanthology.org/2024.wmt-1.26/',feed,
  terms:'ACL Anthology publishes the paper and license at https://aclanthology.org/2024.wmt-1.26/.',
  headline:'The paper reports no overall score, so this is the plain mean of pronoun and adjective accuracy.',
  parts:{pronouns:'Pronoun accuracy',adjectives:'Adjective accuracy'},
  async fetch(){
    const rows=values.map(([model,pronouns,adjectives])=>({model,score:(pronouns+adjectives)/2,
      metrics:{pronouns,adjectives}}));
    return checked(await chartRows(feed,'49ccde862256645cbdb3bcb77476d39c4cb317984e1640753aed7733a0c6f12b',rows),6);
  },
};
export default board;
