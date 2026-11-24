// GenExam scores text-to-image models on exam prompts from ten subjects.
// OpenGVLab's leaderboard publishes overall Strict Score first, followed by Relaxed Score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/OpenGVLab/GenExam/main/README.md';
const subjects = ['Math', 'Phy', 'Chem', 'Bio', 'Geo', 'Comp', 'Eng', 'Econ', 'Music', 'Hist'];
const board: Leaderboard = {
  benchmark: 'genexam', feed, url: 'https://github.com/OpenGVLab/GenExam#-leaderboard',
  terms: 'OpenGVLab releases GenExam under MIT. https://github.com/OpenGVLab/GenExam/blob/main/LICENSE',
  aliases: { 'Nano Banana Pro': 'gemini-3-pro-image-preview-nano-banana-pro', 'Imagen-4-Ultra': 'imagen-4-ultra-generate-001' },
  headline: 'Overall Strict Score on the full OpenGVLab GenExam leaderboard.',
  parts: Object.fromEntries(subjects.flatMap(s => [[s, { name: s, group: 'Strict Score' }],
    ['relaxed' + s, { name: s, group: 'Relaxed Score' }]])),
  stats: { relaxed: { name: 'Overall Relaxed Score', unit: 'score', better: 'higher' } },
  async fetch() {
    const readme = await fetchText(feed);
    function scores(heading: string) {
      const section = readme.split('### ' + heading)[1]?.split(/\n###? /)[0];
      const table = section && tables(section)[0];
      if (!table || table[0].map(c => c.text).join('|') !== ['Model', ...subjects, 'Overall'].join('|')) {
        throw new Error('Missing GenExam ' + heading + ' columns');
      }
      const result = new Map<string, { scores: number[], open: boolean }>();
      let open = false;
      for (const row of table.slice(1)) {
        const [model, ...values] = row.map(c => c.text);
        if (!values.length && /^(Open|Closed)-source /.test(model)) {
          open = model.startsWith('Open-source');
          continue;
        }
        if (values.length !== 11 || values.some(v => !/^\d+(?:\.\d+)?$/.test(v)) || result.has(model)) {
          throw new Error('Invalid GenExam row: ' + model);
        }
        result.set(model, { scores: values.map(Number), open });
      }
      return result;
    }
    const strict = scores('Strict Score');
    const relaxed = scores('Relaxed Score');
    if (strict.size !== relaxed.size) throw new Error('GenExam score tables differ');
    return checked(Array.from(strict, ([name, { scores: values, open }]) => {
      const other = relaxed.get(name)?.scores;
      if (!other) throw new Error('Missing Relaxed Score for ' + name);
      const identity = name.match(/^(.+?) \((thinking|w\/o PE)\)$/);
      const metrics: Record<string, number> = { relaxed: other[10] };
      subjects.forEach((s, i) => { metrics[s] = values[i]; metrics['relaxed' + s] = other[i]; });
      return { model: identity?.[1] ?? name, setting: identity?.[2], score: values[10], open, metrics };
    }), 36);
  },
};
export default board;
