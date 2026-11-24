// SpeechIO ranks Mandarin transcription systems by character error rate across all test sets. The README also reports locked, unlocked and individual test-set scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/SpeechColab/Leaderboard/master/README.md";
function percent(value: string) {
  if (!/^\d+(?:\.\d+)?%$/.test(value)) throw new Error('Invalid SpeechIO CER: ' + value);
  return parseFloat(value);
}

const testSets: [string, string][] = [
  ['SPEECHIO_ASR_ZH00001', '新闻联播'], ['SPEECHIO_ASR_ZH00002', '访谈'], ['SPEECHIO_ASR_ZH00003', '电视节目'],
  ['SPEECHIO_ASR_ZH00004', '场馆演讲'], ['SPEECHIO_ASR_ZH00005', '在线教育'], ['SPEECHIO_ASR_ZH00006', '直播'],
  ['SPEECHIO_ASR_ZH00007', '直播'], ['SPEECHIO_ASR_ZH00008', '线下培训'], ['SPEECHIO_ASR_ZH00009', '播客'],
  ['SPEECHIO_ASR_ZH00010', '播客'], ['SPEECHIO_ASR_ZH00011', '在线教育'], ['SPEECHIO_ASR_ZH00012', '在线教育'],
  ['SPEECHIO_ASR_ZH00013', '短视频'], ['SPEECHIO_ASR_ZH00014', '短视频'], ['SPEECHIO_ASR_ZH00015', '评书'],
  ['SPEECHIO_ASR_ZH00016', '相声'], ['SPEECHIO_ASR_ZH00017', '脱口秀'], ['SPEECHIO_ASR_ZH00018', '少儿卡通'],
  ['SPEECHIO_ASR_ZH00019', '体育赛事解说'], ['SPEECHIO_ASR_ZH00020', '纪录片'], ['SPEECHIO_ASR_ZH00021', '短视频'],
  ['SPEECHIO_ASR_ZH00022', '短视频'], ['SPEECHIO_ASR_ZH00023', '短视频'], ['SPEECHIO_ASR_ZH00024', '短视频'],
  ['SPEECHIO_ASR_ZH00025', '线下课堂'], ['SPEECHIO_ASR_ZH00026', '广播电台节目'], ['SPEECHIO_ASR_ZH00027', '华语大学生辩论赛'],
  ['SPEECHIO_ASR_ZH00028', '同声传译：时政&社会公共治理'], ['SPEECHIO_ASR_ZH00029', '港台口音：港台明星访谈'], ['SPEECHIO_ASR_ZH00030', '老外口音：《世界青年说》'],
  ['SPEECHIO_ASR_ZH00031', '直播带货'], ['SPEECHIO_ASR_ZH00032', '音乐'], ['SPEECHIO_ASR_ZH00033', '芯片'],
  ['SPEECHIO_ASR_ZH00034', '网络IT'], ['SPEECHIO_ASR_ZH00035', '新氧医美'], ['SPEECHIO_ASR_ZH00036', '交通广播'],
  ['SPEECHIO_ASR_ZH00037', '在线会议聊天'], ['SPEECHIO_ASR_ZH00038', '电影：疯狂石头+疯狂赛车（方言杂烩）'], ['SPEECHIO_ASR_ZH00039', '电影：1942（河南话）'],
  ['SPEECHIO_ASR_ZH00040', '电影：白鹿原（陕西话）'], ['SPEECHIO_ASR_ZH00041', '电影：让子弹飞（四川话）'], ['SPEECHIO_ASR_ZH00042', '电影：人生大事（武汉话）'],
  ['SPEECHIO_ASR_ZH00043', '听障'], ['SPEECHIO_ASR_ZH00044', '诗词'], ['SPEECHIO_ASR_ZH00045', '文言文'], ['SPEECHIO_ASR_ZH00046', '歌词'],
];

const board: Leaderboard = {
  benchmark: "speechio-asr-leaderboard",
  url: "https://github.com/SpeechColab/Leaderboard#5-latest-results",
  feed: FEED,
  terms: "The January 2025 table lists seven public systems and one private system. The repository does not state reuse terms at https://github.com/SpeechColab/Leaderboard.",
  parts: {
    Locked: 'Locked', Unlocked: 'Unlocked',
    ...Object.fromEntries(testSets.map(([key, label]) => [key, { name: key + ' ' + label, group: 'Test Set' }])),
  },
  async fetch() {
    const page = (await fetchText(FEED)).split('## 5. Latest Results')[1];
    if (!page) throw new Error('Missing SpeechIO results');
    const rows = [];
    for (const scope of ['Public', 'Private']) {
      const section = page.split('### ' + scope + ' Models')[1]?.split(/^### /m)[0];
      if (!section) throw new Error('Missing ' + scope + ' models');
      const scores = new Map<string, Record<string, number>>();
      for (const split of ['Unlocked', 'Locked', 'All']) {
        const source = section.split('#### **' + split + '** SpeechIO test sets')[1];
        if (!source) throw new Error('Missing SpeechIO split ' + split);
        const table = markdownTables(source)[0];
        const headers = table[0];
        const modelCol = headers.indexOf('Model 模型'), cer = headers.indexOf('CER 字错误率'), date = headers.indexOf('Date 时间');
        if ([modelCol, cer, date].includes(-1) || table.length < (scope === 'Public' ? 8 : 2)) throw new Error('Incomplete SpeechIO table');
        for (const cells of table.slice(1)) {
          const model = cells[modelCol].replace(/\(\*?\)$/, '');
          const metrics = scores.get(model) ?? {};
          metrics[split] = percent(cells[cer]);
          if (!/^\d{4}\.\d{2}$/.test(cells[date])) throw new Error('Unexpected SpeechIO result month');
          scores.set(model, metrics);
        }
      }
      const detail = markdownTables(section).find(t => t[0][0] === 'Test Set ID');
      if (detail) for (const cells of detail.slice(1)) {
        const key = cells[0];
        for (const [column, model] of detail[0].entries()) {
          const metrics = scores.get(model);
          if (!metrics) continue;
          if (!cells[column] || !Number.isFinite(Number(cells[column]))) throw new Error('Invalid SpeechIO test-set score');
          metrics[key] = Number(cells[column]);
        }
      }
      for (const [model, { All: score, ...metrics }] of scores) {
        if (![score, metrics.Locked, metrics.Unlocked].every(Number.isFinite)) throw new Error('Missing SpeechIO split for ' + model);
        rows.push({ model, score, metrics });
      }
    }
    return rows;
  },
};
export default board;
