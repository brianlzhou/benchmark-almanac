// SuperCLUE-Fin ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-fin",
  url: "https://www.superclueai.com/specialized/Fin",
  feed: "https://www.superclueai.com/data/specialized_list/Fin/2026%E5%B9%B47%E6%9C%88.xlsx",
  roundFolder: "Fin",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 11,
  parts: ["金融知识认知", "金融文本理解", "金融判别与分析", "金融计算与数值推理", "金融场景应用", "金融合规与风控"],
  details: [{"sheet": "耗时、成本、token", "model": "模型名称", "parts": ["平均每题耗时（秒）", "平均每题成本 （元）", "平均每题token消耗"]}],
});
