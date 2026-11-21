// Civil-Bench ranks models on Chinese engineering exams by the composite score in the OpenCompass JSON feed.
// The six subject tables report separate exam scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://openmmlab-open.oss-cn-shanghai.aliyuncs.com/opencompass/special/prod/score_result.json";
const board: Leaderboard = {
  benchmark: "civil-bench-tongji",
  url: "https://specialist.opencompass.org.cn/CivilBench",
  feed: FEED,
  terms: "OpenCompass displays an all rights reserved notice. I found no separate license for the score file. https://specialist.opencompass.org.cn/CivilBench The site's robots.txt disallows assets and JSON on its own host.",
  parts: {},
  async fetch() {
    const data = await fetchJson<Record<string, Record<string, string | number>[]>>(FEED);
    const full = data['综合得分'];
    const subjects = ['安全工程', '工程管理与建造', '测绘与地理信息', '建筑与结构设计', '土木工程', '环境工程'];
    if (!Array.isArray(full) || full.length < 14) throw new Error('Missing Civil-Bench results');
    return full.map(row => {
      const model = row['模型'];
      const score = row['综合得分'];
      if (typeof model !== 'string' || typeof score !== 'number') throw new Error('Invalid Civil-Bench score');
      const metrics: Record<string, number> = {};
      for (const subject of subjects) {
        const detail = data[subject]?.find(r => r['模型'] === model);
        const value = row[subject + '类'];
        if (typeof value !== 'number' || !detail) throw new Error('Missing Civil-Bench subject ' + subject);
        metrics[subject] = value;
        board.parts![subject] = subject;
        for (const [exam, subscore] of Object.entries(detail)) {
          if (exam === '综合得分' || typeof subscore !== 'number') continue;
          metrics[exam] = subscore;
          board.parts![exam] = { name: exam, group: subject };
        }
      }
      const size = String(row['参数量']).match(/^([\d.]+)B$/i);
      return { model, score, open: row['类型'] === 'Open Source', params: size ? Number(size[1]) : undefined, metrics };
    });
  },
};
export default board;
