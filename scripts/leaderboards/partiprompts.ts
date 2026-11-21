// PartiPrompts tests how well generated images match written prompts.
// Open Parti Prompts counts each selected model as one vote and includes unsolved votes in the denominator.
// The leaderboard rounds the overall fraction to two decimal places before displaying it as a percentage.
import type { Leaderboard, BoardPart } from './types.ts';
import { parquetReadObjects } from 'hyparquet';
import { fetchBytes, fetchJson, fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const org = 'result-kand2-sdxl-wuerst-karlo';
const feed = 'https://huggingface.co/api/datasets?author=' + org + '&full=true&limit=1000';
const names = new Map(Object.entries({ kand2: 'Kandinsky 2.2', sdxl: 'Stable Diffusion XL', wuerst: 'Wuerstchen', karlo: 'Karlo' }));
type Submission = { id: string; cardData: { dataset_info: { splits: { name: string; num_examples: number }[] } } };


const board: Leaderboard = {
  benchmark: 'partiprompts', url: 'https://huggingface.co/spaces/OpenGenAI/parti-prompts-leaderboard', feed,
  host: 'Open Parti Prompts', terms: 'Public human preference submissions on Hugging Face. https://huggingface.co/terms-of-service',
  async fetch() {
    const prompts = await fetchText('https://huggingface.co/datasets/nateraw/parti-prompts/resolve/main/PartiPrompts.tsv');
    const [header, ...lines] = prompts.trimEnd().split(/\r?\n/);
    if (!header.startsWith('Prompt\tCategory\tChallenge')) throw new Error('Missing prompt categories');
    const groups = lines.map(line => line.split('\t').slice(1, 3));
    const counts = new Map<string, Map<string, number>>();
    const parts: Record<string, BoardPart> = {};
    const submissions = await fetchJson<Submission[]>(feed);
    if (!submissions.length || submissions.length === 1000) throw new Error('Empty or incomplete submission index');
    for (const { id, cardData } of submissions) {
      if (!id.startsWith(org + '/')) throw new Error('Unexpected submission organization');
      const size = cardData.dataset_info.splits.find(split => split.name === 'train')?.num_examples;
      if (!size) throw new Error('Missing train split size for ' + id);
      let read = 0;
      for (let shard = 0; read < size; shard++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const url = 'https://huggingface.co/api/datasets/' + id + '/parquet/default/train/' + shard + '.parquet';
        const votes = await parquetReadObjects({ file: await fetchBytes(url) });
        if (!votes.length || read + votes.length > size) throw new Error('Unexpected vote count in ' + id);
        read += votes.length;
        for (const row of votes) {
          const prompt = Number(row.id);
          if (groups[prompt]?.length !== 2 || typeof row.result !== 'string') throw new Error('Invalid vote in ' + id);
          const keys = ['Overall'];
          for (const [i, name] of groups[prompt].entries()) {
            const group = i === 0 ? 'Category' : 'Challenge';
            const key = group + ': ' + name;
            keys.push(key);
            parts[key] = { name, group };
          }
          for (const vote of row.result.split(',')) {
            if (vote !== '' && !names.has(vote)) throw new Error('Unknown vote: ' + vote);
            for (const key of keys) {
              const group = counts.get(key) ?? new Map<string, number>();
              group.set(vote, (group.get(vote) ?? 0) + 1);
              counts.set(key, group);
            }
          }
        }
      }
    }
    board.parts = parts;
    function percentage(key: string, model: string) {
      const tally = counts.get(key)!;
      return 100 * (tally.get(model) ?? 0) / [...tally.values()].reduce((a, b) => a + b, 0);
    }
    return checked([...names].map(([key, model]) => ({
      model, score: Math.round(percentage('Overall', key)),
      metrics: { votes: counts.get('Overall')!.get(key) ?? 0,
        ...Object.fromEntries(Object.keys(parts).map(part => [part, Number(percentage(part, key).toFixed(2))])) },
    })), 4);
  },
};
export default board;
