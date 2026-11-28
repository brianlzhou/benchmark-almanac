// CFLUE tests Chinese financial knowledge and applications. The repository ranks knowledge models by accuracy.
// The application tasks have different metrics, so the headline uses knowledge accuracy and retains application scores separately.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/aliyun/cflue/HEAD/README.md';
const parts: Record<string, BoardPart> = {};
const knowledge = ['Acc', 'Weighted-F1', 'BLEU-1', 'BLEU-4', 'ROUGE-1', 'ROUGE-2', 'ROUGE-L'];
const application = ['Fin_TC accuracy', 'Fin_MT en2zh BLEU-4', 'Fin_MT en2zh COMET', 'Fin_MT zh2en BLEU-4', 'Fin_MT zh2en COMET', 'Fin_RE F1', 'Fin_RC ROUGE-L', 'Fin_TG ROUGE-L', 'Application average'];
for (const [name, group] of [...knowledge.map(name => [name, 'Knowledge assessment'] as const), ...application.map(name => [name, 'Application assessment'] as const)]) {
  const key = name.replace(/[^A-Za-z0-9]/g, '');
  parts[key] = { name, group, unit: name === 'Acc' || name.endsWith('accuracy') ? '%' : 'score', better: 'higher' };
}
function table(text: string, section: string) {
  const chunk = text.split('### ' + section + '\n')[1]?.split(/\n##/)[0];
  if (!chunk) throw new Error('Missing ' + section);
  return chunk.split('\n').filter(l => l.startsWith('|')).map(l => l.split('|').slice(1,-1).map(c => c.trim().replaceAll('**','')));
}
function metrics(cells: string[], names: string[], group: string) {
  if (cells.length !== names.length) throw new Error('Missing ' + group + ' column');
  const result: Record<string, number> = {};
  names.forEach((name, i) => {
    const m = /^([\d.]+)(?:[±+]([\d.]+))?$/.exec(cells[i]);
    if (!m) throw new Error('Invalid ' + name);
    const key = name.replace(/[^A-Za-z0-9]/g, '');
    result[key] = Number(m[1]);
    if (m[2]) result[key + 'Std'] = Number(m[2]);
  });
  return result;
}
const board: Leaderboard = {
  benchmark: 'cflue', url: 'https://github.com/aliyun/cflue#leaderboard', feed, parts,
  terms: 'The project uses MIT and licenses the dataset under CC BY-NC-SA 4.0. https://github.com/aliyun/cflue#licenses',
  headline: 'The leaderboard gives no combined score, so the headline uses accuracy on its first assessment, financial knowledge.',
  async fetch() {
    const readme = await fetchText(feed);
    const k = table(readme, 'Knowledge Assessment');
    const a = table(readme, 'Application Assessment');
    if (k[0].slice(1).join('|') !== knowledge.join('|') || a[0][1] !== 'Fin_TC' || a[0].at(-1) !== 'Avg.' ||
      a[2].slice(1).join('|') !== 'ACC|BLEU-4|COMET|BLEU-4|COMET|F1|ROUGE-L|ROUGE-L|-') throw new Error('CFLUE headers changed');
    const apps = new Map(a.slice(3).map(([model, ...cells]) => [model.toLowerCase(), metrics(cells, application, 'Application assessment')]));
    return checked(k.slice(2).map(([model, ...cells]) => {
      const values = metrics(cells, knowledge, 'Knowledge assessment');
      return { model, setting: 'Zero-shot', score: values.Acc, metrics: { ...values, ...apps.get(model.toLowerCase()) } };
    }), 17);
  },
};
export default board;
