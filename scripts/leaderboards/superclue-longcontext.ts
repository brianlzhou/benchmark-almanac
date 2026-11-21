// SuperCLUE-LongContext ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-longcontext",
  url: "https://www.superclueai.com/specialized/LongContext",
  feed: "https://www.superclueai.com/data/specialized_list/LongContext/2026%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "LongContext",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 15,
  parts: ["64K–128K", "128K–256K", "256K–512K", "512K–1M", "原文复刻", "句后插入", "多段提取拼接", "条件筛选", "关系定位", "8 needles", "12 needles", "16 needles"],
});
