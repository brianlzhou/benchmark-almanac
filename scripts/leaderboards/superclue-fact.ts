// SuperCLUE-Fact ranks models by total factuality score on its published workbook.
// The headline score is the workbook's 总分 value on a 0 to 100 scale.
// The importer reads the April 2025 results workbook.
import { workbookBoard } from './agentclue.ts';
export default workbookBoard({
  benchmark: 'superclue-fact', url: 'https://www.superclueai.com/specialized/Fact',
  feed: 'https://www.superclueai.com/data/specialized_list/Fact/2025%E5%B9%B44%E6%9C%88.xlsx',
  sheet: '总榜', model: '模型名称', score: '总分', minimum: 8,
  parts: ['知识幻觉', '常识幻觉', '对抗性幻觉', '上下文幻觉'],
});
