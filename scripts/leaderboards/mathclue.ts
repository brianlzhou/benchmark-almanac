// MathCLUE ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "mathclue",
  url: "https://www.superclueai.com/specialized/MathCLUE",
  feed: "https://www.superclueai.com/data/specialized_list/MathCLUE/2025%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "MathCLUE",
  sheet: "总榜单",
  model: "模型",
  score: "总分",
  minimum: 28,
  parts: [],
  settings: ["使用方式"],
});
