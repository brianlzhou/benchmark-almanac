// SuperCLUE-Science ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-science",
  url: "https://www.superclueai.com/specialized/Science",
  feed: "https://www.superclueai.com/data/specialized_list/Science/2025%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "Science",
  sheet: "总榜单",
  model: "模型",
  score: "总分",
  minimum: 23,
  parts: ["物理", "化学", "生物"],
  settings: ["使用方式"],
  metrics: {"reasoningLevel": "推理等级"},
});
