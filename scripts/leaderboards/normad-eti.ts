// NormAd-Eti tests judgments of social acceptability. The authors compute accuracy by comparing the low-temperature prediction with the gold label.
// The repository's model_outputs.zip contains the prediction CSVs for five prompting contexts. Four older GPT-3.5 files use different stories.
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchBytes, parseCsv } from '../lib/util.ts';

const feed = 'https://media.githubusercontent.com/media/Akhila-Yerukola/NormAd/main/src/analysis/model_outputs.zip';
const contexts: Record<string,string> = {
  country: 'Country', cval: 'Country and value', rot: 'Rule of thumb', value: 'Value', none: 'No context',
};
const board: Leaderboard = {
  benchmark: 'normad-eti', url: 'https://github.com/Akhila-Yerukola/NormAd', feed,
  terms: 'NormAd is licensed under CC BY 4.0: https://github.com/Akhila-Yerukola/NormAd#license.',
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(),'normad-'));
    try {
      const archive = join(dir,'outputs.zip');
      await writeFile(archive, Buffer.from(await fetchBytes(feed,{},2,120000)));
      const paths = execFileSync('unzip',['-Z1',archive],{encoding:'utf8'}).trim().split('\n');
      const rows: LeaderboardRow[] = [];
      const parts: Record<string,BoardPart> = {};
      let reference: string | undefined;
      for (const path of paths) {
        const match = path.match(/^model_outputs\/all_model_outputs\/([^/]+)\/etiquette_(\w+)_conditioned_[\w.-]+\.csv$/);
        if (!match) continue;
        const items = parseCsv(execFileSync('unzip',['-p',archive,path],{encoding:'utf8',maxBuffer:32*1024*1024}));
        if (items.length === 2708 && match[1] === 'gpt-3.5-turbo-0125' && match[2] !== 'cval') continue;
        const prediction = 'prediction_label_temp0.0' in items[0] ? 'prediction_label_temp0.0' : 'prediction_label_temp0.001';
        const sourceModel = items[0].model;
        const archangel = match[1].match(/^archangel_(\d+b)_sft(?:_(dpo|ppo|kto))?$/);
        const llama = match[1].match(/^llama-?2-(\d+b)-chat(?:-hf)?$/i);
        const model = archangel ? 'ContextualAI/archangel_sft' + (archangel[2] ? '-' + archangel[2] : '') + '_llama' + archangel[1] :
          llama ? 'meta-llama/Llama-2-' + llama[1] + '-chat-hf' : match[1] === 'gpt4' ? 'gpt-4' : match[1];
        if (items.length !== 2633 || !contexts[match[2]] || !model || !(prediction in items[0])) throw new Error('Unexpected NormAd file: ' + path);
        const stories = items.map(r => JSON.stringify([r.Country,r.Story,r['Gold Label']])).sort().join('\n');
        reference ??= stories;
        if (reference !== stories) throw new Error('Different NormAd stories: ' + path);
        const counts = new Map<string,{correct:number,total:number}>();
        let correct = 0;
        for (const r of items) {
          if (!r.Subaxis || !r.Country || !['yes','no','neutral'].includes(r['Gold Label']) || r.model !== sourceModel) throw new Error('Invalid NormAd row');
          const hit = Number(r[prediction] === r['Gold Label']);
          correct += hit;
          for (const [group,name] of [['Country',r.Country],['Subaxis',r.Subaxis],['Gold label',r['Gold Label']]]) {
            const key = group + ':' + name;
            parts[key] ??= {name: name.replaceAll('_',' '), group};
            const count = counts.get(key) ?? {correct:0,total:0};
            count.correct += hit;
            count.total++;
            counts.set(key,count);
          }
        }
        rows.push({model, setting: contexts[match[2]], score: 100 * correct/items.length,
          metrics: Object.fromEntries([...counts].map(([k,c]) => [k, 100 * c.correct/c.total]))});
      }
      board.parts = parts;
      return checked(rows,96);
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
};
export default board;
