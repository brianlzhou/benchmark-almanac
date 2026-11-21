// SuperCLUE-DeepSearch evaluates web research. The model and agent tracks both publish an overall score.
// Each track's two workbook sheets break that score down by subject and difficulty.
import type { Leaderboard } from './types.ts';
import { loadWorkbook, workbookBoard } from './agentclue.ts';

const common = {
  benchmark: 'superclue-deepsearch',
  url: 'https://www.superclueai.com/agent/DeepSearch',
  feed: 'https://www.superclueai.com/data/agent_list/DeepSearch/2025%E5%B9%B411%E6%9C%88.xlsx',
  roundFolder: 'DeepSearch',
  score: '总分',
  settings: ['赛道', '使用方式', '具体使用版本'],
  parts: ['人文社科', '工程技术', '自然科学'],
};
function track(name: string, model: string, minimum: number, load = loadWorkbook) {
  return workbookBoard({
    ...common, sheet: name + '赛道-按任务类型划分', model, minimum,
    details: [{ sheet: name + '赛道-按难度等级划分', model, parts: ['level1', 'level2', 'level3'] }],
  }, load);
}
const board: Leaderboard = {
  ...track('模型', '模型名称', 11),
  async fetch() {
    const book = await loadWorkbook(common.feed, common.roundFolder);
    const load = async () => book;
    return [
      ...await track('模型', '模型名称', 11, load).fetch(),
      ...await track('智能体', '产品名称', 13, load).fetch(),
    ];
  },
};
export default board;
