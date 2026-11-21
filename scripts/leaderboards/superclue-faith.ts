// SuperCLUE-Faith ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-faith",
  url: "https://www.superclueai.com/specialized/Faith",
  feed: "https://www.superclueai.com/data/specialized_list/Faith/2025%E5%B9%B412%E6%9C%88.xlsx",
  roundFolder: "Faith",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: [],
  settings: ["使用方式"],
});
