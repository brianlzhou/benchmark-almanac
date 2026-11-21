// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FinMTEB tests financial text embeddings in English and Chinese. The board averages datasets within each task,
// then averages the available task scores for each language. Only models with both language scores enter the mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { execFileSync } from 'node:child_process';

const url = 'https://huggingface.co/spaces/FinanceMTEB/FinMTEB';
const feed = url + '/resolve/main/benchmark.xlsx';
const reader = `
import io, json, sys, zipfile
from collections import defaultdict
from statistics import mean
from xml.etree import ElementTree as ET
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as book:
    tasks = defaultdict(dict)
    sheet_names = ET.fromstring(book.read('xl/workbook.xml')).findall('.//{*}sheet')
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))}
    for sheet in sheet_names:
        task, lang = sheet.get('name').rsplit('_', 1)
        if lang not in ('en','zh'): raise ValueError('Unexpected worksheet')
        rel = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        target = rels[rel]
        path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        rows = ET.fromstring(book.read(path)).findall('.//{*}sheetData/{*}row')
        def cells(row):
            return {c.get('r').rstrip('0123456789'): ''.join(c.itertext()).strip() for c in row}
        headers = cells(rows[0])
        if headers.get('A') != 'Model': raise ValueError('Missing model column')
        dataset_cols = [k for k,v in headers.items() if v and v not in ('Model', 'URL')]
        for row in rows[1:]:
            data = cells(row)
            name = data.get('A')
            if not name or name == 'BOW': continue
            scores = [float(data[k]) for k in dataset_cols if data.get(k)]
            if scores: tasks[name][lang + '_' + task] = mean(scores)
    result = []
    for model, metrics in tasks.items():
        en = [v for k,v in metrics.items() if k.startswith('en_')]
        zh = [v for k,v in metrics.items() if k.startswith('zh_')]
        if en and zh:
            metrics.update(en=mean(en), zh=mean(zh))
            result.append(dict(model=model, score=(metrics['en']+metrics['zh'])/2, metrics=metrics))
    print(json.dumps(result))
`;
const board: Leaderboard = {
  benchmark: 'finmteb', url, feed, terms: 'The makers publish the board on Hugging Face. https://huggingface.co/terms-of-service',
  parts: {
    en: 'English', zh: 'Chinese',
    en_STS: { name: 'Semantic textual similarity', group: 'English' }, zh_STS: { name: 'Semantic textual similarity', group: 'Chinese' },
    en_Classification: { name: 'Classification', group: 'English' }, zh_Classification: { name: 'Classification', group: 'Chinese' },
    en_Retrieval: { name: 'Retrieval', group: 'English' }, zh_Retrieval: { name: 'Retrieval', group: 'Chinese' },
    en_Clustering: { name: 'Clustering', group: 'English' }, zh_Clustering: { name: 'Clustering', group: 'Chinese' },
    en_Reranking: { name: 'Reranking', group: 'English' }, zh_Reranking: { name: 'Reranking', group: 'Chinese' },
    en_Sum: { name: 'Summarization', group: 'English' }, zh_Sum: { name: 'Summarization', group: 'Chinese' },
    en_PairClassification: { name: 'Pair classification', group: 'English' }, zh_PairClassification: { name: 'Pair classification', group: 'Chinese' },
  },
  async fetch() {
    const rows = JSON.parse(execFileSync('python3', ['-c', reader], { input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8' })) as LeaderboardRow[];
    const tasks: Record<string,string> = { STS:'STS', Classification:'Classification', Retrieval:'Retrieval', Clustering:'Clustering', Reranking:'Reranking', Sum:'Summarization', PairClassification:'Pair Classification' };
    for (const [lang, group] of [['en','English'], ['zh','Chinese']]) {
      for (const [task,name] of Object.entries(tasks)) board.parts![lang + '_' + task] = { name, group };
    }
    return checked(rows, 5);
  },
};
export default board;
